#!/usr/bin/env python3
"""
Test suite for Offline Disaster Response Chatbot Backend
"""

import unittest
import json
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from app.database import init_db, insert_sample_data, get_db, DB_PATH

class TestChatbot(unittest.TestCase):
    """Test chatbot functionality"""
    
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        # Initialize test database
        with self.app.app_context():
            init_db()
            insert_sample_data()
    
    def test_health_check(self):
        """Test API health check"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
    
    def test_chat_endpoint(self):
        """Test chat endpoint"""
        response = self.client.post('/api/chat',
            json={'message': 'Hello', 'category': 'general'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('bot_response', data)
        self.assertIn('user_message', data)
    
    def test_chat_missing_message(self):
        """Test chat endpoint with missing message"""
        response = self.client.post('/api/chat',
            json={'category': 'general'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
    
    def test_emergency_contacts(self):
        """Test emergency contacts endpoint"""
        response = self.client.get('/api/emergency-contacts')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('contacts', data)
        self.assertIsInstance(data['contacts'], list)
    
    def test_first_aid_guides(self):
        """Test first aid guides endpoint"""
        response = self.client.get('/api/first-aid/all')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('guides', data)
        self.assertIsInstance(data['guides'], list)
    
    def test_shelters(self):
        """Test shelters endpoint"""
        response = self.client.get('/api/shelters')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('shelters', data)
        self.assertIsInstance(data['shelters'], list)

    def test_institutions(self):
        """Test institutions endpoint"""
        response = self.client.get('/api/institutions')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('institutions', data)
        self.assertIsInstance(data['institutions'], list)
        if data['institutions']:
            self.assertIn('name', data['institutions'][0])

    def test_classes(self):
        """Test classes endpoint"""
        response = self.client.get('/api/classes')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('classes', data)
        self.assertIsInstance(data['classes'], list)

    def test_teachers(self):
        """Test teachers endpoint"""
        response = self.client.get('/api/teachers')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('teachers', data)
        self.assertIsInstance(data['teachers'], list)

    def test_students(self):
        """Test students endpoint"""
        response = self.client.get('/api/students')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('students', data)
        self.assertIsInstance(data['students'], list)

    def test_login_student(self):
        """Test student login endpoint"""
        response = self.client.post('/api/login',
            json={'role': 'student', 'email': 'studenta@nddpa.edu.in', 'password': 'StudentA@123'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['role'], 'student')
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'studenta@nddpa.edu.in')

    def test_login_teacher(self):
        """Test teacher login endpoint"""
        response = self.client.post('/api/login',
            json={'role': 'teacher', 'email': 'ananya.singh@nddpa.edu.in', 'password': 'Ananya@123'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['role'], 'teacher')
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'ananya.singh@nddpa.edu.in')

    def test_login_invalid(self):
        """Test login failure"""
        response = self.client.post('/api/login',
            json={'role': 'teacher', 'email': 'invalid@unknown.edu', 'password': 'badpass'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_student_leaderboard(self):
        """Test student leaderboard endpoint"""
        response = self.client.get('/api/students/leaderboard')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('leaderboard', data)
        self.assertIsInstance(data['leaderboard'], list)

    def test_teacher_assignments(self):
        """Test teacher assignments endpoint"""
        response = self.client.get('/api/teacher-assignments')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('assignments', data)
        self.assertIsInstance(data['assignments'], list)

    def test_student_progress(self):
        """Test student progress endpoint"""
        response = self.client.get('/api/student-progress')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('progress', data)
        self.assertIsInstance(data['progress'], list)

    def test_sos_generate(self):
        """Test SOS message generation"""
        response = self.client.post('/api/sos/generate',
            json={'location': 'Downtown', 'category': 'medical'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertEqual(data['category'], 'medical')
        self.assertEqual(data['status'], 'pending')
    
    def test_chat_history(self):
        """Test chat history endpoint"""
        # First chat
        self.client.post('/api/chat',
            json={'message': 'Test message', 'category': 'general'},
            content_type='application/json'
        )
        
        # Get history
        response = self.client.get('/api/chat-history?limit=10')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('history', data)
    
    def tearDown(self):
        """Clean up after tests"""
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)

    def test_teacher_can_create_quiz(self):
        """Teacher can create a quiz for a disaster module"""
        response = self.client.post('/api/disasters/flood/quizzes',
            json={
                'title': 'Flood Quiz Builder Test',
                'description': 'A test quiz created by the teacher endpoint.',
                'teacher_id': 1,
                'questions': [
                    {
                        'question': 'What should you carry during a flood?',
                        'options': ['Water bottle', 'Pillow', 'Laptop', 'Paint'],
                        'answer': 'Water bottle'
                    }
                ]
            },
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertIn('quiz_id', data)

        response = self.client.get('/api/disasters/flood/quiz')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('quiz', data)
        self.assertEqual(data['quiz']['title'], 'Flood Quiz Builder Test')

class TestDatabase(unittest.TestCase):
    """Test database functionality"""
    
    def setUp(self):
        self.app = create_app()
        with self.app.app_context():
            init_db()
    
    def test_database_initialization(self):
        """Test database is created"""
        self.assertTrue(os.path.exists(DB_PATH))
    
    def test_database_schema(self):
        """Test database schema is correct"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check tables exist
            tables = [
                'emergency_contacts',
                'first_aid_guides', 
                'shelter_locations',
                'sos_messages',
                'chat_history',
                'offline_maps',
                'disasters',
                'scenarios',
                'scenario_stages',
                'scenario_decisions',
                'institutions',
                'classes',
                'teachers',
                'students',
                'assessments',
                'teacher_assignments',
                'student_progress'
            ]
            
            for table in tables:
                cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
                result = cursor.fetchone()
                self.assertIsNotNone(result, f"Table {table} not found")
    
    def tearDown(self):
        """Clean up"""
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)

if __name__ == '__main__':
    unittest.main()
