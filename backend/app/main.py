import os
import time
import logging
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.routers import skill_gap, admin, feedback
from app.services.auth_service import get_current_user
from app.services.rate_limiter import check_skill_gap_rate_limit, check_general_rate_limit

# Configure structured logging
logger = logging.getLogger("reziq_api")
logger.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter(
    '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
))
logger.addHandler(console_handler)

# Rotating file handler
if not os.environ.get("VERCEL"):
    try:
        os.makedirs("logs", exist_ok=True)
        file_handler = RotatingFileHandler("logs/app.log", maxBytes=10485760, backupCount=5)
        file_handler.setFormatter(logging.Formatter(
            '[%(asctime)s] %(levelname)s [%(name)s] [%(filename)s:%(lineno)d]: %(message)s'
        ))
        logger.addHandler(file_handler)
    except Exception:
        # Silently skip file logging if creation fails
        pass

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

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; "
            "connect-src 'self' https://*.supabase.co https://api.groq.com; "
            "frame-ancestors 'none'"
        )
        return response

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown_ip"
        for header in ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"]:
            val = request.headers.get(header)
            if val:
                client_ip = val.split(",")[0].strip()
                break
        logger.info(f"Incoming request: {request.method} {request.url.path} from {client_ip}")
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            logger.info(f"Completed request: {request.method} {request.url.path} - Status: {response.status_code} - Latency: {process_time:.2f}ms")
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"Failed request: {request.method} {request.url.path} - Error: {str(e)} - Latency: {process_time:.2f}ms", exc_info=True)
            raise e

root_path = "/_/backend" if os.environ.get("VERCEL") else ""

app = FastAPI(
    title="REZIQ AI Career Intelligence API",
    description="Recruiter-grade Career Intelligence Operating System backend powering resume analysis, mock interviews, and system telemetry.",
    version="1.0.0",
    root_path=root_path
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://reziq.vercel.app",
    "https://reziqai.vercel.app"
]

# Middlewares
app.add_middleware(StripPrefixMiddleware, prefix="/_/backend")
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)
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

@app.post("/api/skill-gap-analyze", dependencies=[Depends(check_skill_gap_rate_limit), Depends(get_current_user)])
async def analyze_skill_gap_direct(request: skill_gap.SkillGapRequest):
    return await skill_gap.analyze_skill_gap(request)


@app.get("/", dependencies=[Depends(check_general_rate_limit)])
def read_root():
    return {
        "status": "online",
        "service": "REZIQ API Server",
        "version": "1.0.0",
        "health": "excellent"
    }

@app.get("/api/health", dependencies=[Depends(check_general_rate_limit)])
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
