def vector_search(search_term, user_id, top_k=5):
    """
    Search for code snippets related to a search term using vector embeddings.

    Args:
        search_term (str): The term to search for
        user_id (str): The user ID to limit search to user's files
        top_k (int): Maximum number of results to return

    Returns:
        list: List of dictionaries with filename and content matching the search
    """
    try:
        # Generate embedding for search term
        embedding = generate_embedding(search_term)

        # Query Supabase for similar code
        from llm_backend.db import supabase_client

        print(f"[DEBUG] Searching for code related to: {search_term}")

        # Use Supabase vector search (modify this based on your actual Supabase setup)
        response = supabase_client.rpc(
            "match_documents",
            {
                "query_embedding": embedding,
                "match_threshold": 0.5,
                "match_count": top_k,
                "user_id": user_id,
            },
        ).execute()

        results = response.data

        # If no results found through vector search, try a basic keyword search
        if not results or len(results) == 0:
            print(
                f"[DEBUG] No vector matches found, trying keyword search for: {search_term}"
            )

            # Fallback to a basic string search
            response = (
                supabase_client.table("code_embeddings")
                .select("filename, content")
                .filter("content", "ilike", f"%{search_term}%")
                .filter("user_id", "eq", user_id)
                .limit(top_k)
                .execute()
            )
            results = response.data

        print(f"[DEBUG] Found {len(results)} results for search: {search_term}")

        # Format the results
        formatted_results = []
        for item in results:
            # Extract relevant snippet around the search term if possible
            content = item.get("content", "")
            filename = item.get("filename", "unknown")

            # Try to extract a relevant section around the match
            if search_term.lower() in content.lower():
                lines = content.split("\n")
                term_lines = []

                for i, line in enumerate(lines):
                    if search_term.lower() in line.lower():
                        # Get a context window around the match
                        start = max(0, i - 5)
                        end = min(len(lines), i + 6)
                        term_lines = lines[start:end]
                        break

                if term_lines:
                    content = "\n".join(term_lines)

            formatted_results.append({"filename": filename, "content": content})

        return formatted_results
    except Exception as e:
        print(f"[ERROR] Vector search failed: {str(e)}")
        # Return empty array in case of failure
        return []
