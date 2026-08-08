# Offline Disaster Response Chatbot 🆘

A comprehensive offline chatbot system designed to provide emergency assistance during natural disasters when internet connectivity is unavailable.

**Features:** First aid guidance • Emergency contacts • Offline maps • Shelter locations • SOS messaging • Local LLM (Ollama/Gemma)

## Project Architecture

```
offline-disaster-chatbot/
├── backend/                 # Python Flask Server
│   ├── app/
│   │   ├── __init__.py     # Flask app factory
│   │   ├── chatbot.py      # Chatbot logic with Ollama integration
│   │   ├── database.py     # SQLite database management
│   │   └── routes.py       # API endpoints
│   ├── data/               # SQLite database and offline resources
│   ├── run.py              # Server entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Flutter Mobile App (to be initialized)
├── docs/                   # Documentation
└── .env.example           # Environment configuration template
```

## Core Features

### 1. Offline Chatbot
- Runs local LLM model (Gemma via Ollama)
- No internet required
- Category-based responses (medical, evacuation, shelter, etc.)
- Fallback responses when Ollama unavailable

### 2. Emergency Contacts
- Preloaded emergency services database
- Geolocation-aware contact suggestions
- Phone support for emergency communication

### 3. First Aid Guidance
- Categorized first aid procedures
- Step-by-step instructions
- Safety precautions included
- Quick reference guides

### 4. Shelter Locator
- Offline map integration
- Nearby shelter locations with coordinates
- Shelter capacity and amenities information
- Contact information for shelters

### 5. SOS Messaging
- Generate pre-formatted SOS messages
- Queue messages for transmission
- Categories: medical, shelter, evacuation, general
- Timestamp and status tracking

### 6. Chat History
- All conversations stored locally
- Historical reference during recovery
- No cloud dependency

## Requirements

### Backend
- Python 3.8+
- Flask 2.3.3
- Ollama (for local LLM)
- SQLite3 (included with Python)

### Frontend (Flutter)
- Flutter SDK 3.0+
- Dart 2.19+
- Mobile OS: Android 7+ or iOS 12+

### Hardware
- Minimum: Raspberry Pi 4 (2GB RAM)
- Recommended: Modern smartphone or 4GB+ RAM device

## Quick Start

### 1. Setup Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Ollama

Download and install Ollama from [ollama.ai](https://ollama.ai)

```bash
ollama pull gemma
ollama serve
```

### 3. Run Backend Server

```bash
cd backend
python run.py
```

Server will start on `http://localhost:5000`

### 4. Test API

Initialize database:
```bash
curl -X POST http://localhost:5000/api/init-db
```

Chat with bot:
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I have a cut on my hand", "category":"first_aid"}'
```

## API Endpoints

### Chat
- **POST** `/api/chat` - Send message to chatbot
  ```json
  {
    "message": "I need first aid help",
    "category": "first_aid"
  }
  ```

### Emergency Data
- **GET** `/api/emergency-contacts` - Get emergency contacts list
- **GET** `/api/first-aid/<category>` - Get first aid guides (use 'all' for all)
- **GET** `/api/shelters` - Get shelter locations

### SOS Messages
- **POST** `/api/sos/generate` - Create SOS message
  ```json
  {
    "location": "Main Street, Downtown",
    "category": "medical"
  }
  ```
- **POST** `/api/sos/send` - Queue SOS for transmission
- **GET** `/api/sos/messages` - Get SOS message history

### Other
- **GET** `/api/health` - Server health check
- **GET** `/api/chat-history?limit=50` - Get chat conversation history
- **POST** `/api/init-db` - Initialize database with sample data

## Database Schema

### Tables
- **emergency_contacts** - Emergency services and contacts
- **first_aid_guides** - First aid procedures and instructions
- **shelter_locations** - Safe shelter coordinates and info
- **offline_maps** - Tile-based offline map data
- **sos_messages** - Generated and sent SOS messages
- **chat_history** - Conversation logs

## Development Workflow

### Backend Development
```bash
cd backend
# Install dev dependencies
pip install -r requirements.txt

# Run with auto-reload
python run.py

# Test endpoints
curl http://localhost:5000/api/health
```

### Adding Emergency Contacts
Edit [backend/data/sample_data.py](backend/data/sample_data.py) or insert directly into SQLite

### Customizing Chatbot Responses
Modify [backend/app/chatbot.py](backend/app/chatbot.py) - Update `_fallback_response()` and `_build_system_prompt()`

### Frontend Development
```bash
cd frontend
flutter pub get
flutter run
```

## Deploying Frontend to Vercel
The backend is not directly deployable on Vercel because it depends on local SQLite and Ollama.

1. Deploy the frontend as a static site from the `frontend/` folder.
2. Update `frontend/vercel.json` with your backend URL:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR_BACKEND_URL/api/$1"
    }
  ]
}
```

3. Set `YOUR_BACKEND_URL` to the host where your Flask backend runs.

Example backend hosts:
- VPS or virtual server
- Render / Railway / Fly.io
- Local network machine

The static frontend will then send API requests through Vercel to your hosted backend.

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key settings:
- `OLLAMA_URL` - Local Ollama server address
- `OLLAMA_MODEL` - LLM model name (default: gemma)
- `SERVER_PORT` - Backend API port (default: 5000)

## Deployment

### Raspberry Pi
```bash
# Install Python
sudo apt-get install python3 python3-pip

# Clone project and setup
git clone <repo>
cd offline-disaster-chatbot/backend
pip3 install -r requirements.txt

# Install Ollama
curl https://ollama.ai/install.sh | sh
ollama pull gemma

# Run server
python3 run.py
```

### Mobile (Android/iOS)
- Flutter app connects to backend via HTTP
- All data stored locally on device
- Works completely offline after initial deployment

## Testing

### API Testing
```bash
# Test chatbot
python -m pytest tests/test_chatbot.py

# Test routes
python -m pytest tests/test_routes.py

# Test database
python -m pytest tests/test_database.py
```

## Troubleshooting

### Ollama Connection Error
- Ensure Ollama service is running: `ollama serve`
- Check if port 11434 is accessible
- Try: `curl http://localhost:11434`

### Database Locked
- Close other connections to the database
- Remove `.db-wal` and `.db-shm` files if corrupted
- Reinitialize database

### Slow Responses
- Reduce LLM context window in [chatbot.py](backend/app/chatbot.py)
- Use smaller model or quantized version

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and test
3. Submit pull request with description

## License

MIT License - See LICENSE file

## Support

For issues and questions:
- Check [docs/](docs/) for detailed guides
- Review API documentation in [docs/API.md](docs/API.md)
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment guide

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Real-time disaster alerts integration
- [ ] Offline image recognition for medical symptoms
- [ ] Community mesh networking for disaster zones
- [ ] Blockchain-based SOS verification
- [ ] AR-based navigation to shelters

---

**Disaster Response Technology** | Built with ❤️ for emergency preparedness
