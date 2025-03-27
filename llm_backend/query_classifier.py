"""
Query classifier module for determining the type of user query.
This helps route the query to the appropriate response generator.
"""


def classify_query(query_text):
    """
    Determines the type of query:
    - file_modification: Modifying or creating files with @filename syntax
    - code_search: Finding code snippets based on a description
    - code_explanation: Explaining how code works
    - code_optimization: Suggesting improvements to code
    - code_generation: Creating new code based on a description
    - general: General questions about the codebase or programming

    Args:
        query_text (str): The user's query text

    Returns:
        str: The query type
    """

    # Simple rule-based classifier
    query_lower = query_text.lower()

    # File modification patterns - check first
    if (
        any(
            term in query_lower
            for term in [
                "modify file",
                "edit file",
                "update file",
                "change file",
                "create file",
                "make a file",
                "write to file",
                "save to file",
                "@",
            ]
        )
        or "@" in query_text
        # Add more patterns for file creation with variations
        or "new file called" in query_lower
        or "new file named" in query_lower
        or "create a new file" in query_lower
        or "create a file" in query_lower
        or "make a new file" in query_lower
        or "file called" in query_lower
        and any(
            term in query_lower
            for term in [
                "create",
                "make",
                "write",
                "implement",
                "new",
            ]
        )
    ):  # Check for @filename syntax
        return "file_modification"

    # Code generation patterns
    if any(
        term in query_lower
        for term in [
            "create",
            "generate",
            "write",
            "implement",
            "make a",
            "code a",
            "build a",
            "develop",
            "new function",
            "new class",
            "new method",
            "function for",
            "how to code",
            "how to make",
            "how would you code",
            "could you write",
            "write me",
            "make me",
        ]
    ):
        return "code_generation"

    # Code search patterns
    if any(
        term in query_lower
        for term in [
            "find",
            "search",
            "show me",
            "where is",
            "code for",
            "look for",
            "locate",
            "get",
            "fetch",
            "contains",
            "has",
            "implements",
            "uses",
        ]
    ):
        return "code_search"

    # Code explanation patterns
    if any(
        term in query_lower
        for term in [
            "explain",
            "how does",
            "what does",
            "understand",
            "describe",
            "clarify",
            "tell me about",
            "help me understand",
            "what is the purpose",
            "how is",
            "what is",
        ]
    ):
        return "code_explanation"

    # Code optimization patterns
    if any(
        term in query_lower
        for term in [
            "optimize",
            "improve",
            "better way",
            "refactor",
            "performance",
            "efficient",
            "clean up",
            "enhance",
            "fix",
            "upgrade",
            "suggestion",
            "best practice",
            "how should i",
            "how can i",
        ]
    ):
        return "code_optimization"

    return "general"
