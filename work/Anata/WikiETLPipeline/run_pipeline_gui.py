import os
import queue
import re
import subprocess
import threading
import time
import uuid
import webbrowser
from pathlib import Path
from tempfile import NamedTemporaryFile
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from urllib.parse import unquote, urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parent
COMPOSE_FILE = ROOT / "docker-compose.yml"
QUEUE_NAME = "wikipedia_links"
STORER_COUNT = 4
POLL_SECONDS = 2
CRAWL_PROGRESS_MAX = 70
STORAGE_PROGRESS_MAX = 96
ESTIMATED_PAGE_COUNTS = {1: 344, 2: 57706}
DOCUMENTS = Path.home() / "Documents"
DEFAULT_OUTPUT_DIR = DOCUMENTS if DOCUMENTS.is_dir() else Path.home()
DEFAULT_START_URL = "https://en.wikipedia.org/wiki/Freedom_of_Information_Act_(United_States)"
NON_ARTICLE_NAMESPACES = {
    "category", "file", "help", "mediawiki", "module", "portal", "special",
    "talk", "template", "timedtext", "user", "wikipedia", "draft",
}


class PipelineGui:
    def __init__(self, root):
        self.root = root
        self.events = queue.Queue()
        self.running = False
        self.cancel_requested = threading.Event()
        self.csv_path = None
        self.started_at = None
        self.crawl_started_at = None
        self.selected_depth = 2
        self.start_url = tk.StringVar(value=DEFAULT_START_URL)
        self.depth = tk.IntVar(value=2)
        self.output_name = tk.StringVar(value=str(DEFAULT_OUTPUT_DIR / "wiki-links.csv"))
        self.status = tk.StringVar(value="Choose a crawl depth and CSV filename.")
        self.detail = tk.StringVar(value="")
        self.progress_value = tk.DoubleVar(value=0)
        self.progress_text = tk.StringVar(value="0% estimated")
        self.elapsed_text = tk.StringVar(value="Elapsed: 00:00")
        self.eta_text = tk.StringVar(value="ETA: --:--")

        root.title("Wikipedia Link Collector")
        root.geometry("760x390")
        root.minsize(620, 350)
        root.protocol("WM_DELETE_WINDOW", self.close)

        main = ttk.Frame(root, padding=20)
        main.pack(fill="both", expand=True)
        main.columnconfigure(1, weight=1)

        ttk.Label(main, text="Wikipedia Link Collector", font=("Segoe UI", 16, "bold")).grid(
            row=0, column=0, columnspan=3, sticky="w", pady=(0, 18)
        )

        ttk.Label(main, text="Starting Wikipedia page").grid(row=1, column=0, sticky="w", pady=5)
        ttk.Entry(main, textvariable=self.start_url).grid(
            row=1, column=1, columnspan=2, sticky="ew"
        )

        ttk.Label(main, text="Crawl depth").grid(row=2, column=0, sticky="w", pady=5)
        depth_frame = ttk.Frame(main)
        depth_frame.grid(row=2, column=1, columnspan=2, sticky="w")
        ttk.Radiobutton(depth_frame, text="1", value=1, variable=self.depth).pack(side="left", padx=(0, 18))
        ttk.Radiobutton(depth_frame, text="2", value=2, variable=self.depth).pack(side="left")

        ttk.Label(main, text="Output CSV").grid(row=3, column=0, sticky="w", pady=5)
        ttk.Entry(main, textvariable=self.output_name).grid(row=3, column=1, sticky="ew", padx=(0, 8))
        ttk.Button(main, text="Browse...", command=self.browse).grid(row=3, column=2)

        self.progress = ttk.Progressbar(
            main, mode="determinate", maximum=100, variable=self.progress_value
        )
        self.progress.grid(row=4, column=0, columnspan=3, sticky="ew", pady=(20, 5))
        metrics = ttk.Frame(main)
        metrics.grid(row=5, column=0, columnspan=3, sticky="ew", pady=(0, 8))
        ttk.Label(metrics, textvariable=self.progress_text).pack(side="left")
        ttk.Label(metrics, textvariable=self.elapsed_text).pack(side="left", padx=(20, 0))
        ttk.Label(metrics, textvariable=self.eta_text).pack(side="right")
        ttk.Label(main, textvariable=self.status, wraplength=510).grid(
            row=6, column=0, columnspan=3, sticky="w"
        )
        ttk.Label(main, textvariable=self.detail, wraplength=510).grid(
            row=7, column=0, columnspan=3, sticky="w", pady=(4, 0)
        )

        button_frame = ttk.Frame(main)
        button_frame.grid(row=8, column=0, columnspan=3, sticky="ew", pady=(18, 0))
        self.start_button = ttk.Button(button_frame, text="Start crawl", command=self.start)
        self.start_button.pack(side="left")
        self.cancel_button = ttk.Button(
            button_frame, text="Cancel", command=self.cancel, state="disabled"
        )
        self.cancel_button.pack(side="left", padx=(8, 0))
        self.open_button = ttk.Button(button_frame, text="Open CSV", command=self.open_csv, state="disabled")
        self.open_button.pack(side="left", padx=(8, 0))

        self.root.after(150, self.process_events)

    def browse(self):
        current_path = Path(self.output_name.get()).expanduser()
        initial_dir = current_path.parent if current_path.parent.is_dir() else DEFAULT_OUTPUT_DIR
        path = filedialog.asksaveasfilename(
            parent=self.root,
            title="Save crawl results",
            initialdir=str(initial_dir),
            initialfile=Path(self.output_name.get()).name or "wiki-links.csv",
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv")],
        )
        if path:
            self.output_name.set(path)

    def resolve_output(self):
        path = Path(self.output_name.get()).expanduser()
        if not path.is_absolute():
            path = ROOT / path
        if path.suffix.lower() != ".csv":
            path = path.with_suffix(".csv")
        return path.resolve()

    @staticmethod
    def validate_start_url(value):
        parsed = urlsplit(value.strip())
        try:
            valid_host = (
                parsed.scheme.lower() == "https"
                and parsed.hostname == "en.wikipedia.org"
                and parsed.port in (None, 443)
                and parsed.username is None
                and parsed.password is None
            )
        except ValueError:
            valid_host = False

        if not valid_host or not parsed.path.startswith("/wiki/"):
            raise ValueError("Enter an HTTPS English Wikipedia article URL, such as https://en.wikipedia.org/wiki/Example.")

        title = unquote(parsed.path[len("/wiki/"):]).strip("/")
        if not title:
            raise ValueError("The URL must point to a Wikipedia article, not the /wiki/ root.")
        namespace = title.partition(":")[0].casefold()
        if namespace in NON_ARTICLE_NAMESPACES:
            raise ValueError("Choose an article page, not a category, file, help, talk, or other special page.")

        return urlunsplit(("https", "en.wikipedia.org", parsed.path, parsed.query, ""))

    def start(self):
        if self.running:
            return

        try:
            start_url = self.validate_start_url(self.start_url.get())
        except ValueError as error:
            messagebox.showerror("Invalid starting page", str(error), parent=self.root)
            return

        try:
            output = self.resolve_output()
            output.parent.mkdir(parents=True, exist_ok=True)
        except OSError as error:
            messagebox.showerror("Invalid output path", str(error), parent=self.root)
            return

        if output.exists() and not messagebox.askyesno(
            "Replace existing file?", f"{output} already exists. Replace it?", parent=self.root
        ):
            return

        self.csv_path = None
        self.cancel_requested.clear()
        self.started_at = time.monotonic()
        self.crawl_started_at = None
        self.selected_depth = self.depth.get()
        self.progress_value.set(0)
        self.progress_text.set("0% estimated")
        self.elapsed_text.set("Elapsed: 00:00")
        self.eta_text.set("ETA: calculating...")
        self.open_button.configure(state="disabled")
        self.running = True
        self.start_button.configure(state="disabled")
        self.cancel_button.configure(state="disabled")
        self.status.set("Building services and starting the crawl...")
        self.detail.set("The progress indicator runs while pages are collected and stored.")

        thread = threading.Thread(
            target=self.run_pipeline,
            args=(self.selected_depth, start_url, output),
            daemon=True,
        )
        thread.start()
        self.update_elapsed()

    @staticmethod
    def format_duration(seconds):
        seconds = max(0, int(seconds))
        hours, remainder = divmod(seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        return f"{minutes}:{seconds:02d}"

    def update_elapsed(self):
        if self.running and self.started_at is not None:
            elapsed = time.monotonic() - self.started_at
            self.elapsed_text.set(f"Elapsed: {self.format_duration(elapsed)}")
            self.root.after(1000, self.update_elapsed)

    def cancel(self):
        if self.running and not self.cancel_requested.is_set():
            self.cancel_requested.set()
            self.cancel_button.configure(state="disabled")
            self.status.set("Stopping the crawl and saving the rows already stored...")

    def compose_command(self, project_name):
        return [
            "docker",
            "compose",
            "--project-name",
            project_name,
            "--file",
            str(COMPOSE_FILE),
        ]

    def run_command(self, command, *, env=None, timeout=60, stdout=subprocess.PIPE):
        return subprocess.run(
            command,
            cwd=ROOT,
            env=env,
            stdout=stdout,
            stderr=subprocess.PIPE,
            text=stdout == subprocess.PIPE,
            encoding="utf-8" if stdout == subprocess.PIPE else None,
            errors="replace" if stdout == subprocess.PIPE else None,
            timeout=timeout,
            check=False,
        )

    def run_compose(self, base, args, *, env=None, timeout=60, stdout=subprocess.PIPE):
        result = self.run_command(base + args, env=env, timeout=timeout, stdout=stdout)
        if result.returncode:
            error = result.stderr or "Docker Compose command failed."
            raise RuntimeError(error.strip())
        return result

    def collector_state(self, base, env):
        result = self.run_compose(base, ["ps", "-q", "collector"], env=env)
        container_id = result.stdout.strip().splitlines()
        if not container_id:
            return None
        inspected = self.run_command(
            ["docker", "inspect", "--format", "{{.State.Status}} {{.State.ExitCode}}", container_id[0]],
            env=env,
        )
        if inspected.returncode:
            return None
        fields = inspected.stdout.strip().split()
        if len(fields) != 2:
            return None
        return fields[0], int(fields[1])

    def queue_counts(self, base, env):
        result = self.run_compose(
            base,
            [
                "exec",
                "-T",
                "rabbitmq",
                "rabbitmqctl",
                "-q",
                "list_queues",
                "name",
                "messages_ready",
                "messages_unacknowledged",
            ],
            env=env,
            timeout=30,
        )
        for line in result.stdout.splitlines():
            fields = line.split()
            if len(fields) >= 3 and fields[0] == QUEUE_NAME:
                return int(fields[-2]), int(fields[-1])
        raise RuntimeError(f"RabbitMQ did not report the {QUEUE_NAME} queue.")

    def export_csv(self, base, depth, output, env):
        query = (
            "COPY (SELECT url, source_url, depth, discovered_at, created_at "
            f"FROM links WHERE depth <= {depth} ORDER BY depth, url) TO STDOUT WITH CSV HEADER"
        )
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = None
        try:
            with NamedTemporaryFile(dir=output.parent, suffix=".tmp", delete=False) as temporary:
                temporary_path = Path(temporary.name)
                result = self.run_compose(
                    base,
                    [
                        "exec",
                        "-T",
                        "postgres",
                        "psql",
                        "-v",
                        "ON_ERROR_STOP=1",
                        "-U",
                        "wikiuser",
                        "-d",
                        "wikilinks",
                        "-c",
                        query,
                    ],
                    env=env,
                    timeout=300,
                    stdout=temporary,
                )
            os.replace(temporary_path, output)
        finally:
            if temporary_path and temporary_path.exists():
                temporary_path.unlink()

    def run_pipeline(self, depth, start_url, output):
        project_name = f"wikietl-gui-{uuid.uuid4().hex[:10]}"
        base = self.compose_command(project_name)
        env = os.environ.copy()
        env["MAX_DEPTH"] = str(depth)
        env["START_URL"] = start_url
        started = False
        exported = False
        cancelled = False
        cleanup_warning = None
        failure_message = None

        try:
            started = True
            self.run_compose(
                base,
                ["up", "--build", "--detach", "--scale", f"storer={STORER_COUNT}"],
                env=env,
                timeout=None,
            )
            self.events.put(("crawl_started", None))
            collection_complete = False

            while not collection_complete:
                if self.cancel_requested.is_set():
                    self.run_compose(base, ["stop", "collector"], env=env, timeout=45)
                    cancelled = True
                    break

                logs = self.run_compose(
                    base,
                    ["logs", "--no-color", "--tail", "80", "collector"],
                    env=env,
                ).stdout
                has_progress = self.update_progress(logs, depth)

                if "Failed to connect to RabbitMQ. Exiting." in logs:
                    raise RuntimeError("The collector could not connect to RabbitMQ. See the container logs.")
                if "Error during crawling:" in logs:
                    raise RuntimeError("The collector stopped with an error. See the container logs.")

                collection_complete = "COLLECTION COMPLETE" in logs
                if not collection_complete:
                    state = self.collector_state(base, env)
                    if state and state[0] == "exited":
                        if state[1] == 0:
                            collection_complete = True
                        else:
                            raise RuntimeError(
                                f"The collector exited before completing (exit code {state[1]})."
                            )
                    if not collection_complete:
                        if not has_progress:
                            self.events.put(("status", "Collecting links from Wikipedia..."))
                        threading.Event().wait(POLL_SECONDS)

            self.events.put(("progress", CRAWL_PROGRESS_MAX))
            self.events.put(("progress_text", "70% · Collection complete"))
            self.events.put(("eta", "ETA: draining storage queue..."))
            self.events.put(("status", "Collection finished. Waiting for queued links to be stored..."))
            initial_outstanding = None
            previous_outstanding = None
            previous_sample_at = None
            while True:
                if self.cancel_requested.is_set():
                    self.run_compose(base, ["stop", "storer"], env=env, timeout=60)
                    cancelled = True
                    break
                ready, unacknowledged = self.queue_counts(base, env)
                outstanding = ready + unacknowledged
                now = time.monotonic()
                if initial_outstanding is None:
                    initial_outstanding = outstanding
                if initial_outstanding:
                    stored_fraction = 1 - outstanding / initial_outstanding
                    progress = CRAWL_PROGRESS_MAX + stored_fraction * (
                        STORAGE_PROGRESS_MAX - CRAWL_PROGRESS_MAX
                    )
                    progress = min(STORAGE_PROGRESS_MAX, max(CRAWL_PROGRESS_MAX, progress))
                    self.events.put(("progress", progress))
                    self.events.put(("progress_text", f"{int(progress)}% · Storing results"))
                else:
                    self.events.put(("progress", STORAGE_PROGRESS_MAX))
                    self.events.put(("progress_text", f"{STORAGE_PROGRESS_MAX}% · Storage complete"))
                if previous_outstanding is not None and previous_sample_at is not None:
                    elapsed_sample = now - previous_sample_at
                    drained = previous_outstanding - outstanding
                    if elapsed_sample > 0 and drained > 0 and outstanding > 0:
                        eta_seconds = outstanding / (drained / elapsed_sample)
                        self.events.put(("eta", f"ETA: ~{self.format_duration(eta_seconds)}"))
                    elif outstanding == 0:
                        self.events.put(("eta", "ETA: finishing export..."))
                self.events.put(
                    (
                        "detail",
                        f"Remaining in queue: {ready:,}  |  Being stored: {unacknowledged:,}",
                    )
                )
                if ready == 0 and unacknowledged == 0:
                    break
                previous_outstanding = outstanding
                previous_sample_at = now
                threading.Event().wait(POLL_SECONDS)

            self.events.put(("progress", STORAGE_PROGRESS_MAX))
            self.events.put(("progress_text", "96% · Storage complete"))
            self.events.put(("progress", 98))
            self.events.put(("progress_text", "98% · Exporting CSV"))
            self.events.put(("eta", "ETA: exporting CSV..."))
            self.events.put(("status", "Storage complete. Writing the CSV file..."))
            self.export_csv(base, depth, output, env)
            exported = True
        except Exception as error:
            cleanup_command = (
                f'docker compose --project-name {project_name} --file "{COMPOSE_FILE}" down --volumes'
            )
            failure_message = (
                f"{error}\n\nRun project: {project_name}\nRemove retained data with:\n{cleanup_command}"
            )
        finally:
            if started:
                cleanup_args = ["down", "--remove-orphans"]
                if exported:
                    cleanup_args.append("--volumes")
                try:
                    cleanup = self.run_command(base + cleanup_args, env=env, timeout=120)
                    if cleanup.returncode:
                        cleanup_warning = cleanup.stderr.strip() or project_name
                except Exception as error:
                    cleanup_warning = str(error)

        if failure_message:
            if cleanup_warning:
                failure_message += f"\n\nCleanup warning: {cleanup_warning}"
            self.events.put(("error", failure_message))
        elif exported:
            self.events.put(("complete", (str(output), cancelled, cleanup_warning)))

    def update_progress(self, logs, depth):
        current = re.findall(r"\[Depth (\d+)\] Processing: (.+)", logs)
        progress = re.findall(r"Progress: ([\d,]+) discovered, ([\d,]+) in queue, ([\d,]+) visited", logs)
        published = re.findall(r"CRAWL_PROGRESS published=(\d+) pending=(\d+) depth=(\d+)", logs)
        if current:
            depth_label, url = current[-1]
            url = url.strip()
            if len(url) > 76:
                url = url[:73] + "..."
            self.events.put(("status", f"Collecting depth {depth_label}: {url}"))
        if progress:
            discovered, queued, visited = progress[-1]
            self.events.put(
                ("detail", f"Discovered: {discovered}  |  Waiting to crawl: {queued}  |  Visited: {visited}")
            )
        if published:
            published_count = int(published[-1][0])
            estimated_total = ESTIMATED_PAGE_COUNTS[depth]
            percent = min(
                CRAWL_PROGRESS_MAX - 1,
                published_count / estimated_total * CRAWL_PROGRESS_MAX,
            )
            self.events.put(("progress", percent))
            self.events.put(("progress_text", f"~{int(percent)}% · Crawl estimate"))
            crawl_start = self.crawl_started_at or self.started_at
            elapsed = time.monotonic() - crawl_start
            if published_count >= 5 and elapsed >= 5:
                pages_per_second = published_count / elapsed
                remaining_pages = max(estimated_total - published_count, 0)
                eta_seconds = remaining_pages / pages_per_second
                self.events.put(("eta", f"ETA: ~{self.format_duration(eta_seconds)}"))
            else:
                self.events.put(("eta", "ETA: estimating..."))
        return bool(current or progress or published)

    def process_events(self):
        try:
            while True:
                kind, value = self.events.get_nowait()
                if kind == "status":
                    self.status.set(value)
                elif kind == "detail":
                    self.detail.set(value)
                elif kind == "progress":
                    self.progress_value.set(value)
                elif kind == "progress_text":
                    self.progress_text.set(value)
                elif kind == "eta":
                    self.eta_text.set(value)
                elif kind == "crawl_started":
                    self.crawl_started_at = time.monotonic()
                    self.cancel_button.configure(state="normal")
                elif kind == "error":
                    self.running = False
                    self.progress.stop()
                    self.start_button.configure(state="normal")
                    self.cancel_button.configure(state="disabled")
                    self.status.set("Run failed. Its Docker data was retained for troubleshooting.")
                    self.detail.set(value)
                    messagebox.showerror("Crawl failed", value, parent=self.root)
                elif kind == "complete":
                    self.running = False
                    self.progress.stop()
                    output, cancelled, cleanup_warning = value
                    self.csv_path = Path(output)
                    elapsed = time.monotonic() - self.started_at
                    self.elapsed_text.set(f"Elapsed: {self.format_duration(elapsed)}")
                    if not cancelled:
                        self.progress_value.set(100)
                        self.progress_text.set("100% · Complete")
                    self.start_button.configure(state="normal")
                    self.cancel_button.configure(state="disabled")
                    self.open_button.configure(state="normal")
                    self.eta_text.set("ETA: complete")
                    self.status.set(
                        "Cancelled; partial results saved." if cancelled else "Collection and storage are complete."
                    )
                    if cancelled:
                        self.progress_text.set(f"Cancelled · {int(self.progress_value.get())}%")
                    detail = f"CSV saved to: {self.csv_path}"
                    if cleanup_warning:
                        detail += f"\nDocker cleanup needs attention: {cleanup_warning}"
                    self.detail.set(detail)
                    self.open_csv()
        except queue.Empty:
            pass
        self.root.after(150, self.process_events)

    def open_csv(self):
        if not self.csv_path:
            return
        try:
            if hasattr(os, "startfile"):
                os.startfile(str(self.csv_path))
            else:
                webbrowser.open(self.csv_path.as_uri())
        except OSError as error:
            messagebox.showerror("Could not open CSV", str(error), parent=self.root)

    def close(self):
        if self.running:
            messagebox.showwarning(
                "Crawl in progress",
                "The crawl is still running. Wait for it to finish before closing this window.",
                parent=self.root,
            )
            return
        self.root.destroy()


def main():
    root = tk.Tk()
    PipelineGui(root)
    root.mainloop()


if __name__ == "__main__":
    main()