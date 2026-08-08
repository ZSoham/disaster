# Development Configuration

DEBUG=True
FLASK_ENV=development

# API Configuration
API_HOST=0.0.0.0
API_PORT=5000
CORS_ENABLED=True
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000"]

# Ollama Configuration
OLLAMA_ENABLED=True
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=gemma
OLLAMA_TIMEOUT=30

# Database Configuration
DB_TYPE=sqlite
DB_PATH=./data/disaster_response.db
DB_BACKUP_ENABLED=True
DB_BACKUP_INTERVAL=3600

# Feature Flags
FEATURE_OFFLINE_MAPS=True
FEATURE_SOS_MESSAGING=True
FEATURE_EMERGENCY_CONTACTS=True
FEATURE_FIRST_AID=True
FEATURE_CHAT_HISTORY=True

# Logging
LOG_LEVEL=DEBUG
LOG_FORMAT=detailed
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10485760

# Security
API_KEY_REQUIRED=False
RATE_LIMITING_ENABLED=False

# Performance
CACHE_ENABLED=True
CACHE_TTL=300
CONNECTION_POOL_SIZE=10
MAX_CONNECTIONS=20
