import google.generativeai as gemini
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini.configure(api_key=GEMINI_API_KEY)

def generate_embedding(text):
    """Generates a vector embedding using Gemini's text-embedding-004 model"""
    response = gemini.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return response['embedding']