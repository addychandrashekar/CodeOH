from sqlalchemy import Column, String, Boolean, ForeignKey, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from database import Base


# Users Table
class User(Base):
    __tablename__ = "users"
    # id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id = Column(String(100), primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default="now()")

    # Relationships
    projects = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )


# Projects Table
class Project(Base):
    __tablename__ = "projects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, default="now()")

    # Relationships
    user = relationship("User", back_populates="projects")
    folders = relationship(
        "Folder", back_populates="project", cascade="all, delete-orphan"
    )
    files = relationship("File", back_populates="project", cascade="all, delete-orphan")


# Files Table
class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"), nullable=True)
    filename = Column(String)
    file_type = Column(String)
    content = Column(Text, default="")

    # Relationships
    project = relationship("Project", back_populates="files")
    folder = relationship("Folder", back_populates="files")

# Folder Table
class Folder(Base):
    __tablename__ = "folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    parent_folder_id = Column(
        UUID(as_uuid=True), ForeignKey("folders.id"), nullable=True
    )
    name = Column(String)

    # Relationships
    project = relationship("Project", back_populates="folders")
    parent_folder = relationship("Folder", remote_side=[id], backref="subfolders")
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")
