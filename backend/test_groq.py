import asyncio
import httpx
from app.config import settings

async def test_groq():
    groq_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.GROQ_API_KEY}"
    }
    groq_payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "user", "content": "Hello"}
        ],
        "temperature": 0.2,
        "max_tokens": 100
    }
    corrected_url = "https://api.groq.com/openai/v1/chat/completions"
    print(f"Testing Groq API key with model llama3-8b-8192...")
    print(f"Corrected Groq API URL: {corrected_url}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                corrected_url,
                json=groq_payload,
                headers=groq_headers
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_groq())
