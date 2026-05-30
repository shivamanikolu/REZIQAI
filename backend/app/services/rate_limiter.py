import time
import asyncio
from collections import defaultdict
from fastapi import Request, HTTPException, status

class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int, name: str, burst_limit: int = None, cooldown_seconds: float = None):
        """
        An in-memory sliding window rate limiter.
        
        Args:
            requests_limit: Max number of requests allowed in the window.
            window_seconds: The sliding window size in seconds.
            name: The name of the limiter for logs and errors.
            burst_limit: Optional max requests in a rapid succession.
            cooldown_seconds: Optional minimum delay (in seconds) between requests.
        """
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.name = name
        self.burst_limit = burst_limit
        self.cooldown_seconds = cooldown_seconds
        self.history = defaultdict(list)
        self.last_request = {}
        self.lock = asyncio.Lock()

    async def check_rate_limit(self, request: Request, custom_key: str = None):
        """
        Fails with HTTP 429 if the request exceeds rate limits.
        """
        # Resolve request key (IP-based or Custom-key like authenticated User ID)
        if custom_key:
            key = f"{self.name}:{custom_key}"
        else:
            ip = request.client.host if request.client else "unknown_ip"
            # Read proxy/CDN forwarded headers
            for header in ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"]:
                val = request.headers.get(header)
                if val:
                    # x-forwarded-for can be a list of IPs, take the client IP (first one)
                    ip = val.split(",")[0].strip()
                    break
            key = f"{self.name}:ip:{ip}"

        async with self.lock:
            now = time.time()

            # Clean expired timestamps outside the sliding window
            self.history[key] = [t for t in self.history[key] if now - t < self.window_seconds]

            # 1. Cooldown protection (minimum delay between requests)
            if self.cooldown_seconds and key in self.last_request:
                elapsed = now - self.last_request[key]
                if elapsed < self.cooldown_seconds:
                    retry_after = int(self.cooldown_seconds - elapsed) + 1
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "error": "RateLimitCooldown",
                            "message": f"Cooldown active. Please wait {retry_after} second(s) before request.",
                            "limiter": self.name
                        },
                        headers={"Retry-After": str(retry_after)}
                    )

            # 2. Burst protection (max requests within a sub-interval)
            if self.burst_limit and len(self.history[key]) >= self.burst_limit:
                # If they exceed burst_limit, check if the interval between last and oldest in burst is too small
                oldest_in_burst = self.history[key][-self.burst_limit]
                time_span = now - oldest_in_burst
                min_span = (self.window_seconds / self.requests_limit) * self.burst_limit * 0.5
                if time_span < min_span:
                    retry_after = int(min_span - time_span) + 1
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "error": "RateLimitBurst",
                            "message": "Too many rapid requests. Please slow down and try again.",
                            "limiter": self.name
                        },
                        headers={"Retry-After": str(retry_after)}
                    )

            # 3. Overall rate limit check
            if len(self.history[key]) >= self.requests_limit:
                oldest = self.history[key][0]
                retry_after = int(self.window_seconds - (now - oldest)) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "RateLimitExceeded",
                        "message": f"Rate limit of {self.requests_limit} requests per {self.window_seconds}s exceeded. Try again in {retry_after}s.",
                        "limiter": self.name
                    },
                    headers={"Retry-After": str(retry_after)}
                )

            # Record timestamp
            self.history[key].append(now)
            self.last_request[key] = now

# Define enterprise rate limiters
# 1. Career intelligence AI analysis limiter (5 request per hour, 30s cooldown between analyses)
skill_gap_limiter = RateLimiter(
    requests_limit=5,
    window_seconds=3600,
    name="skill_gap_analysis",
    burst_limit=2,
    cooldown_seconds=30.0
)

# 2. Feedback submit limiter (5 requests per minute, 5s cooldown)
feedback_limiter = RateLimiter(
    requests_limit=5,
    window_seconds=60,
    name="feedback_submit",
    burst_limit=3,
    cooldown_seconds=5.0
)

# 3. Admin moderation limiter (60 requests per minute)
admin_limiter = RateLimiter(
    requests_limit=60,
    window_seconds=60,
    name="admin_telemetry"
)

# 4. General API health checks limiter (120 requests per minute)
general_limiter = RateLimiter(
    requests_limit=120,
    window_seconds=60,
    name="general_api"
)

# FastAPI Dependencies
async def check_skill_gap_rate_limit(request: Request):
    """Checks rate limit for skill gap analysis. Uses User ID as part of key if authenticated."""
    user_id = None
    # Extract user ID if already in body or header context
    try:
        body = await request.json()
        user_id = body.get("user_id")
    except Exception:
        pass
    await skill_gap_limiter.check_rate_limit(request, custom_key=user_id)

async def check_feedback_rate_limit(request: Request):
    """Checks rate limit for feedback submission."""
    await feedback_limiter.check_rate_limit(request)

async def check_admin_rate_limit(request: Request):
    """Checks rate limit for administrative actions."""
    await admin_limiter.check_rate_limit(request)

async def check_general_rate_limit(request: Request):
    """Checks general API route rate limits."""
    await general_limiter.check_rate_limit(request)
