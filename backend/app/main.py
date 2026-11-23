"""
FastAPI Main Application entry point for Connect 4 AI.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.config_routes import router as config_router
from app.api.game_routes import router as game_router
from app.api.analysis_routes import router as analysis_router

app = FastAPI(
    title="Connect 4 AI Backend",
    description="Backend API for Connect 4 with Minimax, Alpha-Beta Pruning, Expectimax, and Search Tree Analysis",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(config_router)
app.include_router(game_router)
app.include_router(analysis_router)


@app.get("/")
def root():
    return {
        "message": "Connect 4 AI Backend API is online",
        "documentation": "/docs",
        "supported_algorithms": ["minimax", "alpha_beta", "expectimax"],
        "supported_modes": ["classic", "assignment"],
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
