import os
import time
import json
import requests
from bs4 import BeautifulSoup
from collections import deque
from urllib.parse import urljoin, urlparse
import pika
from datetime import datetime

# Configuration from environment variables
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'admin')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'admin123')
START_URL = os.getenv('START_URL', 'https://en.wikipedia.org/wiki/Freedom_of_Information_Act_(United_States)')
MAX_DEPTH = int(os.getenv('MAX_DEPTH', '3'))
QUEUE_NAME = 'wikipedia_links'
REQUEST_DELAY = 0.2  # Seconds between requests - faster for depth 3

class WikipediaCollector:
    def __init__(self):
        self.visited = set()
        self.connection = None
        self.channel = None
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'WikipediaETLBot/1.0 (Educational Purpose)'
        })
        
    def connect_rabbitmq(self):
        """Establish connection to RabbitMQ with retry logic"""
        max_retries = 5
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
                parameters = pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    credentials=credentials,
                    heartbeat=600,
                    blocked_connection_timeout=300
                )
                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()
                self.channel.queue_declare(queue=QUEUE_NAME, durable=True)
                print(f"✓ Connected to RabbitMQ at {RABBITMQ_HOST}")
                return True
            except Exception as e:
                print(f"✗ RabbitMQ connection attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
        
        return False
    
    def publish_link(self, url, source_url, depth):
        """Publish a discovered link to RabbitMQ"""
        message = {
            'url': url,
            'source_url': source_url,
            'depth': depth,
            'discovered_at': datetime.utcnow().isoformat()
        }
        
        try:
            self.channel.basic_publish(
                exchange='',
                routing_key=QUEUE_NAME,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                )
            )
            return True
        except Exception as e:
            print(f"✗ Failed to publish link {url}: {e}")
            # Try to reconnect
            self.connect_rabbitmq()
            return False
    
    def is_valid_wikipedia_link(self, url):
        """Check if URL is a valid Wikipedia article link"""
        if not url:
            return False
        
        parsed = urlparse(url)
        
        # Must be Wikipedia domain
        if 'wikipedia.org' not in parsed.netloc:
            return False
        
        # Must be a wiki article
        if not parsed.path.startswith('/wiki/'):
            return False
        
        # Exclude special pages
        exclude_patterns = [
            'Wikipedia:', 'Help:', 'Special:', 'Talk:', 'User:', 
            'Category:', 'File:', 'Template:', 'Portal:', 'Draft:',
            'MediaWiki:', 'Module:', 'TimedText:'
        ]
        
        for pattern in exclude_patterns:
            if pattern in url:
                return False
        
        return True
    
    def extract_links(self, html_content, base_url):
        """Extract all valid Wikipedia links from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        links = set()
        
        # Find all links in the main content area
        content_div = soup.find('div', {'id': 'mw-content-text'})
        if not content_div:
            content_div = soup
        
        for anchor in content_div.find_all('a', href=True):
            href = anchor['href']
            
            # Convert relative URLs to absolute
            full_url = urljoin(base_url, href)
            
            # Remove fragment identifiers
            full_url = full_url.split('#')[0]
            
            if self.is_valid_wikipedia_link(full_url):
                links.add(full_url)
        
        return links
    
    def fetch_page(self, url):
        """Fetch a Wikipedia page with error handling"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"✗ Failed to fetch {url}: {e}")
            return None
    
    def crawl(self):
        """Main crawling logic using BFS"""
        print("=" * 70)
        print("WIKIPEDIA LINK COLLECTOR")
        print("=" * 70)
        print(f"Start URL: {START_URL}")
        print(f"Max Depth: {MAX_DEPTH}")
        print(f"RabbitMQ: {RABBITMQ_HOST}")
        print("=" * 70)
        
        # BFS queue: (url, source_url, depth)
        queue = deque([(START_URL, None, 0)])
        self.visited.add(START_URL)
        
        links_discovered = 0
        links_published = 0
        
        while queue:
            current_url, source_url, depth = queue.popleft()
            
            print(f"\n[Depth {depth}] Processing: {current_url}")
            
            # Publish current link
            if self.publish_link(current_url, source_url, depth):
                links_published += 1
                print(f"  ✓ Published to queue (Total: {links_published})")
            
            # Stop if we've reached max depth
            if depth >= MAX_DEPTH:
                print(f"  ⚠ Max depth reached, not exploring further")
                continue
            
            # Fetch and parse the page
            html_content = self.fetch_page(current_url)
            if not html_content:
                continue
            
            # Extract links
            discovered_links = self.extract_links(html_content, current_url)
            new_links = [link for link in discovered_links if link not in self.visited]
            
            print(f"  → Found {len(discovered_links)} links ({len(new_links)} new)")
            
            # Add new links to queue
            for link in new_links:
                self.visited.add(link)
                queue.append((link, current_url, depth + 1))
                links_discovered += 1
            
            # Be respectful to Wikipedia servers
            time.sleep(REQUEST_DELAY)
            
            # Progress update
            print(f"  📊 Progress: {links_discovered} discovered, {len(queue)} in queue, {len(self.visited)} visited")
        
        print("\n" + "=" * 70)
        print("COLLECTION COMPLETE")
        print("=" * 70)
        print(f"Total links discovered: {links_discovered}")
        print(f"Total links published: {links_published}")
        print(f"Total unique URLs visited: {len(self.visited)}")
        print("=" * 70)
    
    def run(self):
        """Main entry point"""
        if not self.connect_rabbitmq():
            print("✗ Failed to connect to RabbitMQ. Exiting.")
            return
        
        try:
            self.crawl()
        except KeyboardInterrupt:
            print("\n⚠ Interrupted by user")
        except Exception as e:
            print(f"\n✗ Error during crawling: {e}")
        finally:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                print("✓ RabbitMQ connection closed")

if __name__ == '__main__':
    collector = WikipediaCollector()
    collector.run()
