from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


# Drop all tables
def drop_tables():
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
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
