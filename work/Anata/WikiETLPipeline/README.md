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

### Depth Complexity

**Important:** Link count grows exponentially with depth:
- **Depth 1**: ~320 links (1-2 minutes)
- **Depth 2**: ~56,000 links (1-2 hours with 20 storers)
- **Depth 3**: ~800,000+ links (days, depending on starting page)

Highly-connected pages (government, law, politics) result in massive depth 3 graphs.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- At least 2GB free disk space
- Internet connection for Wikipedia access

## Quick Start

### 1. Start All Services

```bash
docker compose up -d
```

This starts all four services in the background:
- RabbitMQ (with management UI on port 15672)
- PostgreSQL (on port 5432)
- Collector (begins scraping immediately)
- Storer (begins processing queue immediately)

**For better performance, scale storers immediately:**
```bash
docker compose up -d --scale storer=20
```

**Recommended storer counts:**
- Depth 1: 1-5 storers
- Depth 2: 10-20 storers
- Depth 3: 20-50 storers (if attempting)

### 2. View Logs

**Watch all services:**
```bash
docker compose logs -f
```

**Watch specific service:**
```bash
docker compose logs -f collector
docker compose logs -f storer
```

### 3. Monitor Progress

**RabbitMQ Management UI:**
- URL: http://localhost:15672
- Username: `admin`
- Password: `admin123`
- View queue depth, message rates, and connections

**Database Query:**
```bash
docker compose exec postgres psql -U wikiuser -d wikilinks -c "SELECT COUNT(*) FROM links;"
```

### 4. Stop Services

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

## Usage Scenarios

### Scenario 1: Run Both Services (Normal Operation)

```bash
docker compose up -d
```

Collector scrapes → Publishes to queue → Storer writes to DB in real-time.

### Scenario 2: Run Collector Only

```bash
docker compose up -d rabbitmq postgres
docker compose up -d collector
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

# Let storer finish processing queue
# ... wait ...

# Restart collector
docker compose start collector
```

### Scenario 5: Restart from Scratch

```bash
docker compose down -v  # Remove all data
docker compose up -d    # Start fresh
```

## Configuration

Edit `docker-compose.yml` to change settings:

```yaml
collector:
  environment:
    START_URL: https://en.wikipedia.org/wiki/Different_Page
    MAX_DEPTH: 5  # Change depth limit
```

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
SELECT url FROM links WHERE depth = 3;
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
- Clean up: `docker system prune -a --volumes`

### PostgreSQL connection errors

If you see "FATAL: sorry, too many clients already" when scaling storers:

1. Edit `docker-compose.yml` and add under `postgres`:
   ```yaml
   command: -c max_connections=200
   ```

2. Restart PostgreSQL:
   ```bash
   docker compose up -d postgres
   ```

Default limit is 100 connections. Increase to 200 for 20+ storers, or 300 for 50+ storers.

## Performance Tips

1. **Scale storers for depth 2+**: The bottleneck is storage, not collection:
   ```bash
   docker compose up -d --scale storer=20
   ```
   - Depth 2: Use 10-20 storers
   - Depth 3: Use 20-50 storers (system resources permitting)

2. **Adjust crawler delay**: Lower `REQUEST_DELAY` in collector.py:
   - Current: 0.2s (tested and safe)
   - Aggressive: 0.05s (faster but riskier)
   - Conservative: 1.0s (slower but very safe)

3. **Stop collector to drain queue**: If queue grows too large:
   ```bash
   docker compose stop collector
   ```
   Let storers catch up, then restart collector.

4. **Monitor queue backlog**: Check http://localhost:15672 regularly
   - If queue keeps growing, scale up storers
   - If queue is empty, collector is waiting for depth to complete

5. **Database optimization**: Add more indexes for your specific queries

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

- The collector scrapes Wikipedia with 0.2 second delays between requests (configurable)
  - 0.2 second delays (5 requests/sec) are more aggressive to Wikipedia but yields better performance
  - To be more respectful to Wikipedia, increase the value of REQUEST_DELAY (at the cost of slower collection)
- User-Agent identifies the bot for Wikipedia administrators
- Duplicate links are automatically handled via database UNIQUE constraint
- Services auto-reconnect on failure
- All data persists in Docker volumes
- Storer container name removed from docker-compose.yml to enable scaling
- PostgreSQL configured with increased max_connections for scaled storers
