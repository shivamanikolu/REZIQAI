import asyncio
from app.services.ai_service import generate_completion_stream

async def run_stream_test():
    prompt = (
        "Generate a complete 21-day skill gap roadmap for a Senior Backend Engineer. "
        "Make sure to output a very long report (at least 2000 words). "
        "Include the following exact section headers:\n"
        "- '## 10. 🚀 ELITE 21-DAY IMPROVEMENT ROADMAP' (with Day 21 fully detailed)\n"
        "- '## 12. 📦 FINAL EXECUTIVE SUMMARY SNAPSHOT'\n"
        "- '## 15. 🧠 BONUS RECRUITER INTELLIGENCE INSIGHTS'\n"
        "Do not summarize or skip any days."
    )
    system_instruction = "You are a professional career intelligence assistant."
    print("Testing generate_completion_stream with fallback queue...")
    
    count = 0
    async for chunk in generate_completion_stream(
        prompt=prompt,
        system_instruction=system_instruction,
        endpoint="/api/skill-gap/analyze",
        model="llama-3.3-70b-versatile"
    ):
        count += 1
        if "<!-- keep-alive -->" in chunk:
            print(".", end="", flush=True)
        else:
            print(f"\nReceived content chunk: {repr(chunk[:50])}...")
            break
            
    print("\nStream test completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_stream_test())
