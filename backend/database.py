import mysql.connector
from mysql.connector import Error
from config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=settings.db_host,
                port=settings.db_port,
                user=settings.db_user,
                password=settings.db_password,
                database=settings.db_name,
                autocommit=True
            )
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor(dictionary=True)
                logger.info("Successfully connected to MySQL database")
                return True
                
        except Error as e:
            logger.error(f"Error connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("MySQL connection closed")
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            
            # Create a fresh cursor for each query to avoid unread results
            cursor = self.connection.cursor(dictionary=True)
            
            cursor.execute(query, params or ())
            
            # For SELECT queries
            if query.strip().upper().startswith('SELECT'):
                result = cursor.fetchall()
                cursor.close()
                return result
            elif query.strip().upper().startswith('DESCRIBE'):
                result = cursor.fetchall()
                cursor.close()
                return result
            elif query.strip().upper().startswith('SHOW'):
                result = cursor.fetchall()
                cursor.close()
                return result
            
            # For INSERT/UPDATE/DELETE queries
            rowcount = cursor.rowcount
            cursor.close()
            return rowcount
            
        except Error as e:
            logger.error(f"Error executing query: {e}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise e
    
    def execute_many(self, query, params_list):
        """Execute query with multiple parameter sets"""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            
            self.cursor.executemany(query, params_list)
            return self.cursor.rowcount
            
        except Error as e:
            logger.error(f"Error executing batch query: {e}")
            raise e

# Create global database instance
db = Database()

def get_db():
    """Dependency to get database instance"""
    if not db.connection or not db.connection.is_connected():
        db.connect()
    return db