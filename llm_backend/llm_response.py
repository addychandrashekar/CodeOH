import google.generativeai as genai
import re
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


def generate_llm_response(context, user_message):
    """
    Generates a response for code search queries.
    Returns code snippets matching the user's query with explanations.
    """
    prompt = f"""
    You are an assistant inside a developer's code editor. Given the following project context, extract and return only the code snippets relevant to the user's query.

    ### Context:
    {context}

    ### User Query:
    {user_message}

    ### Instructions for Response:
    - Return only relevant Python code snippets, each in its own markdown code block.
    - Before each snippet, display the file name it came from in bold using this format: **File: filename.py**
    - Each snippet must be followed by a one-line explanation written outside the code block.
    - Leave one blank line between each code snippet section to improve readability.
    - Return all the code snippets as they appear in the context.
    - Do NOT embed explanations inside the code.
    - Use valid markdown syntax (```python ... ```) and close all blocks properly.
    - Avoid including the raw prompt, markdown artifacts, or extra commentary.
    - Do not hallucinate functions that aren't in the context.
    - Do not prefix code with triple backticks in plaintext unless inside a code block.
    """

    print(f"Code search prompt length: {len(prompt)}")

    model = genai.GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text

    return {"text": text}


def generate_code_explanation(context, user_message):
    """
    Generates a detailed explanation of code.
    This is used when the user wants to understand how code works.
    """
    prompt = f"""
    You are an expert code explainer inside a developer's code editor. Given the following code context and user query, provide a detailed explanation of the code.
    
    ### Code Context:
    {context}
    
    ### User Query:
    {user_message}
    
    ### Instructions for Response:
    - Explain what the code does in clear, simple terms
    - Break down the logic and control flow
    - Explain key functions, classes, and their purpose
    - Highlight important variables and their roles
    - Describe algorithms or patterns used
    - If appropriate, explain how different parts interact
    - Use markdown formatting for clarity
    - Include headings and bullet points for structure
    - Reference specific parts of the code when explaining
    - Do not hallucinate code that isn't in the context
    """

    print(f"Code explanation prompt length: {len(prompt)}")

    model = genai.GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text

    return {"text": text}


def generate_optimization_advice(context, user_message):
    """
    Generates suggestions for optimizing code.
    This is used when the user wants to improve their code.
    """
    prompt = f"""
    You are an expert code optimizer inside a developer's code editor. Given the following code context and user query, suggest specific ways to optimize or improve the code.
    
    ### Code Context:
    {context}
    
    ### User Query:
    {user_message}
    
    ### Instructions for Response:
    - Identify performance bottlenecks, code smells, or areas for improvement
    - Suggest specific optimizations with code examples
    - For each suggestion, explain:
      * What to change
      * How to implement the change (with code examples)
      * Why the suggestion improves the code
    - Consider time complexity, space complexity, and readability
    - Use markdown formatting with headings and code blocks
    - Organize suggestions by priority or section
    - Provide before/after examples when helpful
    - Be specific and actionable, not generic
    - Only suggest changes that are reasonable for the context
    - Do not rewrite the entire codebase
    """

    print(f"Code optimization prompt length: {len(prompt)}")

    model = genai.GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text

    return {"text": text}


def generate_code_implementation(repo_summary, user_message):
    """
    Generates code implementation based on the user's natural language description.
    This is used when the user wants to create new code.

    Args:
        repo_summary (str): The repository context to understand existing patterns
        user_message (str): The user's request describing what code to generate

    Returns:
        dict: The generated code and explanation
    """
    prompt = f"""
    You are an expert software developer inside a code editor. Generate implementation code based on the user's request.
    
    ### Repository Context:
    {repo_summary}
    
    ### User Request:
    {user_message}
    
    ### Instructions:
    - Write clean, efficient, and well-commented code that fulfills the user's request
    - Detect the appropriate programming language from the context and user's request
    - Structure the response as follows:
        1. A brief explanation of your approach
        2. The complete implementation in a markdown code block
        3. Usage examples in a separate code block
        4. Brief explanation of any key functions/classes
    - Follow these best practices:
        * Include clear docstrings and comments
        * Use appropriate error handling
        * Follow language-specific conventions and best practices
        * Add type hints where appropriate
        * Make code reusable and maintainable
    - Consider the existing repository context to make the code fit in
    - If you're unsure about specific details, make reasonable assumptions and explain them
    """

    print(f"Code generation prompt length: {len(prompt)}")

    model = genai.GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text

    return {"text": text}


