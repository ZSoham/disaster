# Architecture and Design

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Mobile Device / Raspberry Pi            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         Flutter Mobile Application          │   │
│  │  - First Aid UI                             │   │
│  │  - Chat Interface                           │   │
│  │  - Map Display                              │   │
│  │  - SOS Button                               │   │
│  └─────────────────────────────────────────────┘   │
│              ↓ (HTTP/REST API)                      │
│  ┌─────────────────────────────────────────────┐   │
│  │      Flask Backend Server (Port 5000)       │   │
│  │  - API Routes                               │   │
│  │  - Chatbot Logic                            │   │
│  │  - Database Management                      │   │
│  └─────────────────────────────────────────────┘   │
│              ↓ (via Python requests)               │
│  ┌─────────────────────────────────────────────┐   │
│  │      Ollama Local LLM (Port 11434)          │   │
│  │  - Gemma Model                              │   │
│  │  - Text Generation                          │   │
│  │  - Context Processing                       │   │
│  └─────────────────────────────────────────────┘   │
│              ↓                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │    SQLite Database (Offline Storage)        │   │
│  │  - Emergency Contacts                       │   │
│  │  - First Aid Guides                         │   │
│  │  - Shelter Locations                        │   │
│  │  - Chat History                             │   │
│  │  - SOS Messages                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓↓↓ (Only when internet available) ↓↓↓
    ┌──────────────────────┐
    │  Cloud Services      │
    │  - Data Sync         │
    │  - SOS Transmission  │
    │  - Updates           │
    └──────────────────────┘
```

## Component Details

### 1. Frontend (Flutter)
**Language:** Dart (Flutter Framework)
**Responsibilities:**
- User interface for all features
- Local data caching
- Offline-first architecture
- Geolocation services
- Background services

**Key Screens:**
- Chat Interface
- First Aid Categories
- Emergency Contacts
- Offline Maps
- SOS Generator
- Chat History

### 2. Backend (Flask)
**Language:** Python
**Responsibilities:**
- REST API endpoints
- Chatbot orchestration
- Database management
- Request routing
- Error handling

**Key Modules:**
- `app/__init__.py` - Flask app factory
- `app/chatbot.py` - LLM integration
- `app/database.py` - SQLite management
- `app/routes.py` - API endpoints

### 3. Local LLM (Ollama)
**Model:** Gemma
**Responsibilities:**
- Text generation
- Context understanding
- Response generation
- Model inference

**Why Ollama:**
- Runs completely offline
- Configurable models
- Low resource requirements
- Privacy-focused (no data leaves device)

### 4. Database (SQLite)
**Type:** Embedded SQL database
**Location:** Device storage
**Responsibilities:**
- Persistent data storage
- Query optimization
- Data integrity
- No network dependency

## Data Flow

### Chat Interaction
```
1. User types message in Flutter app
   ↓
2. App sends POST request to /api/chat
   ↓
3. Flask receives and routes to chatbot module
   ↓
4. Chatbot tries to connect to Ollama
   ├─ If available: Send to LLM, get response
   └─ If unavailable: Use fallback responses
   ↓
5. Response saved to chat_history table
   ↓
6. Response returned to Flutter app
   ↓
7. App displays message in chat interface
```

### Emergency Contact Lookup
```
1. User requests emergency contacts
   ↓
2. Flutter app calls GET /api/emergency-contacts
   ↓
3. Flask queries emergency_contacts table
   ↓
4. Results returned as JSON
   ↓
5. App displays contacts on map or list
```

### SOS Message Generation
```
1. User selects emergency and location
   ↓
2. App calls POST /api/sos/generate
   ↓
3. Backend formats message with category
   ↓
4. Message stored in sos_messages table
   ↓
5. Message queued for transmission
   ↓
6. When connection available: Send to authorities
```

## Code Organization

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── chatbot.py           # Chatbot class with Ollama integration
│   ├── database.py          # Database functions and schema
│   └── routes.py            # API endpoint definitions
├── data/
│   ├── disaster_response.db # SQLite database file
│   └── sample_data.py       # Initial data loading
├── run.py                   # Server entry point
└── requirements.txt         # Python dependencies
```

### Key Classes

#### OfflineChatbot (chatbot.py)
```python
class OfflineChatbot:
    def __init__(model_name, ollama_url)
    def chat(user_message, category)
    def _build_system_prompt()
    def _fallback_response(user_message, category)
    def _save_chat_history(user_msg, bot_msg, category)
```

#### Database Functions (database.py)
```python
init_db()                    # Create schema
get_db()                     # Context manager for connections
insert_sample_data()         # Load initial data
```

## API Response Format

All responses use following format:

**Success:**
```json
{
  "status": "success",
  "data": {...}
}
```

**Error:**
```json
{
  "status": "error",
  "error": "Error message"
}
```

## State Management

### Device State
- User preferences stored locally
- Last known location cached
- Conversation context in memory
- Database transactions atomic

### SOS Message State
- `pending` - Generated, waiting to send
- `sent` - Sent to emergency services
- `delivered` - Confirmed delivery
- `failed` - Failed to send

## Security Considerations

### Device Security
- All data stored locally with encryption
- No personal data sent to cloud without consent
- API only accepts localhost connections (configurable)
- CORS restricted to known domains

### Data Privacy
- No analytics tracking
- No user profiling
- No cloud backup without permission
- Device-local processing only

### Communication Security
- HTTPS for data transmission
- API key validation (when deployed)
- Rate limiting on endpoints
- SQL injection prevention via parameterized queries

## Performance Optimization

### Database
- Indexed frequently queried columns
- Prepared statements for queries
- Connection pooling
- Lazy loading of large datasets

### LLM
- Response caching for common queries
- Context window optimization
- Model quantization for efficiency
- Async processing for long generations

### Frontend
- Lazy loading of resources
- Image compression
- Offline data prefetching
- Background data sync

## Scalability

### Horizontal Scaling (Multiple Instances)
- Load balancer distributes requests
- Shared database for state
- Session persistence
- Health checks for failover

### Vertical Scaling (Single Instance)
- Database indexing
- Query optimization
- Caching layer
- Resource pooling

## Disaster Recovery

### Backup Strategy
- Daily database snapshots
- Chat history archive
- Configuration backup
- Emergency data redundancy

### Recovery Procedure
1. Restore latest database backup
2. Verify data integrity
3. Test system functionality
4. Resume normal operation

## Monitoring Points

- **Server Health:** API response time, uptime
- **Database:** Query performance, table sizes
- **LLM:** Response quality, generation time
- **Resources:** Memory usage, disk space, CPU load
- **Users:** Chat success rate, error frequency
