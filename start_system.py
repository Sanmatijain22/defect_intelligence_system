"""
Smart Manufacturing AI – Visual Quality Inspection System Launcher
Runs the complete production full-stack platform (FastAPI + Embedded Production UI).
"""

import sys
import webbrowser
import uvicorn
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    print("=" * 70)
    print("  Smart Manufacturing AI – Visual Quality Inspection Platform")
    print("  Escorts Kubota / Automotive Industrial Quality Assurance Suite")
    print("=" * 70)
    print("  Backend API:  http://127.0.0.1:8000/api")
    print("  Web Portal:   http://127.0.0.1:8000/")
    print("  API Docs:     http://127.0.0.1:8000/docs")
    print("=" * 70)
    print("Starting server... Press Ctrl+C to terminate.")
    
    # Automatically launch browser after slight delay
    try:
        webbrowser.open("http://127.0.0.1:8000/")
    except Exception:
        pass

    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)

