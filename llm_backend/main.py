from fastapi import FastAPI
from routes import router

app = FastAPI(title="Semantic Search IDE with Gemini & Supabase")

#include all of the routers created so it routes correctly
app.include_router(router)