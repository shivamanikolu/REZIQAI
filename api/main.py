import os
import sys

# Add the backend and backend/app directories to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
app_path = os.path.abspath(os.path.join(backend_path, "app"))

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
if app_path not in sys.path:
    sys.path.insert(0, app_path)

from app.main import app
