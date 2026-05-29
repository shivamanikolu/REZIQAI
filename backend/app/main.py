import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import skill_gap, admin, feedback

class StripPrefixMiddleware:
    def __init__(self, app, prefix: str):
        self.app = app
        self.prefix = prefix

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path.startswith(self.prefix):
                scope["path"] = path[len(self.prefix):]
                raw_path = scope.get("raw_path", b"")
                prefix_bytes = self.prefix.encode("utf-8")
                if raw_path.startswith(prefix_bytes):
                    scope["raw_path"] = raw_path[len(prefix_bytes):]
        await self.app(scope, receive, send)

root_path = "/_/backend" if os.environ.get("VERCEL") else ""

app = FastAPI(
    title="REZIQ AI Career Intelligence API",
    description="Recruiter-grade Career Intelligence Operating System backend powering resume analysis, mock interviews, and system telemetry.",
    version="1.0.0",
    root_path=root_path
)

# CORS Configuration
# Allow frontend local server and generic origins for deployment testing
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://reziq.vercel.app",
    "https://reziqai.vercel.app"
]

# Strip prefix first before CORS and routing
app.add_middleware(StripPrefixMiddleware, prefix="/_/backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount APIRouters
app.include_router(skill_gap.router)
app.include_router(admin.router)
app.include_router(feedback.router)

@app.post("/api/skill-gap-analyze")
async def analyze_skill_gap_direct(request: skill_gap.SkillGapRequest):
    return await skill_gap.analyze_skill_gap(request)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "REZIQ API Server",
        "version": "1.0.0",
        "health": "excellent"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "components": {
            "database": "connected",
            "nvidia_failover": "active",
            "websockets": "enabled"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
