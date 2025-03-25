import google.generativeai as genai
import re

def generate_llm_response(context, user_message):
    #don't return identical/near-identical code snippetts
    # prompt = f"""
    # You are an assistant inside a developer's code editor. Given the following project context, extract and return only the code snippets relevant to the user's query.

    # ### Context:
    # {context}

    # ### User Query:
    # {user_message}

    # ### Instructions for Response:
    # - Return only relevant Python code snippets, each in its own markdown code block.
    # - Each snippet must be followed by a one-line explanation written outside the code block.
    # - Avoid repeating identical or near-identical snippets.
    # - Do NOT embed explanations inside the code.
    # - Use valid markdown syntax (```python ... ```) and close all blocks properly.
    # - Avoid including the raw prompt, markdown artifacts, or extra commentary.
    # - Do not hallucinate functions that aren’t in the context.” if you’re worried about made-up content
    # - Do not prefix code with triple backticks in plaintext (e.g., do not write: \``python def func()…) unless inside a code block.
    # """

    #return identical/near-identical code snippets
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
    - Return all the code snippets as they appear in the context.
    - Do NOT embed explanations inside the code.
    - Use valid markdown syntax (```python ... ```) and close all blocks properly.
    - Avoid including the raw prompt, markdown artifacts, or extra commentary.
    - Do not hallucinate functions that aren’t in the context.” if you’re worried about made-up content
    - Do not prefix code with triple backticks in plaintext (e.g., do not write: \``python def func()…) unless inside a code block.
    """

    print(f"prompt: {prompt}")

    model = genai.GenerativeModel("gemini-1.5-flash-002")

    #send the prompt to gemini and get back the response
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text
    
    print("text: \n", text)

    return {"text": text}