import os
import queue
import tempfile
import threading
import webbrowser
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from cipher_AES import AESEncryption, AESDecryption
from cipher_B64 import B64Encryption, B64Decryption
from cipher_TDES import TDESEncryption, TDESDecryption
from cipher_XOR import XOREncryption, XORDecryption


ROOT = Path(__file__).resolve().parent
EXAMPLE_FILES = ROOT / "ExampleFiles"

ALGORITHMS = {
    "AES": (AESEncryption, AESDecryption),
    "B64": (B64Encryption, B64Decryption),
    "TDES": (TDESEncryption, TDESDecryption),
    "XOR": (XOREncryption, XORDecryption),
}

METHOD_NOTES = {
    "AES": "Uses the fixed key embedded in cipher_AES.py. Educational use only; not suitable for sensitive files.",
    "B64": "Base64 is a reversible encoding, not encryption. Anyone can decode it without a key.",
    "TDES": "Legacy 3DES implementation. It uses a passphrase-derived key and does not authenticate the file.",
    "XOR": "Educational XOR obfuscation only. The one-byte key is weak; save it to decrypt the output.",
}


class FileCryptoGui:
    def __init__(self, root):
        EXAMPLE_FILES.mkdir(parents=True, exist_ok=True)
        self.root = root
        self.events = queue.Queue()
        self.busy = False
        self.generated_xor_key = None
        self.completed_output = None
        self.operation = tk.StringVar(value="Encrypt")
        self.algorithm = tk.StringVar(value="AES")
        self.input_path = tk.StringVar()
        self.output_path = tk.StringVar()
        self.key_value = tk.StringVar()
        self.method_note = tk.StringVar()
        self.key_result = tk.StringVar()
        self.status = tk.StringVar(value="Choose an operation, method, and file.")

        root.title("File Encryptor and Decryptor")
        root.geometry("720x440")
        root.minsize(600, 390)
        root.protocol("WM_DELETE_WINDOW", self.close)

        main = ttk.Frame(root, padding=20)
        main.pack(fill="both", expand=True)
        main.columnconfigure(1, weight=1)

        ttk.Label(main, text="File Encryptor / Decryptor", font=("Segoe UI", 16, "bold")).grid(
            row=0, column=0, columnspan=3, sticky="w", pady=(0, 16)
        )

        ttk.Label(main, text="Operation").grid(row=1, column=0, sticky="w", pady=5)
        operation_frame = ttk.Frame(main)
        operation_frame.grid(row=1, column=1, columnspan=2, sticky="w")
        self.encrypt_button = ttk.Radiobutton(
            operation_frame, text="Encrypt", value="Encrypt", variable=self.operation,
            command=self.selection_changed,
        )
        self.encrypt_button.pack(side="left", padx=(0, 18))
        self.decrypt_button = ttk.Radiobutton(
            operation_frame, text="Decrypt", value="Decrypt", variable=self.operation,
            command=self.selection_changed,
        )
        self.decrypt_button.pack(side="left")

        ttk.Label(main, text="Method").grid(row=2, column=0, sticky="w", pady=5)
        self.algorithm_box = ttk.Combobox(
            main, textvariable=self.algorithm, values=tuple(ALGORITHMS), state="readonly", width=14
        )
        self.algorithm_box.grid(row=2, column=1, sticky="w")
        self.algorithm_box.bind("<<ComboboxSelected>>", self.selection_changed)

        ttk.Label(main, text="Input file").grid(row=3, column=0, sticky="w", pady=5)
        self.input_entry = ttk.Entry(main, textvariable=self.input_path)
        self.input_entry.grid(row=3, column=1, sticky="ew", padx=(0, 8))
        self.input_button = ttk.Button(main, text="Browse...", command=self.browse_input)
        self.input_button.grid(row=3, column=2)

        ttk.Label(main, text="Output file").grid(row=4, column=0, sticky="w", pady=5)
        self.output_entry = ttk.Entry(main, textvariable=self.output_path)
        self.output_entry.grid(row=4, column=1, sticky="ew", padx=(0, 8))
        self.output_button = ttk.Button(main, text="Save as...", command=self.browse_output)
        self.output_button.grid(row=4, column=2)

        self.key_frame = ttk.Frame(main)
        self.key_frame.grid(row=5, column=0, columnspan=3, sticky="ew", pady=5)
        self.key_frame.columnconfigure(1, weight=1)
        self.key_label = ttk.Label(self.key_frame, text="Key")
        self.key_label.grid(row=0, column=0, sticky="w", padx=(0, 10))
        self.key_entry = ttk.Entry(self.key_frame, textvariable=self.key_value, show="*")
        self.key_entry.grid(row=0, column=1, sticky="ew")
        self.copy_key_button = ttk.Button(
            self.key_frame, text="Copy generated XOR key", command=self.copy_xor_key, state="disabled"
        )
        self.copy_key_button.grid(row=0, column=2, padx=(8, 0))

        ttk.Label(main, textvariable=self.method_note, wraplength=660).grid(
            row=6, column=0, columnspan=3, sticky="w", pady=(8, 2)
        )
        ttk.Label(main, textvariable=self.key_result, wraplength=660).grid(
            row=7, column=0, columnspan=3, sticky="w", pady=(2, 8)
        )

        ttk.Label(main, textvariable=self.status, wraplength=660).grid(
            row=8, column=0, columnspan=3, sticky="w"
        )

        button_frame = ttk.Frame(main)
        button_frame.grid(row=9, column=0, columnspan=3, sticky="ew", pady=(18, 0))
        self.run_button = ttk.Button(button_frame, text="Encrypt file", command=self.run_operation)
        self.run_button.pack(side="left")
        self.open_button = ttk.Button(
            button_frame, text="Open output", command=self.open_output, state="disabled"
        )
        self.open_button.pack(side="left", padx=(8, 0))

        self.selection_changed()
        self.root.after(100, self.process_events)

    def selection_changed(self, _event=None):
        if self.busy:
            return
        operation = self.operation.get()
        algorithm = self.algorithm.get()
        self.run_button.configure(text=f"{operation} file")
        self.method_note.set(METHOD_NOTES[algorithm])
        self.key_result.set("")
        self.generated_xor_key = None
        self.copy_key_button.configure(state="disabled")

        needs_key = algorithm == "TDES" or (algorithm == "XOR" and operation == "Decrypt")
        if needs_key:
            self.key_label.configure(text="TDES key" if algorithm == "TDES" else "XOR key (0-255)")
            self.key_frame.grid()
            self.key_label.grid()
            self.key_entry.grid()
            self.copy_key_button.grid_remove()
        elif algorithm == "XOR" and operation == "Encrypt":
            self.key_frame.grid_remove()
        else:
            self.key_frame.grid_remove()

        self.suggest_output()

    def browse_input(self):
        path = filedialog.askopenfilename(parent=self.root, title="Select file to process")
        if path:
            self.input_path.set(path)
            self.suggest_output()

    def browse_output(self):
        suggested = self.output_path.get()
        path = filedialog.asksaveasfilename(
            parent=self.root,
            title="Choose output file",
            initialdir=str(EXAMPLE_FILES),
            initialfile=Path(suggested).name if suggested else "output.bin",
            confirmoverwrite=False,
        )
        if path:
            selected = Path(path).resolve()
            if selected.parent != EXAMPLE_FILES.resolve():
                messagebox.showerror(
                    "Output folder is fixed",
                    f"New files must be saved in {EXAMPLE_FILES}.",
                    parent=self.root,
                )
                return
            self.output_path.set(str(selected))

    def suggest_output(self):
        source_text = self.input_path.get().strip()
        if not source_text or self.busy:
            return
        source = Path(source_text).expanduser()
        algorithm = self.algorithm.get().lower()
        if self.operation.get() == "Encrypt":
            name = f"{source.name}.{algorithm}.enc"
        else:
            encrypted_suffix = f".{algorithm}.enc"
            if source.name.lower().endswith(encrypted_suffix):
                original = Path(source.name[:-len(encrypted_suffix)])
                name = f"{original.stem}.decrypted{original.suffix}"
            else:
                name = f"{source.stem}.decrypted{source.suffix}"
        self.output_path.set(str(EXAMPLE_FILES / name))

    def run_operation(self):
        if self.busy:
            return
        try:
            source_text = self.input_path.get().strip()
            output_text = self.output_path.get().strip()
            if not source_text:
                raise ValueError("Select an input file.")
            if not output_text:
                raise ValueError("Choose an output file.")
            source = Path(source_text).expanduser().resolve()
            destination = Path(output_text).expanduser().resolve()
            if not source.is_file():
                raise ValueError("Select an existing input file.")
            if source == destination:
                raise ValueError("The output file must be different from the input file.")
            if destination.parent != EXAMPLE_FILES.resolve():
                raise ValueError(f"Output files must be saved in {EXAMPLE_FILES}.")
            if destination.exists() and destination.is_dir():
                raise ValueError("Choose an output file path, not a directory.")
            destination.parent.mkdir(parents=True, exist_ok=True)
            key = self.read_key()
        except (OSError, ValueError) as error:
            messagebox.showerror("Check file and key", str(error), parent=self.root)
            return

        if destination.exists() and not messagebox.askyesno(
            "Replace existing file?", f"{destination} already exists. Replace it?", parent=self.root
        ):
            return

        self.busy = True
        self.completed_output = None
        self.set_controls_enabled(False)
        self.open_button.configure(state="disabled")
        self.status.set(f"{self.operation.get()}ing with {self.algorithm.get()}...")
        worker = threading.Thread(
            target=self.process_file,
            args=(self.operation.get(), self.algorithm.get(), source, destination, key),
            daemon=True,
        )
        worker.start()

    def read_key(self):
        algorithm = self.algorithm.get()
        operation = self.operation.get()
        if algorithm == "TDES":
            key = self.key_value.get()
            if not key:
                raise ValueError("Enter the TDES passphrase used for encryption.")
            try:
                key.encode("ascii")
            except UnicodeEncodeError as error:
                raise ValueError("The existing TDES method accepts ASCII passphrases only.") from error
            return key
        if algorithm == "XOR" and operation == "Decrypt":
            try:
                key = int(self.key_value.get())
            except ValueError as error:
                raise ValueError("Enter the XOR key as an integer from 0 to 255.") from error
            if not 0 <= key <= 255:
                raise ValueError("The XOR key must be between 0 and 255.")
            return key
        return None

    def process_file(self, operation, algorithm, source, destination, key):
        temporary_output = None
        try:
            with tempfile.NamedTemporaryFile(
                dir=destination.parent, prefix=".file-crypto-", suffix=".tmp", delete=False
            ) as temporary:
                temporary_output = Path(temporary.name)

            encrypt, decrypt = ALGORITHMS[algorithm]
            if operation == "Encrypt":
                generated_key = (
                    encrypt(str(source), str(temporary_output))
                    if algorithm != "TDES"
                    else encrypt(str(source), str(temporary_output), key)
                )
            else:
                generated_key = None
                decrypt(str(source), str(temporary_output)) if algorithm in ("AES", "B64") else decrypt(
                    str(source), str(temporary_output), key
                )
            os.replace(temporary_output, destination)
            self.events.put(("success", (operation, algorithm, destination, generated_key)))
        except Exception as error:
            if temporary_output is not None:
                temporary_output.unlink(missing_ok=True)
            self.events.put(("error", str(error)))

    def process_events(self):
        try:
            while True:
                kind, value = self.events.get_nowait()
                self.busy = False
                self.set_controls_enabled(True)
                if kind == "success":
                    operation, algorithm, destination, generated_key = value
                    self.completed_output = destination
                    self.status.set(f"{operation} complete. Output saved to {destination}")
                    self.open_button.configure(state="normal")
                    if algorithm == "XOR" and operation == "Encrypt":
                        self.generated_xor_key = generated_key
                        self.key_result.set(
                            f"XOR decryption key: {generated_key}. Save this key; it cannot be recovered from the output file."
                        )
                        self.key_frame.grid()
                        self.key_label.grid_remove()
                        self.key_entry.grid_remove()
                        self.copy_key_button.grid()
                        self.copy_key_button.configure(state="normal")
                else:
                    self.status.set("Operation failed. The input file was not changed.")
                    messagebox.showerror("File operation failed", value, parent=self.root)
        except queue.Empty:
            pass
        self.root.after(100, self.process_events)

    def set_controls_enabled(self, enabled):
        state = "normal" if enabled else "disabled"
        self.encrypt_button.configure(state=state)
        self.decrypt_button.configure(state=state)
        self.algorithm_box.configure(state="readonly" if enabled else "disabled")
        self.input_entry.configure(state=state)
        self.input_button.configure(state=state)
        self.output_entry.configure(state=state)
        self.output_button.configure(state=state)
        self.key_entry.configure(state=state)
        self.run_button.configure(state=state)
        if not enabled:
            self.copy_key_button.configure(state="disabled")

    def copy_xor_key(self):
        if self.generated_xor_key is None:
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(str(self.generated_xor_key))
        self.status.set("XOR decryption key copied to clipboard. Store it somewhere safe.")

    def open_output(self):
        if self.completed_output is None:
            return
        path = self.completed_output
        try:
            if hasattr(os, "startfile"):
                os.startfile(str(path))
            else:
                webbrowser.open(path.as_uri())
        except OSError as error:
            messagebox.showerror("Could not open output", str(error), parent=self.root)

    def close(self):
        if self.busy:
            messagebox.showwarning(
                "Operation in progress", "Wait for the current file operation to finish before closing.",
                parent=self.root,
            )
            return
        self.root.destroy()


def main():
    root = tk.Tk()
    FileCryptoGui(root)
    root.mainloop()


if __name__ == "__main__":
    main()