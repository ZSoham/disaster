@echo off
REM Offline Disaster Response Chatbot - Quick Setup Script (Windows)

echo ======================================
echo Offline Disaster Response Chatbot
echo Quick Setup Script
echo ======================================
echo.

REM Check Python version
echo Checking Python installation...
python --version >nul 2>&1 || (
    echo Python 3 not found. Please install Python 3.8+
    exit /b 1
)

REM Navigate to backend
cd backend || exit /b

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Install Ollama: https://ollama.ai
echo 2. Open PowerShell or Command Prompt and run: ollama pull gemma
echo 3. Run Ollama in a separate terminal: ollama serve
echo 4. Start backend server: python run.py
echo 5. Test API: curl http://localhost:5000/api/health
echo.
echo Documentation: See README.md and docs\ folder
echo.
pause
