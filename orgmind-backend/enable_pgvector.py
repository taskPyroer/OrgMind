import logging
from sqlalchemy import text
from app.db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def enable_vector_extension():
    try:
        with engine.connect() as connection:
            logger.info("Attempting to enable pgvector extension...")
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            connection.commit()
            logger.info("Successfully enabled pgvector extension.")
    except Exception as e:
        logger.error(f"Failed to enable pgvector extension: {e}")

if __name__ == "__main__":
    enable_vector_extension()
