from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import os
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Folder, User, Project, File
from pydantic import BaseModel, ConfigDict
import bcrypt
from typing import List
from sqlalchemy.sql import text
from pydantic import UUID4
from fastapi import UploadFile, File as FastAPIFile
from typing import Dict, Any
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any, ForwardRef
from uuid import UUID
from llm_backend.routes import llm_router

app = FastAPI()

# Create database tables
Base.metadata.create_all(bind=engine)

FRONTEND_URL = "http://localhost:5173"

#include all of the routers created so it routes correctly
app.include_router(llm_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the CodeOH FastAPI server!"}


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Add this after creating the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FileNode(BaseModel):
    key: str
    label: str
    data: Dict[str, Any]
    children: List["FileNode"] | None = None


class FileTreeResponse(BaseModel):
    files: List[FileNode]


class UserIdRequest(BaseModel):
    userId: str


# User API
class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    model_config = ConfigDict(from_attributes=True)


@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        UserResponse(id=str(user.id), username=user.username, email=user.email)
        for user in users
    ]


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=str(user.id), username=user.username, email=user.email)


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    new_user = User(
        username=user.username, email=user.email, password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse.model_validate(new_user)


@app.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


class FileContent(BaseModel):
    content: str


class FolderUploadRequest(BaseModel):
    name: str
    parentFolderId: Optional[str]  # This allows root folders to have `None`


class FileUploadRequest(BaseModel):
    userId: str
    folders: List[FolderUploadRequest]
    files: List[Dict[str, Any]]


# Project API
class ProjectCreate(BaseModel):
    user_id: str
    name: str
    description: str


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    model_config = ConfigDict(from_attributes=True)


@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [ProjectResponse.model_validate(project) for project in projects]


@app.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = Project(**project.model_dump())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return ProjectResponse.model_validate(new_project)


@app.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


# File API
class FileCreate(BaseModel):
    project_id: str
    filename: str
    file_type: str


class FileResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    file_type: str
    model_config = ConfigDict(from_attributes=True)


@app.post("/files", response_model=FileResponse)
def upload_file(file: FileCreate, db: Session = Depends(get_db)):
    new_file = File(**file.model_dump())
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return FileResponse.model_validate(new_file)


@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "Database connected"}
    except Exception as e:
        return {"status": "Database connection failed", "error": str(e)}


# Secret key for JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Hash password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


# Generate JWT token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username, email=user.email, password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}


@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/auth/user")
def handle_kinde_auth(user_request: UserIdRequest, db: Session = Depends(get_db)):
    """
    Handle authentication from Kinde Auth.
    - Checks if a user with the provided Kinde user ID exists
    - If not, creates a placeholder user with the Kinde user ID
    """
    # Check if user exists with the provided ID
    user = db.query(User).filter(User.id == user_request.userId).first()

    # If user doesn't exist, create a placeholder user
    is_new_user = False
    if not user:
        is_new_user = True
        # Create placeholder user with Kinde ID
        # Note: Using placeholder values for required fields
        placeholder_username = (
            f"user_{user_request.userId[:8]}"  # Create a unique username
        )
        placeholder_email = f"user_{user_request.userId[:8]}@placeholder.com"  # Create a placeholder email
        placeholder_password = bcrypt.hashpw(
            user_request.userId.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        new_user = User(
            id=user_request.userId,  # Use the Kinde user ID
            username=placeholder_username,
            email=placeholder_email,
            password_hash=placeholder_password,
        )

        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Failed to create user: {str(e)}"
            )

    return {
        "id": str(user.id),
        "isNewUser": is_new_user,
        "message": (
            "User created successfully"
            if is_new_user
            else "User retrieved successfully"
        ),
    }


