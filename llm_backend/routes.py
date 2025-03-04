from fastapi import APIRouter, Query
from search import search_code
from embedding import generate_embedding
from llm_response import generate_llm_response

router = APIRouter()

@router.post("/chat")
async def chat_with_llm(request: dict):
    """
    Handles the user query, retrieves context from Supabase, and sends it to LLM to generate a response.
    
    Request should contain a body with the structure:
        {
            "user_message": message
        }
    
        message will just be a string which contains message such as "find me all of code related to authentication"
    """
    user_message = request.get("user_message")

    query_embedding = generate_embedding(user_message)

    context = search_code(query_embedding)

    llm_response = generate_llm_response(context, user_message)

    return {"response": llm_response}