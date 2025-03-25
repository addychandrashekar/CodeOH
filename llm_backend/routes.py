from fastapi import APIRouter, Query
from .search import search_code
from .embedding import generate_embedding
from .llm_response import generate_llm_response
from .database import store_embedding_in_supabase

llm_router = APIRouter()

@llm_router.post("/chat")
async def chat_with_llm(request: dict):
    """
    Handles the user query, retrieves context from Supabase, and sends it to LLM to generate a response.
    
    Request should contain a body with the structure:
        {
            "user_message": message
        }
    
        message will just be a string which contains message such as "find me all of code related to authentication"
    """
    
    try:
        user_message = request.get("user_message")

        query_embedding = generate_embedding(user_message)

        context = search_code(query_embedding)

        llm_response = generate_llm_response(context, user_message)

        return {"response": llm_response}

    except Exception as e:
        return {"error": str(e)}

@llm_router.post("/addToDB")
async def add_to_db(request: dict):
    """
    Takes in file_name and code_snippet, generates an embedding, and adds it to the database.
    """
    try:
        file_name = request.get("file_name")
        code_snippet = request.get("code_snippet")

        #make sure both file name and code is provided
        if not file_name or not code_snippet:
            return {"error": "file_name and code_snippet are required"}

        #generate the embedding for the code snippet
        embedding = generate_embedding(code_snippet)

        #store the data in Supabase
        store_embedding_in_supabase(file_name, code_snippet, embedding)

        return {"message": "Code snippet added successfully", "file_name": file_name}

    except Exception as e:
        return {"error": str(e)}

