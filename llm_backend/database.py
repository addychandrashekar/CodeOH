import supabase
import os
from dotenv import load_dotenv
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

# Initialize Supabase client
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_API_KEY)

def store_embedding_in_supabase(user_id, file_name, code, embedding):
    """Stores code embeddings in Supabase."""
    response = supabase_client.table("code_embeddings").insert({
        "user_id": user_id,
        "file_name": file_name,
        "code_snippet": code,
        "embedding": embedding
    }).execute()

    return response

def query_supabase_for_embeddings(user_id, query_embedding, match_threshold=0.5):
    """Performs a vector similarity search in Supabase."""
    response = supabase_client.rpc("match_code", {
        "user_id": user_id,
        "query_embedding": query_embedding,
        "match_threshold": match_threshold,
    }).execute()
    
    return response.data