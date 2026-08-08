#!/usr/bin/env python3
"""
Offline Disaster Response Chatbot - Backend Server
Runs on local device with no internet requirement
"""

from app import create_app
from app.database import init_db, insert_sample_data
import os

def main():
    # Initialize database
    print("Initializing database...")
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
    init_db()
    insert_sample_data()
    print("Database initialized successfully")
    
    # Create and run Flask app
    app = create_app()
    
    print("\n" + "="*60)
    print("Offline Disaster Response Chatbot - Backend Server")
    print("="*60)
    print("Server starting on http://localhost:5000")
    print("API endpoints available:")
    print("  - POST   /api/chat               - Chat with disaster response bot")
    print("  - GET    /api/emergency-contacts - Get emergency contact information")
    print("  - GET    /api/first-aid/<cat>    - Get first aid guides by category")
    print("  - GET    /api/shelters           - Get nearby shelter locations")
    print("  - POST   /api/sos/generate       - Generate SOS message")
    print("  - POST   /api/sos/send           - Send SOS message")
    print("  - GET    /api/chat-history       - Get chat conversation history")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main()
