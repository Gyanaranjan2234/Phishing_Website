import sys
import os

# Add current directory to path so we can import 'backend'
sys.path.append(os.getcwd())

try:
    from backend.main import app
    print("Routes registered in app:")
    for route in app.routes:
        if hasattr(route, 'path'):
            methods = getattr(route, 'methods', [])
            print(f"{list(methods)} {route.path}")
except Exception as e:
    print(f"Error: {e}")