@app.get("/api/files")
def get_user_files(userId: str, db: Session = Depends(get_db)):
    try:
        # Get user's projects
        projects = db.query(Project).filter(Project.user_id == userId).all()
        file_tree = []

        for project in projects:
            print(f"Processing project: {project.name}")
            # Get all folders in the project
            folders = db.query(Folder).filter(Folder.project_id == project.id).all()
            print(f"Found {len(folders)} folders")
            folder_map = {folder.id: folder for folder in folders}

            # Get all files
            files = db.query(File).filter(File.project_id == project.id).all()
            print(f"Found {len(files)} files")

            # Build a folder tree
            def build_folder_structure(folder):
                return {
                    "key": str(folder.id),
                    "label": folder.name,
                    "data": {"isDirectory": True, "content": None},
                    "children": [
                        build_folder_structure(subfolder)
                        for subfolder in folder.subfolders
                    ]
                    + [
                        {
                            "key": str(file.id),
                            "label": file.filename,
                            "data": {
                                "isDirectory": False,
                                "content": file.content or "",
                                "fileType": file.file_type,
                            },
                        }
                        for file in folder.files
                    ],
                }

            # Organize root-level folders
            root_folders = [folder for folder in folders if not folder.parent_folder_id]
            project_node = {
                "key": str(project.id),
                "label": project.name,
                "data": {"isDirectory": True, "content": None},
                "children": [build_folder_structure(folder) for folder in root_folders],
            }

            # Add loose files (not inside folders)
            project_node["children"].extend(
                [
                    {
                        "key": str(file.id),
                        "label": file.filename,
                        "data": {
                            "isDirectory": False,
                            "content": file.content or "",
                            "fileType": file.file_type,
                        },
                    }
                    for file in files
                    if file.folder_id is None
                ]
            )

            file_tree.append(project_node)

        return {"files": file_tree}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/files/{file_id}/content")
def get_file_content(file_id: str, userId: str, db: Session = Depends(get_db)):
    try:
        print(f"Getting content for file ID: {file_id}, userId: {userId}")

        # First, get the file
        file = db.query(File).filter(File.id == file_id).first()
        print(f"Found file: {file.filename if file else 'None'}")

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Get the project to verify user has access
        project = db.query(Project).filter(Project.id == file.project_id).first()
        print(f"Found project: {project.name if project else 'None'}")

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Verify user has access to this file
        if str(project.user_id) != userId:  # Convert UUID to string for comparison
            print(
                f"Auth failed: Project user_id: {project.user_id}, Request userId: {userId}"
            )
            raise HTTPException(
                status_code=403, detail="Not authorized to access this file"
            )

        # Return the file content
        print(f"Returning content length: {len(file.content) if file.content else 0}")
        return {"content": file.content or "", "fileType": file.file_type}
    except Exception as e:
        print(f"Error in get_file_content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/files/{file_id}")
def delete_file(
    file_id: str, user_request: UserIdRequest, db: Session = Depends(get_db)
):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Verify user has permission to delete this file
    project = db.query(Project).filter(Project.id == file.project_id).first()
    if project.user_id != user_request.userId:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this file"
        )

    db.delete(file)
    db.commit()
    return {"message": "File deleted successfully"}


@app.post("/api/files/upload")
def upload_files(request: FileUploadRequest, db: Session = Depends(get_db)):
    try:
        print(f"Received upload request for user: {request.userId}")
        print(f"Number of files: {len(request.files)}")

        project = db.query(Project).filter(Project.user_id == request.userId).first()
        if not project:
            project = Project(
                user_id=request.userId,
                name="Default Project",
                description="Default project for uploaded files",
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"Created new project with ID: {project.id}")

        folder_map = {}
        # Store folders first
        for folder_data in request.folders:
            parent_id = folder_map.get(folder_data.parentFolderId)
            new_folder = Folder(
                project_id=project.id,
                name=folder_data.name,
                parent_folder_id=parent_id,
            )
            db.add(new_folder)
            db.flush()
            folder_map[folder_data.name] = new_folder.id
            print(f"Created folder: {folder_data.name} with ID: {new_folder.id}")

        # Store files
        uploaded_files = []
        for file_data in request.files:
            folder_id = folder_map.get(file_data["folderName"])
            content = file_data.get("content", "")

            print(f"Processing file: {file_data['filename']}")
            print(f"Content length: {len(content)}")
            print(f"First 100 chars: {content[:100]}")

            new_file = File(
                project_id=project.id,
                folder_id=folder_id,
                filename=file_data["filename"],
                file_type=file_data.get("fileType")
                or (
                    file_data["filename"].split(".")[-1]
                    if "." in file_data["filename"]
                    else ""
                ),
                content=content,
            )
            db.add(new_file)
            db.flush()

            print(f"Created file with ID: {new_file.id}")
            print(f"Saved content length: {len(new_file.content or '')}")

            uploaded_files.append(
                {
                    "key": str(new_file.id),
                    "label": new_file.filename,
                    "data": {
                        "isDirectory": False,
                        "content": new_file.content,
                        "fileType": new_file.file_type,
                    },
                }
            )

        db.commit()
        return {"files": uploaded_files}
    except Exception as e:
        print(f"Upload error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


