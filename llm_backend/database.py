import supabase
import os
from dotenv import load_dotenv
import json
from collections import defaultdict

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

# Initialize Supabase client
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_API_KEY)


def store_embedding_in_supabase(user_id, file_name, code, embedding):
    """Stores code embeddings in Supabase."""
    response = (
        supabase_client.table("code_embeddings")
        .insert(
            {
                "user_id": user_id,
                "file_name": file_name,
                "code_snippet": code,
                "embedding": embedding,
            }
        )
        .execute()
    )

    return response


def query_supabase_for_embeddings(user_id, query_embedding, match_threshold=0.5):
    """Performs a vector similarity search in Supabase."""
    response = supabase_client.rpc(
        "match_code",
        {
            "user_id": user_id,
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
        },
    ).execute()

    print("supabase response.data", response.data)

    return response.data


def get_repository_summary(user_id):
    """
    Retrieves a summary of the user's repository structure.

    This includes:
    - List of files by type
    - Common patterns or technologies
    - Basic statistics

    Args:
        user_id (str): The user's ID

    Returns:
        str: A formatted summary of the repository
    """
    try:
        # Get all files for this user
        response = (
            supabase_client.table("code_embeddings")
            .select("file_name, code_snippet")
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            return "No code has been indexed for this repository yet."

        # Group files by type/extension
        file_types = defaultdict(list)
        total_lines = 0
        snippets_count = len(response.data)

        for item in response.data:
            file_name = item.get("file_name", "")
            code = item.get("code_snippet", "")

            # Skip if file_name is missing
            if not file_name:
                continue

            # Count lines of code
            if code:
                total_lines += len(code.split("\n"))

            # Get file extension
            if "." in file_name:
                ext = file_name.split(".")[-1].lower()
                file_types[ext].append(file_name)
            else:
                file_types["other"].append(file_name)

        # Build repo summary
        summary = ["## Repository Summary"]

        # File types breakdown
        summary.append("\n### File Types")
        for ext, files in file_types.items():
            summary.append(f"- **{ext}**: {len(files)} file(s)")

        # List some files as examples
        summary.append("\n### Files (Sample)")
        file_list = []
        for ext, files in file_types.items():
            # Take up to 5 files of each type
            for file in files[:5]:
                file_list.append(f"- `{file}`")

        # Cap the number of files we show
        if file_list:
            summary.extend(file_list[:20])
            if len(file_list) > 20:
                summary.append(f"- ... and {len(file_list) - 20} more files")

        # Basic stats
        summary.append("\n### Statistics")
        summary.append(f"- **Total Indexed Snippets**: {snippets_count}")
        summary.append(f"- **Total Lines of Code**: {total_lines}+")
        summary.append(f"- **File Types**: {len(file_types)}")

        # Join all parts with proper spacing
        return "\n".join(summary)

    except Exception as e:
        print(f"Error getting repository summary: {str(e)}")
        return f"Error retrieving repository information: {str(e)}"
