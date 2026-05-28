import asyncio
import httpx
from app.config import settings

async def list_models():
    headers = {
        "Authorization": f"Bearer {settings.NVIDIA_PRIMARY_API_KEY}"
    }
    print("Testing primary NVIDIA API key by listing models...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://integrate.api.nvidia.com/v1/models",
                headers=headers
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(list_models())
