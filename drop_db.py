from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DATABASE_URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine without specific database
engine = create_engine(DATABASE_URL)


# Drop all tables
def drop_tables():
    try:
        # Create a new session
        Session = sessionmaker(bind=engine)
        session = Session()

        # Drop all tables using raw SQL
        session.execute(
            text(
                """
            DROP TABLE IF EXISTS files CASCADE;
            DROP TABLE IF EXISTS folders CASCADE;
            DROP TABLE IF EXISTS projects CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        """
            )
        )

        session.commit()
        print("All tables dropped successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        session.close()


if __name__ == "__main__":
    drop_tables()
