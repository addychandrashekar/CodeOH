import numpy as np
from embedding import generate_embedding
from database import store_embedding_in_supabase, query_supabase_for_embeddings

def search_code(query_embedding, match_threshold=0.5):
    """Search for the most relevant code snippets"""

    results = query_supabase_for_embeddings(query_embedding, match_threshold=match_threshold)

    context_list = []
    for result in results: context_list.append(f"File: {result["file_name"]}\nCode: {result["code_snippet"]}\n")
    
    return "\n".join(context_list)