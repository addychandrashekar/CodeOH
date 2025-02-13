from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


DATABASE_URL = "postgresql://postgres.qxgwfvulnkcqzewziffj:Ob5uFY3IpK5u9TOT@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "sslmode": "require",
        "gssencmode": "disable"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
