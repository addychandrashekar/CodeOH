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
from .utils import vector_search  # Import vector_search from utils
import os
import shutil
from pathlib import Path
import re
from sqlalchemy.orm import Session
import sys
import os
from sqlalchemy import text

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
async def chat(request: dict, db: Session = Depends(get_db)):
    """Handles chat requests, routing them to the appropriate LLM function."""
    user_message = request.get("user_message", "")
    user_id = request.get("user_id", "")

    if not user_message:
        return {"error": "No message provided"}

    # Detect if this is a search query for code
    search_patterns = [
        r"show me all (?:the )?code related to (\w+)",
        r"find (?:all )?code (?:related to|for|about) (\w+)",
        r"search for (\w+) in (?:the )?code",
        r"look for (\w+) in (?:the )?code",
        r"show me (?:the )?code for (\w+)",
        r"where is (?:the )?code for (\w+)",
    ]

    is_search_query = False
    search_term = None

    for pattern in search_patterns:
        match = re.search(pattern, user_message.lower())
        if match:
            is_search_query = True
            search_term = match.group(1)
            print(f"[DEBUG] Detected search query for term: {search_term}")
            break

    try:
        # If this is a code search query, handle it with a specialized approach
        if is_search_query and search_term:
            print(f"[DEBUG] Processing code search query for: {search_term}")
            try:
                # Use vector search to find relevant code
                results = vector_search(search_term, user_id, top_k=5)

                if not results or len(results) == 0:
                    return {
                        "response": {
                            "text": f"I couldn't find any code related to '{search_term}'. Please try a different search term."
                        },
                        "query_type": "code_search",
                    }

                # Build a response with the code snippets found
                response_text = f"Here's the code related to '{search_term}':\n\n"

                for idx, result in enumerate(results):
                    filename = result.get("filename", "unknown")
                    snippet = result.get("content", "")

                    # Add the file and code snippet to the response
                    response_text += f"**File: {filename}**\n\n"
                    file_extension = (
                        filename.split(".")[-1] if "." in filename else "txt"
                    )
                    response_text += f"```{file_extension}\n{snippet}\n```\n\n"

                return {
                    "response": {"text": response_text},
                    "query_type": "code_search",
                }
            except Exception as e:
                print(f"[ERROR] Code search query processing failed: {str(e)}")
                # Fall back to regular processing if specialized search fails

        # Regular query processing continues below
        # Determine the query type
        query_type = classify_query(user_message)
        print(f"Detected query type: {query_type}")

        # Get repository summary to provide context to the LLM
        repo_summary = get_repository_summary(user_id)

        # Based on query type, route to appropriate function
        if query_type == "code_search":
            # Search for relevant code snippets
            search_results = await search_code(user_message, user_id)

            # Format results for readability
            if search_results:
                context = format_search_results(search_results)
            else:
                context = "No relevant code found"

            # Generate response that explains the code found
            response = generate_llm_response(context, user_message)
            return {"response": response, "query_type": query_type}

        elif query_type == "code_explanation":
            # Search for code to explain
            search_results = await search_code(user_message, user_id)

            # Format results for explanation
            if search_results:
                context = format_search_results(search_results)
            else:
                context = "No relevant code found to explain"

            # Generate explanation
            response = generate_code_explanation(context, user_message)
            return {"response": response, "query_type": query_type}

        elif query_type == "code_optimization":
            # Search for code to optimize
            search_results = await search_code(user_message, user_id)

            # Format results for optimization
            if search_results:
                context = format_search_results(search_results)
            else:
                context = "No relevant code found to optimize"

            # Generate optimization suggestions
            response = generate_optimization_advice(context, user_message)
            return {"response": response, "query_type": query_type}

        elif query_type == "file_modification":
            # Generate file modification instructions
            response = generate_file_modification(
                repo_summary, user_message, db, user_id
            )
            return {"response": response, "query_type": query_type}

        elif query_type == "code_generation":
            # Generate code based on description
            response = generate_code_implementation(repo_summary, user_message)
            return {"response": response, "query_type": query_type}

        else:  # general
            # Answer general questions
            response = generate_general_response(repo_summary, user_message)
            return {"response": response, "query_type": query_type}

    except Exception as e:
        print(f"Error: {str(e)}")
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
        if content:
            print(f"[DEBUG] Checking content for markdown code blocks")

            # Remove opening code block delimiter (```python or just ```)
            content = re.sub(
                r"^```(?:python|javascript|js|html|css|[a-zA-Z]*)\n", "", content
            )
            # Remove closing code block delimiter
            content = re.sub(r"\n```$", "", content)

            # Also check for any additional markdown code blocks inside the content
            content = re.sub(
                r"```(?:python|javascript|js|html|css|[a-zA-Z]*)\n", "", content
            )
            content = re.sub(r"\n```", "", content)

            # More aggressive cleanup for any remaining code block markers
            content = (
                content.replace("```python", "")
                .replace("```js", "")
                .replace("```javascript", "")
            )
            content = (
                content.replace("```html", "").replace("```css", "").replace("```", "")
            )

            # Remove any leading/trailing whitespace that might have been added during cleanup
            content = content.strip()

            print(f"[DEBUG] Content after cleanup: {len(content)} bytes")
            print(f"[DEBUG] First 100 chars: {content[:100]}")

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
            print(
                f"[DEBUG] Previous content length: {len(existing_file.content) if existing_file.content else 0}"
            )
            print(f"[DEBUG] New content length: {len(content) if content else 0}")

            # Use direct SQL update to ensure changes persist
            file_id = existing_file.id
            print(f"[DEBUG] Using direct SQL update for file ID: {file_id}")

            update_query = text("UPDATE files SET content = :content WHERE id = :id")
            db.execute(update_query, {"content": content, "id": file_id})
            db.commit()
            print(f"[DEBUG] Direct SQL update executed")

            # Verify update by fetching directly from DB
            verify_query = text("SELECT content FROM files WHERE id = :id")
            result = db.execute(verify_query, {"id": file_id}).fetchone()
            if result:
                print(f"[DEBUG] Verified content length after update: {len(result[0])}")
            else:
                print(f"[DEBUG] Warning: Could not verify update")
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

        # Explicitly refresh data if we updated an existing file
        if existing_file:
            db.refresh(existing_file)
            print(
                f"[DEBUG] Refreshed file object: content length {len(existing_file.content)}"
            )

        # If it's a new file, also add it to the embedding database for future searches
        if is_new_file:
            print(f"[DEBUG] Generating embedding for new file")
            embedding = generate_embedding(content)
            store_embedding_in_supabase(user_id, filename, content, embedding)
            print(f"[DEBUG] Stored embedding in database")

        # Return the updated content along with success message to ensure frontend has latest data
        return {
            "message": f"File {'created' if is_new_file else 'modified'} successfully",
            "filename": filename,
            "database_updated": True,
            "content": content,
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
