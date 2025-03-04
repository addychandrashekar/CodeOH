import google.generativeai as genai

def generate_llm_response(context, user_message):
    prompt = f"""
    You are assisting a developer inside a code editor. Given the following project context, return all relevant code snippets related to the user's query in a concise, developer-friendly way.

    ### Context:
    {context}

    ### User Query:
    {user_message}

    ### Response:
    Return all relevant code snippets found in the context. Each snippet should be clearly separated, followed by a short one-line explanation.
    """

    # Initialize the Gemini model
    model = genai.GenerativeModel("gemini-1.5-flash-002")

    # Send the prompt to Gemini to generate the response
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text

    print(response)

    return {"text": text}