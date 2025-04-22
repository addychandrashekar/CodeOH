from fastapi import FastAPI
from routes import router

app = FastAPI(title="Semantic Search IDE with Gemini & Supabase")
app.include_router(router)