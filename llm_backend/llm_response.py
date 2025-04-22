import google.generativeai as genai
import re

def generate_llm_response(context, user_message):
    prompt = f"""
    an assistant inside a developer's code editor.
    {context}

    {user_message}
    """

    print(f"prompt: {prompt}")

    model = genai.GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt)
    content = response.candidates[0].content
    parts = content.parts
    text = parts[0].text
    
    print("text: \n", text)

    return {"text": text}