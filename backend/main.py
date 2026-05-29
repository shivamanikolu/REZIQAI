import os
import sys

# Ensure the backend directory is in sys.path for Vercel serverless function environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

