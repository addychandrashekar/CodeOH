from sqlalchemy import Column, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from database import Base

# Users Table
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default="now()")

# Projects Table
class Project(Base):
    __tablename__ = "projects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, default="now()")

    user = relationship("User")
    folders = relationship("Folder", back_populates="project", cascade="all, delete-orphan")
    files = relationship("File", back_populates="project", cascade="all, delete-orphan")

# Files Table
class File(Base):
    __tablename__ = "files"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID, ForeignKey("projects.id", ondelete="CASCADE"))
    folder_id = Column(UUID, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)  # Allow root-level files
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    uploaded_at = Column(TIMESTAMP, default="now()")

    project = relationship("Project", back_populates="files")
    folder = relationship("Folder", back_populates="files")

# Folder Table
class Folder(Base):
    __tablename__ = "folders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID, ForeignKey("projects.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(TIMESTAMP, default="now()")

    project = relationship("Project", back_populates="folders")
    parent = relationship("Folder", remote_side=[id])
    subfolders = relationship("Folder", back_populates="parent", cascade="all, delete-orphan")
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")