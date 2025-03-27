from fastapi import APIRouter, Query, Depends
from .search import search_code
from .embedding import generate_embedding
from .llm_response import (
    generate_llm_response,
    generate_code_explanation,
    generate_optimization_advice,
    generate_general_response,
    generate_code_implementation,
    generate_file_modification,
)
from .database import store_embedding_in_supabase, get_repository_summary
from .query_classifier import classify_query
import os
import shutil
from pathlib import Path
import re
from sqlalchemy.orm import Session
import sys
import os

# Add the parent directory to sys.path to be able to import database
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import SessionLocal
from models import File, Project, Folder
import uuid

llm_router = APIRouter()


# Function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_and_create_projects_dir():
    """
    Check if the user_projects directory exists and create it if not.
    Returns information about the directory structure for debugging.
    """
    current_file = os.path.abspath(__file__)
    current_dir = os.path.dirname(current_file)
    parent_dir = os.path.dirname(current_dir)
    user_projects_dir = os.path.join(parent_dir, "user_projects")

    info = {
        "current_file": current_file,
        "current_dir": current_dir,
        "parent_dir": parent_dir,
        "user_projects_dir": user_projects_dir,
        "user_projects_exists": os.path.exists(user_projects_dir),
        "cwd": os.getcwd(),
    }

    # List parent dir contents
    parent_contents = os.listdir(parent_dir)
    info["parent_dir_contents"] = parent_contents

    # Create directory if it doesn't exist
    if not os.path.exists(user_projects_dir):
        try:
            os.makedirs(user_projects_dir, exist_ok=True)
            info["user_projects_created"] = True
            info["user_projects_exists_after_creation"] = os.path.exists(
                user_projects_dir
            )
        except Exception as e:
            info["creation_error"] = str(e)

    return info


@llm_router.post("/chat")
async def chat_with_llm(request: dict):
    """
    Handles the user query, retrieves context from Supabase, and sends it to LLM to generate a response.

    Now supports different types of queries:
    - Code search: Find code snippets (original functionality)
    - Code explanation: Explain how code works
    - Code optimization: Suggest improvements to code
    - Code generation: Create new code based on natural language description
    - File modification: Modify existing files or create new files
    - General: Answer general questions about the codebase or programming

    Request should contain a body with the structure:
        {
            "user_message": message,
            "user_id": user_id
        }
    """

    try:
        user_message = request.get("user_message")
        user_id = request.get("user_id")

        # Step 1: Classify the query type
        query_type = classify_query(user_message)
        print(f"Query type classified as: {query_type}")

        # Step 2: Handle based on query type
        if query_type == "code_search":
            # Existing code search logic
            query_embedding = generate_embedding(user_message)
            context = search_code(user_id, query_embedding, 0.5)
            llm_response = generate_llm_response(context, user_message)

        elif query_type == "code_explanation":
            # Find code first, then explain it
            query_embedding = generate_embedding(user_message)
            context = search_code(user_id, query_embedding, 0.3)  # Lower threshold
            llm_response = generate_code_explanation(context, user_message)

        elif query_type == "code_optimization":
            # Find code, then provide optimization suggestions
            query_embedding = generate_embedding(user_message)
            context = search_code(user_id, query_embedding, 0.3)
            llm_response = generate_optimization_advice(context, user_message)

        elif query_type == "code_generation":
            # Generate new code based on natural language description
            repo_summary = get_repository_summary(user_id)
            llm_response = generate_code_implementation(repo_summary, user_message)

        elif query_type == "file_modification":
            # Generate file modification proposal that requires user confirmation
            repo_summary = get_repository_summary(user_id)
            llm_response = generate_file_modification(repo_summary, user_message)
            # Log the file_data for debugging
            if "file_data" in llm_response:
                print(
                    f"File modification detected: {llm_response['file_data']['filename']}"
                )
                print(f"Is new file: {llm_response['file_data']['is_new_file']}")
                print(f"Content length: {len(llm_response['file_data']['content'])}")
            else:
                print(
                    "Warning: file_data not found in llm_response for file_modification"
                )

        else:  # General questions
            # Use repository context and answer directly
            repo_summary = get_repository_summary(user_id)
            llm_response = generate_general_response(repo_summary, user_message)

        return {"response": llm_response, "query_type": query_type}

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return {"error": str(e)}


