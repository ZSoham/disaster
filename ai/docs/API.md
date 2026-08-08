# API Documentation

## Endpoints

### Chat API

#### POST /api/chat
Send a message to the disaster response chatbot.

**Request:**
```json
{
  "message": "I have a burn injury",
  "category": "first_aid"
}
```

**Response:**
```json
{
  "user_message": "I have a burn injury",
  "bot_response": "For burns: 1. Cool the burn with running water for 10-20 minutes. 2. Remove tight items. 3. Cover with sterile cloth. 4. Take pain relief if needed. Seek medical help for severe burns.",
  "category": "first_aid"
}
```

**Categories:** 
- `general` - General assistance
- `first_aid` - Medical emergencies
- `shelter` - Shelter and safety
- `evacuation` - Evacuation procedures
- `mental_health` - Psychological support

---

### Emergency Data APIs

#### GET /api/emergency-contacts
Get list of emergency contacts.

**Response:**
```json
{
  "contacts": [
    {
      "id": 1,
      "name": "Emergency Services",
      "type": "Police",
      "phone": "911",
      "description": "Police and emergency services"
    }
  ]
}
```

#### GET /api/first-aid/{category}
Get first aid guides for a specific category.

**Parameters:**
- `category` - Use 'all' for all guides, or specify category

**Response:**
```json
{
  "guides": [
    {
      "id": 1,
      "title": "CPR - Cardiopulmonary Resuscitation",
      "category": "Life-Saving",
      "description": "Perform CPR to maintain circulation",
      "steps": "1. Check consciousness\n2. Call emergency...",
      "precautions": "Only perform if trained",
      "materials": "CPR mask or mouth barrier"
    }
  ]
}
```

#### GET /api/shelters
Get nearby shelter locations.

**Response:**
```json
{
  "shelters": [
    {
      "id": 1,
      "name": "City Community Center",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "capacity": 500,
      "phone": "555-0100",
      "supplies": "Water, Food, Medical kit"
    }
  ]
}
```

---

### SOS API

#### POST /api/sos/generate
Generate an SOS message.

**Request:**
```json
{
  "location": "Main Street, Downtown",
  "category": "medical"
}
```

**Response:**
```json
{
  "id": 1,
  "message": "URGENT MEDICAL HELP NEEDED at Main Street, Downtown. Person requires immediate medical assistance.",
  "category": "medical",
  "status": "pending"
}
```

**Categories:**
- `medical` - Medical emergency
- `shelter` - Need shelter
- `evacuation` - Need evacuation
- `general` - General help

#### POST /api/sos/send
Send/queue an SOS message.

**Request:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "status": "queued",
  "message": "SOS message queued for transmission when connection available"
}
```

---

### System APIs

#### GET /api/health
Health check for server.

**Response:**
```json
{
  "status": "healthy",
  "message": "Offline Disaster Response Chatbot is running"
}
```

#### POST /api/init-db
Initialize database with schema and sample data.

**Response:**
```json
{
  "status": "success",
  "message": "Database initialized successfully"
}
```

#### GET /api/chat-history
Get chat conversation history.

**Query Parameters:**
- `limit` - Number of records (default: 50)

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "user_message": "I need help",
      "bot_response": "How can I assist you?",
      "timestamp": "2024-01-15 10:30:00",
      "category": "general"
    }
  ]
}
```

---

## Error Responses

All errors return appropriate HTTP status codes with messages:

```json
{
  "error": "Message required"
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request
- `500` - Server Error

---

## Integration Examples

### Python
```python
import requests

url = "http://localhost:5000/api/chat"
payload = {
    "message": "What should I do in an earthquake?",
    "category": "evacuation"
}
response = requests.post(url, json=payload)
print(response.json())
```

### JavaScript/TypeScript
```javascript
const response = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Need shelter information",
    category: "shelter"
  })
});
const data = await response.json();
```

### cURL
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"First aid for choking","category":"first_aid"}'
```

---

## Database Schema

### emergency_contacts
```sql
CREATE TABLE emergency_contacts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL
);
```

### first_aid_guides
```sql
CREATE TABLE first_aid_guides (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  steps TEXT,
  precautions TEXT,
  materials TEXT
);
```

### shelter_locations
```sql
CREATE TABLE shelter_locations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  capacity INTEGER,
  phone TEXT,
  supplies TEXT
);
```

### sos_messages
```sql
CREATE TABLE sos_messages (
  id INTEGER PRIMARY KEY,
  user_location TEXT,
  message TEXT,
  category TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending'
);
```

### chat_history
```sql
CREATE TABLE chat_history (
  id INTEGER PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  category TEXT
);
```
