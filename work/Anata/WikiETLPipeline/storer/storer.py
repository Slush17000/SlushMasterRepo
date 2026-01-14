import os
import time
import json
import pika
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

# Configuration from environment variables
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'admin')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'admin123')
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'wikiuser')
POSTGRES_PASS = os.getenv('POSTGRES_PASS', 'wikipass123')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'wikilinks')
QUEUE_NAME = 'wikipedia_links'

class WikipediaStorer:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.db_conn = None
        self.db_cursor = None
        self.links_stored = 0
        self.links_processed = 0
        
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
                
                # Set QoS to process one message at a time
                self.channel.basic_qos(prefetch_count=1)
                
                print(f"✓ Connected to RabbitMQ at {RABBITMQ_HOST}")
                return True
            except Exception as e:
                print(f"✗ RabbitMQ connection attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
        
        return False
    
    def connect_database(self):
        """Establish connection to PostgreSQL with retry logic"""
        max_retries = 5
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                self.db_conn = psycopg2.connect(
                    host=POSTGRES_HOST,
                    user=POSTGRES_USER,
                    password=POSTGRES_PASS,
                    database=POSTGRES_DB
                )
                self.db_cursor = self.db_conn.cursor()
                print(f"✓ Connected to PostgreSQL at {POSTGRES_HOST}")
                return True
            except Exception as e:
                print(f"✗ PostgreSQL connection attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
        
        return False
    
    def store_link(self, url, source_url, depth, discovered_at):
        """Store a link in the database"""
        try:
            # Use INSERT ... ON CONFLICT to handle duplicates
            query = """
                INSERT INTO links (url, source_url, depth, discovered_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING
                RETURNING id;
            """
            
            self.db_cursor.execute(query, (url, source_url, depth, discovered_at))
            result = self.db_cursor.fetchone()
            self.db_conn.commit()
            
            # Check if a new row was inserted
            if result:
                self.links_stored += 1
                return True
            else:
                # Duplicate, not stored
                return False
                
        except Exception as e:
            print(f"✗ Failed to store link {url}: {e}")
            self.db_conn.rollback()
            # Try to reconnect
            self.connect_database()
            return False
    
    def callback(self, ch, method, properties, body):
        """Callback function for processing messages from RabbitMQ"""
        try:
            # Parse the message
            message = json.loads(body)
            url = message['url']
            source_url = message.get('source_url')
            depth = message['depth']
            discovered_at = message['discovered_at']
            
            self.links_processed += 1
            
            # Store in database
            stored = self.store_link(url, source_url, depth, discovered_at)
            
            if stored:
                print(f"✓ [{self.links_processed}] Stored: {url} (depth: {depth})")
            else:
                print(f"○ [{self.links_processed}] Duplicate: {url}")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
            # Periodic progress update
            if self.links_processed % 10 == 0:
                print(f"📊 Progress: {self.links_processed} processed, {self.links_stored} stored")
                
        except Exception as e:
            print(f"✗ Error processing message: {e}")
            # Reject and requeue the message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    def start_consuming(self):
        """Start consuming messages from RabbitMQ"""
        print("=" * 70)
        print("WIKIPEDIA LINK STORER")
        print("=" * 70)
        print(f"RabbitMQ: {RABBITMQ_HOST}")
        print(f"PostgreSQL: {POSTGRES_HOST}/{POSTGRES_DB}")
        print("=" * 70)
        print("Waiting for messages... (Press Ctrl+C to exit)")
        print()
        
        self.channel.basic_consume(
            queue=QUEUE_NAME,
            on_message_callback=self.callback
        )
        
        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print("\n⚠ Interrupted by user")
            self.channel.stop_consuming()
    
    def run(self):
        """Main entry point"""
        if not self.connect_rabbitmq():
            print("✗ Failed to connect to RabbitMQ. Exiting.")
            return
        
        if not self.connect_database():
            print("✗ Failed to connect to PostgreSQL. Exiting.")
            return
        
        try:
            self.start_consuming()
        except Exception as e:
            print(f"\n✗ Error during consumption: {e}")
        finally:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                print("✓ RabbitMQ connection closed")
            
            if self.db_conn:
                self.db_cursor.close()
                self.db_conn.close()
                print("✓ PostgreSQL connection closed")
            
            print("\n" + "=" * 70)
            print("FINAL STATISTICS")
            print("=" * 70)
            print(f"Total messages processed: {self.links_processed}")
            print(f"Total links stored: {self.links_stored}")
            print(f"Duplicates skipped: {self.links_processed - self.links_stored}")
            print("=" * 70)

if __name__ == '__main__':
    storer = WikipediaStorer()
    storer.run()
