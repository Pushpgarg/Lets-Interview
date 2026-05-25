import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import connect_to_mongo, close_mongo_connection
from backend.api.health import router as health_router
from backend.api.ws_router import router as ws_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events using lifespan context.
    Establishes and terminates MongoDB connections cleanly.
    """
    logger.info("Initializing application startup sequence...")
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.critical(f"Startup database connection failed: {e}. Exiting.")
        raise e
    
    yield
    
    logger.info("Initializing application shutdown sequence...")
    await close_mongo_connection()

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Lets Interview SaaS application.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware allowing all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(ws_router)
