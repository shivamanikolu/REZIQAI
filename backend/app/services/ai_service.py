import time
import json
import httpx
from app.config import settings
from app.db import get_db

async def log_ai_usage(
    user_id: str,
    endpoint: str,
    primary_model: str,
    used_model: str,
    is_fallback: bool,
    latency_ms: int,
    tokens_used: int = None,
    error_message: str = None
):
    """Helper to log AI usage to the database asynchronously."""
    db = get_db()
    if not db:
        return
    try:
        data = {
            "user_id": user_id,
            "endpoint": endpoint,
            "primary_model": primary_model,
            "used_model": used_model,
            "is_fallback": is_fallback,
            "latency_ms": latency_ms,
            "tokens_used": tokens_used,
            "error_message": error_message
        }
        # Insert using Supabase REST API via python SDK
        db.table("ai_usage_logs").insert(data).execute()
    except Exception as e:
        print(f"Failed to log AI usage: {e}")

async def generate_completion(
    prompt: str,
    system_instruction: str = "You are a professional career intelligence assistant.",
    user_id: str = None,
    endpoint: str = "/api/skill-gap/analyze",
    temperature: float = 0.4,
    model: str = None,
    fallback_allowed: bool = True
) -> str:
    """
    Executes completion.
    For deepseek-r1-distill-llama-70b / skill-gap endpoint, uses a robust Groq failover queue:
    1. Primary Groq API Key
    2. Secondary Groq API Key
    Otherwise fallbacks to NVIDIA completion setup.
    """
    target_model = model or settings.GROQ_MODEL
    
    # Check if this is the deepseek-r1-distill-llama-70b / skill-gap request
    if target_model == "deepseek-r1-distill-llama-70b" or endpoint == "/api/skill-gap/analyze":
        start_time = time.time()
        # Estimate input tokens (1 token ~ 4 characters) to stay under Groq's 12,000 TPM limit
        estimated_input_tokens = (len(prompt) + len(system_instruction)) // 4
        dynamic_max_tokens = max(1024, min(4096, 11800 - estimated_input_tokens))
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4,
            "max_tokens": dynamic_max_tokens,
            "top_p": 0.9,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }

        # Attempt 1: Primary Groq API Key
        primary_key = settings.GROQ_API_KEY_PRIMARY or settings.GROQ_API_KEY
        if primary_key:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {primary_key}"
                }
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        settings.GROQ_API_URL,
                        json=payload,
                        headers=headers
                    )
                    if response.status_code == 200:
                        result = response.json()
                        content = result["choices"][0]["message"]["content"]
                        if content and content.strip():
                            # Perform response validation check
                            has_day_21 = "Day 21" in content
                            has_summary = "FINAL EXECUTIVE SUMMARY SNAPSHOT" in content
                            has_bonus = "BONUS RECRUITER INTELLIGENCE INSIGHTS" in content
                            
                            if has_day_21 and has_summary and has_bonus:
                                latency = int((time.time() - start_time) * 1000)
                                tokens = result.get("usage", {}).get("total_tokens", None)
                                await log_ai_usage(
                                    user_id=user_id,
                                    endpoint=endpoint,
                                    primary_model=target_model,
                                    used_model=target_model,
                                    is_fallback=False,
                                    latency_ms=latency,
                                    tokens_used=tokens
                                )
                                return content
                            else:
                                raise Exception("Response failed validation check (incomplete roadmap or sections).")
                        else:
                            raise Exception("Primary Groq key returned empty output.")
                    else:
                        raise Exception(f"Primary Groq key returned status {response.status_code}: {response.text}")
            except Exception as e:
                err_msg = str(e)
                print(f"Primary Groq API failed for DeepSeek: {err_msg}. Retrying with secondary key...")

        # Attempt 2: Secondary Groq API Key (Failover)
        secondary_key = settings.GROQ_API_KEY_SECONDARY
        if secondary_key:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {secondary_key}"
                }
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        settings.GROQ_API_URL,
                        json=payload,
                        headers=headers
                    )
                    if response.status_code == 200:
                        result = response.json()
                        content = result["choices"][0]["message"]["content"]
                        if content and content.strip():
                            latency = int((time.time() - start_time) * 1000)
                            tokens = result.get("usage", {}).get("total_tokens", None)
                            await log_ai_usage(
                                user_id=user_id,
                                  endpoint=endpoint,
                                  primary_model=target_model,
                                  used_model=f"{target_model} (Secondary API Key)",
                                  is_fallback=True,
                                  latency_ms=latency,
                                  tokens_used=tokens,
                                  error_message="Primary key failed or was incomplete. Transferred to secondary."
                            )
                            return content
                        else:
                            raise Exception("Secondary Groq key returned empty output.")
                    else:
                        raise Exception(f"Secondary Groq key returned status {response.status_code}: {response.text}")
            except Exception as e:
                err_msg = str(e)
                print(f"Secondary Groq API failed: {err_msg}")
                latency = int((time.time() - start_time) * 1000)
                await log_ai_usage(
                    user_id=user_id,
                    endpoint=endpoint,
                    primary_model=target_model,
                    used_model="None (Failure)",
                    is_fallback=True,
                    latency_ms=latency,
                    error_message=f"All Groq keys failed. Last error: {err_msg}"
                )
                raise e
        else:
            raise Exception("Secondary Groq API key is not configured.")

    # Native fallback to original NVIDIA + Groq code for other endpoints (mock interviews)
    start_time = time.time()
    headers = {
        "Content-Type": "application/json"
    }
    nvidia_model = model or settings.NVIDIA_MODEL
    nvidia_payload = {
        "model": nvidia_model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": 4096
    }

    if settings.NVIDIA_PRIMARY_API_KEY:
        try:
            headers["Authorization"] = f"Bearer {settings.NVIDIA_PRIMARY_API_KEY}"
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    settings.NVIDIA_API_URL,
                    json=nvidia_payload,
                    headers=headers
                )
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    latency = int((time.time() - start_time) * 1000)
                    tokens = result.get("usage", {}).get("total_tokens", None)
                    await log_ai_usage(
                        user_id=user_id,
                        endpoint=endpoint,
                        primary_model=nvidia_model,
                        used_model=nvidia_model,
                        is_fallback=False,
                        latency_ms=latency,
                        tokens_used=tokens
                    )
                    return content
        except Exception as e:
            print(f"NVIDIA Primary API key failed: {e}. Trying secondary NVIDIA...")

    if settings.NVIDIA_SECONDARY_API_KEY:
        try:
            headers["Authorization"] = f"Bearer {settings.NVIDIA_SECONDARY_API_KEY}"
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    settings.NVIDIA_API_URL,
                    json=nvidia_payload,
                    headers=headers
                )
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    latency = int((time.time() - start_time) * 1000)
                    tokens = result.get("usage", {}).get("total_tokens", None)
                    await log_ai_usage(
                        user_id=user_id,
                        endpoint=endpoint,
                        primary_model=nvidia_model,
                        used_model=f"{nvidia_model} (Secondary)",
                        is_fallback=True,
                        latency_ms=latency,
                        tokens_used=tokens
                    )
                    return content
        except Exception as e:
            print(f"NVIDIA Secondary API key failed: {e}. Trying Groq fallback...")

    # Fallback to general GROQ key
    groq_fallback_key = settings.GROQ_API_KEY or settings.GROQ_API_KEY_PRIMARY
    if fallback_allowed and groq_fallback_key:
        try:
            groq_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {groq_fallback_key}"
            }
            groq_payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": 4096
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    settings.GROQ_API_URL,
                    json=groq_payload,
                    headers=groq_headers
                )
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    latency = int((time.time() - start_time) * 1000)
                    tokens = result.get("usage", {}).get("total_tokens", None)
                    await log_ai_usage(
                        user_id=user_id,
                        endpoint=endpoint,
                        primary_model=nvidia_model,
                        used_model="llama-3.1-8b-instant",
                        is_fallback=True,
                        latency_ms=latency,
                        tokens_used=tokens
                    )
                    return content
        except Exception as e:
            print(f"Groq fallback completion failed: {e}")
            
    raise Exception("All completion attempts failed.")


