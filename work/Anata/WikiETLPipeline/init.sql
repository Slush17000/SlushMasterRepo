-- Initialize the database schema for Wikipedia links

CREATE TABLE IF NOT EXISTS links (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    source_url TEXT,
    depth INTEGER NOT NULL,
    discovered_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_links_depth ON links(depth);
CREATE INDEX IF NOT EXISTS idx_links_discovered_at ON links(discovered_at);
CREATE INDEX IF NOT EXISTS idx_links_source_url ON links(source_url);

-- Create a table to track crawl statistics
CREATE TABLE IF NOT EXISTS crawl_stats (
    id SERIAL PRIMARY KEY,
    total_links_discovered INTEGER DEFAULT 0,
    total_links_stored INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Insert initial stats record
INSERT INTO crawl_stats (total_links_discovered, total_links_stored) 
VALUES (0, 0);
