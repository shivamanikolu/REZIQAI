import os
from dotenv import load_dotenv

# Load env variables from backend/.env or root .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", ""))

    # NVIDIA API details
    NVIDIA_PRIMARY_API_KEY: str = os.getenv("NVIDIA_PRIMARY_API_KEY", "")
    NVIDIA_SECONDARY_API_KEY: str = os.getenv("NVIDIA_SECONDARY_API_KEY", "")
    NVIDIA_API_URL: str = "https://integrate.api.nvidia.com/v1/chat/completions"
    NVIDIA_MODEL: str = os.getenv("NVIDIA_MODEL", "nvidia/llama-3.3-nemotron-super-49b-v1")


    # Groq Configuration
    GROQ_API_KEY_PRIMARY: str = os.getenv("GROQ_API_KEY_PRIMARY", "")
    GROQ_API_KEY_SECONDARY: str = os.getenv("GROQ_API_KEY_SECONDARY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    # GROQ_TPM_LIMIT = tokens-per-minute rate limit across ALL requests on Groq free tier.
    # This is a rate-limit metric, NOT a per-request max_tokens budget.
    # NEVER use this value as max_tokens in Groq API calls.
    GROQ_TPM_LIMIT: int = int(os.getenv("GROQ_TPM_LIMIT", "6000"))

    # Hard per-request output token ceiling for llama-3.3-70b-versatile on Groq.
    # This is the correct value to pass as max_tokens in every Groq API call.
    GROQ_MAX_OUTPUT_TOKENS: int = 8192

    # Resend configuration
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    FEEDBACK_RECEIVER_EMAIL: str = os.getenv("FEEDBACK_RECEIVER_EMAIL", "shivamaniforwork@gmail.com")

    # Server configs
    FASTAPI_SERVER_URL: str = os.getenv("FASTAPI_SERVER_URL", "http://localhost:8000")
    NEXT_PUBLIC_APP_URL: str = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

settings = Settings()