async def generate_completion_stream(
    prompt: str,
    system_instruction: str = "You are a professional career intelligence assistant.",
    user_id: str = None,
    endpoint: str = "/api/skill-gap/analyze",
    temperature: float = 0.4,
    model: str = None,
    fallback_allowed: bool = True
):
    """
    Executes streaming completion.
    For deepseek-r1-distill-llama-70b / skill-gap endpoint, implements Groq primary -> secondary keys
    failover, yielding reset token [RESET_STREAM_FOR_RETRY] if validation fails.
    """
    target_model = model or settings.GROQ_MODEL
    
    # Check if this is the deepseek-r1-distill-llama-70b / skill-gap request
    if target_model == "deepseek-r1-distill-llama-70b" or endpoint == "/api/skill-gap/analyze":
        start_time = time.time()
        # Estimate input tokens (1 token ~ 4 characters) to stay under Groq's 12,000 TPM limit
        estimated_input_tokens = (len(prompt) + len(system_instruction)) // 4
        dynamic_max_tokens = max(1024, min(4096, 11800 - estimated_input_tokens))
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4,
            "max_tokens": dynamic_max_tokens,
            "top_p": 0.9,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "stream": True
        }

        primary_success = False
        content_buffer = []

        # Attempt 1: Primary Groq API Key
        primary_key = settings.GROQ_API_KEY_PRIMARY or settings.GROQ_API_KEY
        if primary_key:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {primary_key}"
                }
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream("POST", settings.GROQ_API_URL, json=payload, headers=headers) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                line = line.strip()
                                if not line:
                                    continue
                                if line.startswith("data:"):
                                    data_str = line[5:].strip()
                                    if data_str == "[DONE]":
                                        break
                                    try:
                                        data_json = json.loads(data_str)
                                        choices = data_json.get("choices", [])
                                        if choices:
                                            chunk = choices[0]["delta"].get("content", "")
                                            if chunk:
                                                content_buffer.append(chunk)
                                                yield chunk
                                    except Exception as json_err:
                                        print(f"Error parsing SSE chunk: {json_err}")
                            
                            # Validate output
                            full_content = "".join(content_buffer)
                            has_day_21 = "Day 21" in full_content
                            has_summary = "FINAL EXECUTIVE SUMMARY SNAPSHOT" in full_content
                            has_bonus = "BONUS RECRUITER INTELLIGENCE INSIGHTS" in full_content
                            
                            if full_content.strip() and has_day_21 and has_summary and has_bonus:
                                primary_success = True
                                latency = int((time.time() - start_time) * 1000)
                                await log_ai_usage(
                                    user_id=user_id,
                                    endpoint=endpoint,
                                    primary_model=target_model,
                                    used_model=target_model,
                                    is_fallback=False,
                                    latency_ms=latency,
                                    tokens_used=len(full_content) // 4
                                )
                                return
                            else:
                                print("Primary key stream output failed validation check.")
                        else:
                            print(f"Primary Groq key stream returned status code {response.status_code}.")
            except Exception as e:
                print(f"Primary Groq key stream failed: {e}")

        # If primary failed or validation failed, try secondary key
        if not primary_success:
            secondary_key = settings.GROQ_API_KEY_SECONDARY
            if secondary_key:
                print("Initiating automatic failover to secondary Groq key...")
                # Yield reset token to clear frontend buffer
                yield "[RESET_STREAM_FOR_RETRY]"
                
                secondary_content_buffer = []
                try:
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {secondary_key}"
                    }
                    async with httpx.AsyncClient(timeout=120.0) as client:
                        async with client.stream("POST", settings.GROQ_API_URL, json=payload, headers=headers) as response:
                            if response.status_code == 200:
                                async for line in response.aiter_lines():
                                    line = line.strip()
                                    if not line:
                                        continue
                                    if line.startswith("data:"):
                                        data_str = line[5:].strip()
                                        if data_str == "[DONE]":
                                            break
                                        try:
                                            data_json = json.loads(data_str)
                                            choices = data_json.get("choices", [])
                                            if choices:
                                                chunk = choices[0]["delta"].get("content", "")
                                                if chunk:
                                                    secondary_content_buffer.append(chunk)
                                                    yield chunk
                                        except Exception as json_err:
                                            print(f"Error parsing SSE chunk: {json_err}")
                                
                                # Log usage for secondary key
                                full_content_sec = "".join(secondary_content_buffer)
                                latency = int((time.time() - start_time) * 1000)
                                await log_ai_usage(
                                    user_id=user_id,
                                    endpoint=endpoint,
                                    primary_model=target_model,
                                    used_model=f"{target_model} (Secondary API Key)",
                                    is_fallback=True,
                                    latency_ms=latency,
                                    tokens_used=len(full_content_sec) // 4,
                                    error_message="Primary key failed or was incomplete. Transferred to secondary."
                                )
                                return
                            else:
                                raise Exception(f"Secondary Groq key stream returned status code {response.status_code}.")
                except Exception as e:
                    print(f"Secondary Groq key stream failed: {e}")
                    yield f"\n[ERROR: {str(e)}]"
                    latency = int((time.time() - start_time) * 1000)
                    await log_ai_usage(
                        user_id=user_id,
                        endpoint=endpoint,
                        primary_model=target_model,
                        used_model="None (Failure)",
                        is_fallback=True,
                        latency_ms=latency,
                        error_message=f"All Groq keys failed. Last error: {str(e)}"
                    )
            else:
                yield "\n[ERROR: Primary key stream failed, and secondary Groq key is not configured.]"
        return

    # Native NVIDIA stream fallback for other endpoints (mock interview)
    start_time = time.time()
    headers = {
        "Content-Type": "application/json"
    }
    nvidia_model = model or settings.NVIDIA_MODEL
    nvidia_payload = {
        "model": nvidia_model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": 4096,
        "stream": True
    }

    primary_stream_success = False
    content_buffer = []

    if settings.NVIDIA_PRIMARY_API_KEY:
        try:
            headers["Authorization"] = f"Bearer {settings.NVIDIA_PRIMARY_API_KEY}"
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", settings.NVIDIA_API_URL, json=nvidia_payload, headers=headers) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line:
                                continue
                            if line.startswith("data:"):
                                data_str = line[5:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data_json = json.loads(data_str)
                                    choices = data_json.get("choices", [])
                                    if choices:
                                        chunk = choices[0]["delta"].get("content", "")
                                        if chunk:
                                            content_buffer.append(chunk)
                                            yield chunk
                                except Exception as json_err:
                                    print(f"Error parsing SSE chunk: {json_err}")
                        
                        primary_stream_success = True
                        latency = int((time.time() - start_time) * 1000)
                        await log_ai_usage(
                            user_id=user_id,
                            endpoint=endpoint,
                            primary_model=nvidia_model,
                            used_model=nvidia_model,
                            is_fallback=False,
                            latency_ms=latency,
                            tokens_used=len("".join(content_buffer)) // 4
                        )
                        return
        except Exception as e:
            print(f"NVIDIA Primary stream failed: {e}. Trying secondary NVIDIA...")

    if not primary_stream_success and settings.NVIDIA_SECONDARY_API_KEY:
        try:
            headers["Authorization"] = f"Bearer {settings.NVIDIA_SECONDARY_API_KEY}"
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", settings.NVIDIA_API_URL, json=nvidia_payload, headers=headers) as response:
                    if response.status_code == 200:
                        secondary_buffer = []
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line:
                                continue
                            if line.startswith("data:"):
                                data_str = line[5:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data_json = json.loads(data_str)
                                    choices = data_json.get("choices", [])
                                    if choices:
                                        chunk = choices[0]["delta"].get("content", "")
                                        if chunk:
                                            secondary_buffer.append(chunk)
                                            yield chunk
                                except Exception as json_err:
                                    print(f"Error parsing SSE chunk: {json_err}")
                        
                        latency = int((time.time() - start_time) * 1000)
                        await log_ai_usage(
                            user_id=user_id,
                            endpoint=endpoint,
                            primary_model=nvidia_model,
                            used_model=f"{nvidia_model} (Secondary)",
                            is_fallback=True,
                            latency_ms=latency,
                            tokens_used=len("".join(secondary_buffer)) // 4
                        )
                        return
        except Exception as e:
            print(f"NVIDIA Secondary stream failed: {e}. Trying Groq fallback...")

    # Fallback to general Groq
    groq_fallback_key = settings.GROQ_API_KEY or settings.GROQ_API_KEY_PRIMARY
    if fallback_allowed and groq_fallback_key:
        try:
            groq_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {groq_fallback_key}"
            }
            groq_payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": 4096,
                "stream": True
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", settings.GROQ_API_URL, json=groq_payload, headers=groq_headers) as response:
                    if response.status_code == 200:
                        groq_buffer = []
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line:
                                continue
                            if line.startswith("data:"):
                                data_str = line[5:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data_json = json.loads(data_str)
                                    choices = data_json.get("choices", [])
                                    if choices:
                                        chunk = choices[0]["delta"].get("content", "")
                                        if chunk:
                                            groq_buffer.append(chunk)
                                            yield chunk
                                except Exception as json_err:
                                    print(f"Error parsing SSE chunk: {json_err}")
                        
                        latency = int((time.time() - start_time) * 1000)
                        await log_ai_usage(
                            user_id=user_id,
                            endpoint=endpoint,
                            primary_model=nvidia_model,
                            used_model="llama-3.1-8b-instant",
                            is_fallback=True,
                            latency_ms=latency,
                            tokens_used=len("".join(groq_buffer)) // 4
                        )
                        return
        except Exception as e:
            print(f"Groq stream fallback failed: {e}")
            yield f"\n[ERROR: {str(e)}]"

    raise Exception("All streaming attempts failed.")
