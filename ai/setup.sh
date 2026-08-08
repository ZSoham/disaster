#!/bin/bash
# Offline Disaster Response Chatbot - Quick Setup Script

echo "======================================"
echo "Offline Disaster Response Chatbot"
echo "Quick Setup Script"
echo "======================================"
echo ""

# Check Python version
echo "Checking Python installation..."
python3 --version || { echo "Python 3 not found. Please install Python 3.8+"; exit 1; }

# Navigate to backend
cd backend || exit

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Ollama: https://ollama.ai"
echo "2. Pull Gemma model: ollama pull gemma"
echo "3. Run Ollama: ollama serve"
echo "4. Start backend server: python run.py"
echo "5. Test API: curl http://localhost:5000/api/health"
echo ""
echo "Documentation: See README.md and docs/ folder"
