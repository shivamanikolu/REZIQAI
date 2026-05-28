import httpx
from app.config import settings

class SupabaseResponse:
    def __init__(self, data, status_code):
        self.data = data
        self.status_code = status_code

class TableClient:
    def __init__(self, table_name: str, url: str, key: str):
        self.table_name = table_name
        self.base_url = url
        self.url = f"{url}/rest/v1/{table_name}"
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self.params = {}
        self.method = "GET"
        self.json_data = None

    def insert(self, data: dict):
        self.method = "POST"
        self.json_data = data
        return self

    def update(self, data: dict):
        self.method = "PATCH"
        self.json_data = data
        return self

    def delete(self):
        self.method = "DELETE"
        return self

    def eq(self, column: str, value: str):
        self.params[column] = f"eq.{value}"
        return self

    def select(self, columns: str = "*"):
        self.method = "GET"
        self.params["select"] = columns
        return self

    def order(self, column: str, desc: bool = True):
        dir_str = "desc" if desc else "asc"
        self.params["order"] = f"{column}.{dir_str}"
        return self

    def limit(self, value: int):
        self.params["limit"] = str(value)
        return self

    def execute(self):
        try:
            with httpx.Client(timeout=10.0) as client:
                if self.method == "POST":
                    res = client.post(self.url, json=self.json_data, headers=self.headers, params=self.params)
                elif self.method == "PATCH":
                    res = client.patch(self.url, json=self.json_data, headers=self.headers, params=self.params)
                elif self.method == "DELETE":
                    res = client.delete(self.url, headers=self.headers, params=self.params)
                else:
                    res = client.get(self.url, headers=self.headers, params=self.params)
                
                if res.status_code in [200, 201]:
                    try:
                        return SupabaseResponse(res.json(), res.status_code)
                    except Exception:
                        return SupabaseResponse([], res.status_code)
                else:
                    print(f"Supabase Client HTTP {res.status_code}: {res.text}")
                    return SupabaseResponse([], res.status_code)
        except Exception as e:
            print(f"Supabase Client Exception: {e}")
            return SupabaseResponse([], 500)

class SupabaseHTTPClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key

    def table(self, name: str) -> TableClient:
        return TableClient(name, self.url, self.key)

# Initialize client using service role key for admin privileges
supabase_client = None

if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    supabase_client = SupabaseHTTPClient(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
else:
    print("Warning: Supabase credentials are not fully configured in environment variables.")

def get_db():
    return supabase_client