@llm_router.post("/apply_file_modification")
async def apply_file_modification(request: dict, db: Session = Depends(get_db)):
    """
    Applies the file modification after user confirmation.
    Creates or modifies files in the database so they appear in the UI.
    No longer creates local files to save disk space.

    Request should contain a body with the structure:
        {
            "file_data": {
                "filename": filename,
                "content": content,
                "is_new_file": boolean
            },
            "user_id": user_id,
            "confirmed": boolean
        }
    """
    try:
        print(f"[DEBUG] ===== RECEIVED FILE MODIFICATION REQUEST =====")
        print(f"[DEBUG] Request keys: {request.keys()}")

        file_data = request.get("file_data")
        user_id = request.get("user_id")
        confirmed = request.get("confirmed", False)

        print(f"[DEBUG] File modification request received: {file_data}")
        print(f"[DEBUG] User ID: {user_id}, Confirmed: {confirmed}")
        print(f"[DEBUG] File data keys: {file_data.keys() if file_data else 'None'}")

        if not confirmed:
            print(f"[DEBUG] Confirmation was not received, exiting")
            return {"message": "File modification cancelled by user"}

        if not file_data or not user_id:
            print(
                f"[ERROR] Missing required data: file_data={bool(file_data)}, user_id={bool(user_id)}"
            )
            return {"error": "Missing required data"}

        filename = file_data.get("filename")
        content = file_data.get("content")
        is_new_file = file_data.get("is_new_file", True)

        print(f"[DEBUG] Processing file modification request for file: {filename}")
        print(
            f"[DEBUG] Is new file: {is_new_file}, Content length: {len(content) if content else 0}"
        )

        # Clean up content if needed - remove markdown code block delimiters
        if content and content.startswith("```"):
            print(
                f"[DEBUG] Content appears to contain markdown code blocks, cleaning up"
            )
            # Remove opening code block delimiter (```python or just ```)
            content = re.sub(
                r"^```(?:python|javascript|js|html|css|[a-zA-Z]*)\n", "", content
            )
            # Remove closing code block delimiter
            content = re.sub(r"\n```$", "", content)
            print(f"[DEBUG] Content after cleanup: {len(content)} bytes")

        # Find or create project for this user
        project = db.query(Project).filter(Project.user_id == user_id).first()
        if not project:
            print(f"[DEBUG] Creating new project for user: {user_id}")
            project = Project(
                user_id=user_id,
                name="Default Project",
                description="Default project for uploaded files",
            )
            db.add(project)
            db.commit()
            db.refresh(project)

        # Check if file already exists in database
        existing_file = (
            db.query(File)
            .filter(File.project_id == project.id, File.filename == filename)
            .first()
        )

        if existing_file:
            print(f"[DEBUG] File already exists in database, updating content")
            existing_file.content = content
        else:
            print(f"[DEBUG] Creating new file record in database")
            # Create a new file record
            file_type = filename.split(".")[-1] if "." in filename else ""
            new_file = File(
                project_id=project.id,
                filename=filename,
                file_type=file_type,
                content=content,
            )
            db.add(new_file)

        # Commit changes to database
        db.commit()
        print(f"[DEBUG] Database updated successfully")

        # If it's a new file, also add it to the embedding database for future searches
        if is_new_file:
            print(f"[DEBUG] Generating embedding for new file")
            embedding = generate_embedding(content)
            store_embedding_in_supabase(user_id, filename, content, embedding)
            print(f"[DEBUG] Stored embedding in database")

        return {
            "message": f"File {'created' if is_new_file else 'modified'} successfully",
            "filename": filename,
            "database_updated": True,
        }
    except Exception as e:
        print(f"[ERROR] Error in apply_file_modification endpoint: {str(e)}")
        return {"error": str(e)}


@llm_router.post("/addToDB")
async def add_to_db(request: dict):
    """
    Takes in file_name and code_snippet, generates an embedding, and adds it to the database.
    """
    try:
        file_name = request.get("file_name")
        code_snippet = request.get("code_snippet")
        user_id = request.get("user_id")

        # make sure both file name and code is provided
        if not file_name or not code_snippet:
            return {"error": "file_name and code_snippet are required"}

        # generate the embedding for the code snippet
        embedding = generate_embedding(code_snippet)

        # store the data in Supabase
        store_embedding_in_supabase(user_id, file_name, code_snippet, embedding)

        return {"message": "Code snippet added successfully", "file_name": file_name}

    except Exception as e:
        return {"error": str(e)}
