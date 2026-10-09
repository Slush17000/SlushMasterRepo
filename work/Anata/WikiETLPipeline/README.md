# Wikipedia ETL Pipeline

A decoupled ETL pipeline that collects Wikipedia links starting from a given URL (https://en.wikipedia.org/wiki/Freedom_of_Information_Act_(United_States)), stores them in PostgreSQL, and uses RabbitMQ for asynchronous processing.

## Architecture

```
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  Collector  │───────>│  RabbitMQ   │───────>│   Storer    │
│  (Scraper)  │        │   (Queue)   │        │  (Writer)   │
└─────────────┘        └─────────────┘        └─────────────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │  PostgreSQL │
                                              │  (Database) │
                                              └─────────────┘
```

### Components

1. **Collector** - Scrapes Wikipedia links using BFS up to configurable depth
2. **RabbitMQ** - Message queue for decoupling collection from storage
3. **Storer** - Consumes messages and writes to database (scalable to multiple instances)
4. **PostgreSQL** - Stores link data with metadata

### Depth and Runtime

- The starting page is depth 0. Its links are depth 1, and links found on those pages are depth 2.
- The default and maximum supported depth is 2. Depth 2 links are published and stored, but not fetched for further links (depth 3 is not supported because it can potentially take a very long time).
- Recent runs on this setup took about 30 seconds at depth 1 and 3 minutes at depth 2. These are observed times, not guarantees; network and Wikipedia response times affect the duration.
- A recent depth 2 export contained 57,706 rows: the starting page, 343 depth 1 pages, and 57,362 depth 2 pages. Counts vary with the starting page and site content.
- Scaling storers can help process a growing queue, but does not make the collector fetch pages faster.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- Several MB of free disk space; actual usage depends on the crawl
- Internet connection for Wikipedia access
- Python 3 with Tkinter (included with the standard Windows installer)

## Quick Start

### Desktop Launcher (Windows)

From the repository root in PowerShell, run:

```powershell
cd work\Anata\WikiETLPipeline
py run_pipeline_gui.py
```

The starting page field defaults to `https://en.wikipedia.org/wiki/Freedom_of_Information_Act_(United_States)`. Keep it unchanged to run the existing crawl, or enter a full HTTPS English Wikipedia article URL such as `https://en.wikipedia.org/wiki/Example`. Category, file, talk, and other special pages are rejected; a `#section` fragment is removed. The collector also checks that the selected article can be fetched before crawling, and reports an error if it does not exist or cannot be reached.

Choose depth 1 or 2, then enter a CSV filename or browse for a location. The default location is your Documents folder. The launcher builds the Docker images, starts four storage workers, shows crawl and queue progress, waits for storage to finish, exports rows through the selected depth, and opens the CSV in your default spreadsheet application.

The progress bar is estimated from prior runs of the default starting page (344 pages at depth 1 and about 57,706 at depth 2). Custom starting pages can have very different link counts, so their percentage and ETA estimates may be less accurate. The percentage advances through collection, storage, and export. Elapsed time starts when you press **Start crawl**.

Each launcher run uses its own Compose project and removes its containers and data volumes after a successful export. Cancel stops collection and saves a partial CSV. If a run fails, its Docker data is retained and the launcher shows a command to remove it after troubleshooting. Close other WikiETLPipeline runs first because the services publish local ports 5432, 5672, and 15672.

### Manual Docker Compose Run

#### 1. Start All Services

When upgrading from an earlier Compose setup, RabbitMQ's old queue is not migrated into the new named volume. If those queued messages matter, stop the collector and let the storers drain the queue before the first rebuild; rows already stored in PostgreSQL remain in its volume.

```bash
docker compose up -d --build
```

This starts all four services in the background:
- RabbitMQ (with management UI on port 15672)
- PostgreSQL (on port 5432)
- Collector (begins scraping immediately)
- Storer (begins processing queue immediately)

**To add storage workers when the queue is growing:**
```bash
docker compose up -d --build --scale storer=4
```

Start with one storer, then scale up only if RabbitMQ's queue keeps growing and the database and machine have capacity.

#### 2. View Logs

**Watch all services:**
```bash
docker compose logs -f
```

**Watch specific service:**
```bash
docker compose logs -f collector
docker compose logs -f storer
```

#### 3. Monitor Progress

**RabbitMQ Management UI:**
- URL: http://localhost:15672
- Username: `admin`
- Password: `admin123`
- View queue depth, message rates, and connections

**Database Query:**
```bash
docker compose exec postgres psql -U wikiuser -d wikilinks -c "SELECT COUNT(*) FROM links;"
```

#### 4. Stop Services

**Stop all:**
```bash
docker compose down
```

**Stop but keep data:**
```bash
docker compose stop
```

**Remove everything including data:**
```bash
docker compose down -v
```
This removes this Compose project's PostgreSQL and RabbitMQ data volumes.

## Usage Scenarios

### Scenario 1: Run Both Services (Normal Operation)

```bash
docker compose up -d --build
```

Collector fetches pages sequentially → Publishes discovered links to the queue → Storer writes them to PostgreSQL.

### Scenario 2: Run Collector Only

```bash
docker compose up -d rabbitmq postgres
docker compose up -d --build collector
```

Collector scrapes and fills the queue. Messages wait for storer.

### Scenario 3: Run Storer Only

```bash
docker compose up -d rabbitmq postgres
docker compose up -d storer
```

Storer processes backlog from queue. No new links are collected.

### Scenario 4: Stop and Restart Services

```bash
# Stop collector
docker compose stop collector

# The collector starts over from START_URL when restarted; it does not resume its in-memory BFS state.
# Let the storer drain the queue before restarting if you want to avoid adding duplicate messages.

# Restart collector
docker compose start collector
```

### Scenario 5: Restart from Scratch

```bash
docker compose down -v  # Remove all data
docker compose up -d --build  # Start fresh
```

## Configuration

Edit `docker-compose.yml` to change settings:

```yaml
collector:
   environment:
   START_URL: ${START_URL:-https://en.wikipedia.org/wiki/Freedom_of_Information_Act_(United_States)}
      MAX_DEPTH: 2  # Supported values: 0, 1, or 2
```

The URL defaults to the Freedom of Information Act page. For a manual PowerShell run with a different page, set `$env:START_URL` to an HTTPS English Wikipedia article URL before running `docker compose up`. The collector validates the URL and checks that it can be fetched before crawling. It also rejects depth values above 2.
After changing `START_URL` or `MAX_DEPTH`, rebuild and recreate the collector with `docker compose up -d --build collector`.

## Accessing the Data

### Using psql (Docker)

```bash
docker compose exec postgres psql -U wikiuser -d wikilinks
```

### Sample Queries

```sql
-- Count total links
SELECT COUNT(*) FROM links;

-- Links by depth
SELECT depth, COUNT(*) FROM links GROUP BY depth ORDER BY depth;

-- Recently discovered links
SELECT url, depth, discovered_at FROM links ORDER BY discovered_at DESC LIMIT 10;

-- Find all links from a specific page
SELECT url, depth FROM links WHERE source_url = 'https://en.wikipedia.org/wiki/Some_Page';

-- Links at max depth
SELECT url FROM links WHERE depth = 2;
```

### Using External Tools

Connect with your favorite database tool:
- **Host:** localhost
- **Port:** 5432
- **Database:** wikilinks
- **Username:** wikiuser
- **Password:** wikipass123

## Monitoring

### Check Service Status

```bash
docker compose ps
```

### View Resource Usage

```bash
docker stats
```

### Check Queue Status

1. Open http://localhost:15672
2. Login with admin/admin123
3. Go to "Queues" tab
4. View `wikipedia_links` queue statistics

## How It Works

### Collection Process

1. **Initialization**: Collector connects to RabbitMQ
2. **BFS Traversal**: 
   - Start with the initial URL at depth 0
   - Fetch page HTML
   - Extract all Wikipedia links
   - Filter out special pages (Category:, Help:, etc.)
   - Add new links to queue
3. **Publishing**: Each discovered link is published to RabbitMQ as a JSON message
4. **Depth Limiting**: Stop exploring beyond configured MAX_DEPTH
5. **Politeness**: 0.2 second delay between requests (configurable in collector.py)

### Storage Process

1. **Initialization**: Storer connects to RabbitMQ and PostgreSQL
2. **Consuming**: Listen for messages from queue
3. **Deduplication**: Use `ON CONFLICT DO NOTHING` to skip duplicates
4. **Persistence**: Store unique links with metadata
5. **Acknowledgment**: Acknowledge processed messages

### Message Format

```json
{
  "url": "https://en.wikipedia.org/wiki/Some_Page",
  "source_url": "https://en.wikipedia.org/wiki/Parent_Page",
  "depth": 2,
  "discovered_at": "2026-01-13T10:30:45.123456"
}
```

### Database Schema

The pipeline reads and writes the `links` table below. `init.sql` also creates `crawl_stats`, but the current collector and storer do not update or query that table.

```sql
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    source_url TEXT,
    depth INTEGER NOT NULL,
    discovered_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### Collector won't start

- Check RabbitMQ is healthy: `docker compose ps`
- View collector logs: `docker compose logs collector`
- Ensure internet connection is available

### Storer won't start

- Check both RabbitMQ and PostgreSQL are healthy
- View storer logs: `docker compose logs storer`
- Verify database initialized: `docker compose logs postgres | Select-String "init.sql"`

### No links being stored

- Check queue has messages: RabbitMQ UI
- Verify storer is running: `docker compose ps storer`
- Check for errors: `docker compose logs storer`

### Database connection refused

- Ensure PostgreSQL container is running
- Check port 5432 not in use: `netstat -an | findstr 5432`
- Wait for PostgreSQL to initialize (can take 10-30 seconds)

### Out of disk space

- Check Docker disk usage: `docker system df`
- To remove this pipeline's containers and images while keeping its data: `docker compose down --rmi local`
- To also delete this pipeline's database and queue data: `docker compose down --rmi local -v`
- Avoid `docker system prune --volumes` unless you intend to remove unused Docker data for other projects too.

### PostgreSQL connection errors

Compose already configures PostgreSQL for up to 200 connections. If PostgreSQL reports that its client limit is reached, scale down the storers first; increasing the connection limit also increases PostgreSQL's resource use.

## Performance Tips

1. **Watch the queue before scaling storers.** The collector is a single sequential worker; scaling only helps when storage cannot keep up:
   ```bash
   docker compose up -d --scale storer=4
   ```
   More storers consume more database connections and system resources; add them only while the queue is growing.

2. **Stop the collector to drain the queue** if it grows too large:
   ```bash
   docker compose stop collector
   ```
   Storers continue processing. Starting the collector again begins a new crawl from `START_URL`; it does not resume the previous traversal.

3. **Monitor queue backlog**: Check http://localhost:15672 regularly
   - If queue keeps growing, scale up storers
   - If queue is empty, collector is waiting for depth to complete

4. **Database optimization**: Add more indexes for your specific queries

## Data Analysis Examples

### Export links to CSV

```bash
docker compose exec postgres psql -U wikiuser -d wikilinks -c "COPY (SELECT * FROM links) TO STDOUT WITH CSV HEADER" > wikiLinksDepth{maxDepthNum}.csv
```

### Visualization Queries

```sql
-- Link graph: Show parent-child relationships
SELECT source_url as parent, url as child, depth 
FROM links 
WHERE source_url IS NOT NULL 
LIMIT 100;

-- Depth distribution
SELECT 
    depth,
    COUNT(*) as link_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM links
GROUP BY depth
ORDER BY depth;
```

## Project Structure

```
WikiETLPipeline/
├── docker-compose.yml      # Orchestration configuration
├── init.sql                # Database initialization
├── README.md               # This file
├── run_pipeline_gui.py     # Windows desktop launcher
├── collector/
│   ├── Dockerfile          # Collector container definition
│   ├── requirements.txt    # Python dependencies
│   └── collector.py        # Scraping logic (REQUEST_DELAY=0.2s)
└── storer/
    ├── Dockerfile          # Storer container definition
    ├── requirements.txt    # Python dependencies
    └── storer.py           # Storage logic
```

## License

Educational use only.

## Notes

- The collector scrapes Wikipedia sequentially with a 0.2 second delay after successful page fetches.
- Increase `REQUEST_DELAY` in `collector.py` if you want the collector to make requests less frequently; a slower crawl takes longer.
- User-Agent identifies the bot for Wikipedia administrators
- Duplicate links are automatically handled via database UNIQUE constraint
- Initial RabbitMQ and PostgreSQL connections retry on failure. A collector run does not resume after a runtime failure; failed database writes are requeued by the storer.
- PostgreSQL data and RabbitMQ queue data persist in named Docker volumes across container recreation. `docker compose down -v` deletes both.
- Storer container name removed from docker-compose.yml to enable scaling
- PostgreSQL is configured with `max_connections=200` for scaled storers
