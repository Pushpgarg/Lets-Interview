import logging
from motor.motor_asyncio import AsyncIOMotorClient
from backend.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    """
    MongoDB Database Manager.
    Handles connections to the database using the Motor async driver.
    """
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None

    async def connect_to_database(self) -> None:
        """
        Establish a connection to the MongoDB instance and ping the admin database.
        """
        if self.client is not None:
            logger.warning("MongoDB connection is already active.")
            return

        logger.info("Connecting to MongoDB...")
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            # Verify the connection using ping
            await self.client.admin.command("ping")
            
            db_name = settings.PROJECT_NAME.lower().replace(" ", "_")
            self.db = self.client[db_name]
            logger.info(f"Connected to MongoDB successfully. Database: '{db_name}'")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

    async def close_database_connection(self) -> None:
        """
        Close the active connection to MongoDB.
        """
        if self.client is None:
            logger.warning("No active MongoDB connection to close.")
            return

        logger.info("Closing MongoDB connection...")
        self.client.close()
        self.client = None
        self.db = None
        logger.info("MongoDB connection closed.")

    def get_db(self):
        """
        Retrieve the active database instance.
        Raises RuntimeError if the connection has not been established.
        """
        if self.db is None:
            raise RuntimeError("Database connection has not been initialized. Call connect_to_database() first.")
        return self.db

# Singleton Database Manager Instance
db_manager = DatabaseManager()

# Helper functions for lifespan management and dependency injection
async def connect_to_mongo() -> None:
    await db_manager.connect_to_database()

async def close_mongo_connection() -> None:
    await db_manager.close_database_connection()

def get_database():
    """
    Dependency injection provider for getting the database instance.
    """
    return db_manager.get_db()