def generate_general_response(repo_summary, user_message):
    """
    Generates a response for general programming or repository questions.
    Used when the user asks questions not directly related to specific code.
    """
    prompt = f"""
    You are an AI assistant helping a developer understand their codebase. Answer their question about the codebase or programming in general.
    
    ### Repository Summary:
    {repo_summary}
    
    ### User Query:
    {user_message}
    
    ### Instructions for Response:
    - Provide a helpful, informative, and direct response
    - If answering about the repository structure, reference the file information provided
    - If answering a general programming question, provide accurate technical information
    - When appropriate, suggest best practices or resources
    - Format your response with markdown for readability
    - Use headings, bullet points, or code blocks as needed
    - If you don't know something specific about their code, be honest about it
    - Keep your response focused and relevant to the question
    - If appropriate, suggest follow-up questions the user might ask
    - Be technically accurate and precise
    """

    print(f"General response prompt length: {len(prompt)}")

    model = genai.GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text

    return {"text": text}


def generate_file_modification(repo_summary, user_message):
    """
    Generates file modification or creation instructions based on the user's request.
    This function identifies which file to modify and what changes to make,
    then returns a response that requires user confirmation before proceeding.

    Args:
        repo_summary (str): The repository context to understand existing patterns
        user_message (str): The user's request describing what file to modify

    Returns:
        dict: Contains file metadata and proposed changes for user confirmation
    """
    # Extract filename from message (using @filename format)
    filename_match = re.search(r"@(\S+)", user_message)
    filename = filename_match.group(1) if filename_match else None

    # Look for explicitly requested filename patterns (like "create a file called X" or "new file X")
    if not filename:
        explicit_filename_patterns = [
            r'(?:create|make|write)\s+(?:a\s+)?(?:new\s+)?file\s+(?:called|named)\s+["\']?(\S+?)["\']?(?:\s|$|\.)',
            r'new\s+file\s+(?:called|named)\s+["\']?(\S+?)["\']?(?:\s|$|\.)',
            r'file\s+(?:called|named)\s+["\']?(\S+?)["\']?(?:\s|$|\.)',
        ]

        for pattern in explicit_filename_patterns:
            match = re.search(pattern, user_message, re.IGNORECASE)
            if match:
                filename = match.group(1)
                # Remove any trailing punctuation that might have been captured
                filename = re.sub(r"[.,;:]$", "", filename)
                break

    # If filename not found in @format or explicit mention, look for other patterns
    if not filename:
        file_patterns = [
            r'(?:modify|edit|update|change|create|make)\s+(?:file|the file)\s+["\']?([^"\']+)["\']?',
            r'(?:write|save)\s+to\s+(?:file|the file)\s+["\']?([^"\']+)["\']?',
        ]
        for pattern in file_patterns:
            match = re.search(pattern, user_message, re.IGNORECASE)
            if match:
                filename = match.group(1)
                break

    # If still no filename found, ask LLM to identify a reasonable filename
    if not filename:
        prompt = f"""
        Based on the following user request, determine an appropriate filename:
        
        User request: {user_message}
        
        Repository context: {repo_summary}
        
        Return ONLY the filename with extension, nothing else.
        """
        model = genai.GenerativeModel("gemini-1.5-flash-002")
        response = model.generate_content(prompt)
        filename = response.candidates[0].content.parts[0].text.strip()

    # Preserve original user message filename in case the prompt references it differently
    original_filename = filename

    # Determine if this is a new file or modification
    is_new_file = "create" in user_message.lower() or "new file" in user_message.lower()

    # Generate file content or modifications
    prompt = f"""
    You are an expert programmer assisting with file {("creation" if is_new_file else "modification")}.
    
    Repository context: {repo_summary}
    
    User request: {user_message}
    
    Target file: {filename}
    
    {"Create a new file with the following characteristics:" if is_new_file else "Provide the following:"}
    
    1. Complete file content as it should appear after modifications
    2. A concise explanation of what you're doing
    
    Format your response as follows:
    
    ---FILE_CONTENT---
    (Complete file content here)
    ---END_FILE_CONTENT---
    
    ---EXPLANATION---
    (Brief explanation of the changes)
    ---END_EXPLANATION---
    """

    model = genai.GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt)
    response_text = response.candidates[0].content.parts[0].text

    # Extract file content and explanation
    file_content = re.search(
        r"---FILE_CONTENT---(.*?)---END_FILE_CONTENT---", response_text, re.DOTALL
    )
    explanation = re.search(
        r"---EXPLANATION---(.*?)---END_EXPLANATION---", response_text, re.DOTALL
    )

    file_content = file_content.group(1).strip() if file_content else ""
    explanation = explanation.group(1).strip() if explanation else ""

    return {
        "text": f"""
**Proposed File Modification**

I'm going to {("create a new file" if is_new_file else "modify the file")} `{original_filename}`.

**Here's what I'll do:**
{explanation}

**Preview of changes:**
```
{file_content[:300]}{'...' if len(file_content) > 300 else ''}
```

⚠️ **This requires your confirmation before proceeding.** 
Do you want me to {("create" if is_new_file else "modify")} this file?
""",
        "file_data": {
            "filename": original_filename,
            "content": file_content,
            "is_new_file": is_new_file,
        },
    }
