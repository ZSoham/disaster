# Getting Started with Development

## Prerequisites

- Python 3.8 or higher
- Ollama installed and running
- SQLite3 (included with Python)
- pip or conda for package management

## Quick Start

### 1. Install Python Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Setup Ollama

```bash
# Download and install Ollama from https://ollama.ai

# Pull the Gemma model
ollama pull gemma

# Start Ollama service (runs in background or separate terminal)
ollama serve
```

### 3. Initialize Database

```bash
# Run the server once to initialize database
cd backend
python run.py

# In another terminal, initialize the database:
curl -X POST http://localhost:5000/api/init-db
```

### 4. Test the API

```bash
# Test health check
curl http://localhost:5000/api/health

# Test chatbot
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a cut", "category": "first_aid"}'

# Get emergency contacts
curl http://localhost:5000/api/emergency-contacts

# Get shelters
curl http://localhost:5000/api/shelters
```

## Development Workflow

### Running in Development Mode

```bash
cd backend
python run.py
```

The server will start on `http://localhost:5000` with auto-reload enabled.

### Making Changes

1. Edit files in `backend/app/`
2. Changes are automatically reloaded (Flask debug mode)
3. Test endpoints using curl or Postman

### Running Tests

```bash
cd backend
python -m pytest tests/
```

## Key Directories

- `backend/app/` - Main application code
- `backend/data/` - SQLite database and data files
- `backend/tests/` - Unit tests
- `docs/` - Documentation
- `frontend/` - Flutter mobile app (placeholder)

## Troubleshooting

### Ollama Connection Error
```
Error: Connection refused for Ollama at http://localhost:11434
Solution: Make sure Ollama is running (ollama serve)
```

### Port 5000 Already in Use
```
Error: Address already in use
Solution: Kill existing process or change port in run.py
```

### Database Errors
```
Error: Database locked
Solution: Remove .db-wal and .db-shm files in data/ directory
```

## Next Steps

1. **Review Code Structure** - Understand the application layout
2. **Explore API Endpoints** - Test each endpoint to understand functionality
3. **Add Features** - Build on top of existing functionality
4. **Customize Data** - Add your emergency contacts and first aid guides
5. **Deploy** - Follow deployment guide for production

## Resources

- [API Documentation](../docs/API.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Ollama Documentation](https://github.com/jmorganca/ollama)
