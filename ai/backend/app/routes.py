from flask import Blueprint, request, jsonify
from .chatbot import OfflineChatbot
from .database import get_db, init_db, insert_sample_data
import json

api_bp = Blueprint('api', __name__)
chatbot = OfflineChatbot()

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Offline Disaster Response Chatbot is running'}), 200

@api_bp.route('/init-db', methods=['POST'])
def initialize_database():
    """Initialize database with schema and sample data"""
    try:
        init_db()
        insert_sample_data()
        return jsonify({'status': 'success', 'message': 'Database initialized successfully'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@api_bp.route('/login', methods=['POST'])
def login_endpoint():
    """Basic login endpoint for students, teachers, and institutions"""
    data = request.get_json()
    if not data or 'role' not in data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Role, email, and password are required'}), 400

    role = data['role'].lower()
    email = data['email']
    password = data['password']

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            if role == 'student':
                cursor.execute('''
                    SELECT s.id, s.name, s.email, s.phone, s.readiness_score, s.weak_area, s.experience,
                           c.name AS class_name, i.name AS institution_name
                    FROM students s
                    JOIN classes c ON s.class_id = c.id
                    JOIN institutions i ON s.institution_id = i.id
                    WHERE s.email = ? AND s.password = ?
                ''', (email, password))
                user = cursor.fetchone()
                if not user:
                    return jsonify({'error': 'Invalid student credentials'}), 401
                user = dict(user)
            elif role == 'teacher':
                cursor.execute('''
                    SELECT id, institution_id, name, email, phone, role
                    FROM teachers
                    WHERE email = ? AND password = ?
                ''', (email, password))
                user = cursor.fetchone()
                if not user:
                    return jsonify({'error': 'Invalid teacher credentials'}), 401
                user = dict(user)
            elif role == 'institution':
                cursor.execute('''
                    SELECT id, name, email, type, district, state, readiness_score, participation_rate
                    FROM institutions
                    WHERE email = ? AND password = ?
                ''', (email, password))
                user = cursor.fetchone()
                if not user:
                    return jsonify({'error': 'Invalid institution credentials'}), 401
                user = dict(user)
            else:
                return jsonify({'error': 'Invalid role'}), 400

        return jsonify({'role': role, 'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/chat', methods=['POST'])
def chat_endpoint():
    """Main chatbot endpoint"""
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'error': 'Message required'}), 400
    
    user_message = data['message']
    category = data.get('category', 'general')
    
    response = chatbot.chat(user_message, category)
    
    return jsonify({
        'user_message': user_message,
        'bot_response': response,
        'category': category
    }), 200

@api_bp.route('/emergency-contacts', methods=['GET'])
def get_emergency_contacts():
    """Get list of emergency contacts"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, name, type, phone, description FROM emergency_contacts')
            contacts = [dict(row) for row in cursor.fetchall()]
        return jsonify({'contacts': contacts}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/first-aid/<category>', methods=['GET'])
def get_first_aid_guides(category):
    """Get first aid guides by category"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            if category.lower() == 'all':
                cursor.execute('SELECT id, title, category, description, steps FROM first_aid_guides')
            else:
                cursor.execute(
                    'SELECT id, title, category, description, steps FROM first_aid_guides WHERE category = ?',
                    (category,)
                )
            guides = [dict(row) for row in cursor.fetchall()]
        return jsonify({'guides': guides}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/shelters', methods=['GET'])
def get_shelters():
    """Get nearby shelter locations"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, name, address, latitude, longitude, capacity, phone, supplies 
                FROM shelter_locations
            ''')
            shelters = [dict(row) for row in cursor.fetchall()]
        return jsonify({'shelters': shelters}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/sos/generate', methods=['POST'])
def generate_sos():
    """Generate SOS message"""
    data = request.get_json()
    user_location = data.get('location', 'Unknown location')
    category = data.get('category', 'general')
    
    messages = {
        'medical': f'URGENT MEDICAL HELP NEEDED at {user_location}. Person requires immediate medical assistance.',
        'shelter': f'NEED SHELTER at {user_location}. Looking for safe refuge and supplies.',
        'general': f'HELP NEEDED at {user_location}. Requesting emergency assistance.',
        'evacuation': f'EVACUATION REQUIRED from {user_location}. Immediate evacuation needed.'
    }
    
    sos_message = messages.get(category, messages['general'])
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO sos_messages (user_location, message, category, status)
                VALUES (?, ?, ?, ?)
            ''', (user_location, sos_message, category, 'pending'))
            conn.commit()
            sos_id = cursor.lastrowid
        
        return jsonify({
            'id': sos_id,
            'message': sos_message,
            'category': category,
            'status': 'pending'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/sos/send', methods=['POST'])
def send_sos():
    """Send SOS message to offline queue or emergency contacts (when connection available)"""
    data = request.get_json()
    sos_id = data.get('id')
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE sos_messages SET status = ? WHERE id = ?',
                ('sent', sos_id)
            )
            conn.commit()
        
        return jsonify({
            'status': 'queued',
            'message': 'SOS message queued for transmission when connection available'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/chat-history', methods=['GET'])
def get_chat_history():
    """Get chat conversation history"""
    limit = request.args.get('limit', default=50, type=int)
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, user_message, bot_response, timestamp, category 
                FROM chat_history 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            history = [dict(row) for row in cursor.fetchall()]
        return jsonify({'history': history}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/disasters', methods=['GET'])
def list_disasters():
    """List available disaster learning modules"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT slug, title, category, summary, hazard_types, before_summary, during_summary, after_summary, sources
                FROM disasters
                ORDER BY title
            ''')
            disasters = [dict(row) for row in cursor.fetchall()]
        return jsonify({'disasters': disasters}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/disasters/<string:slug>', methods=['GET'])
def get_disaster(slug):
    """Get a disaster module by slug"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, slug, title, category, summary, hazard_types, before_summary, during_summary, after_summary, sources
                FROM disasters
                WHERE slug = ?
            ''', (slug,))
            disaster = cursor.fetchone()
            if not disaster:
                return jsonify({'error': 'Disaster not found'}), 404
            disaster_dict = dict(disaster)
            cursor.execute('''
                SELECT slug, title, description, difficulty, duration, role, location
                FROM scenarios
                WHERE disaster_id = ?
                ORDER BY title
            ''', (disaster_dict['id'],))
            disaster_dict['scenarios'] = [dict(row) for row in cursor.fetchall()]
        return jsonify({'disaster': disaster_dict}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/disasters/<string:slug>/quiz', methods=['GET'])
def get_disaster_quiz(slug):
    """Return a knowledge quiz for a disaster module."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM disasters WHERE slug = ?', (slug,))
            disaster = cursor.fetchone()
            if not disaster:
                return jsonify({'error': 'Disaster not found'}), 404
            disaster_id = disaster['id']

            cursor.execute('''
                SELECT q.id AS quiz_id, q.title, q.description
                FROM quizzes q
                WHERE q.disaster_id = ?
                ORDER BY q.created_at DESC
                LIMIT 1
            ''', (disaster_id,))
            quiz_row = cursor.fetchone()
            if quiz_row:
                quiz = dict(quiz_row)
                cursor.execute('''
                    SELECT question_text, options, answer
                    FROM quiz_questions
                    WHERE quiz_id = ?
                    ORDER BY question_order
                ''', (quiz['quiz_id'],))
                questions = [
                    {
                        'question': row['question_text'],
                        'options': row['options'].split('||'),
                        'answer': row['answer']
                    } for row in cursor.fetchall()
                ]
                return jsonify({'quiz': {'title': quiz['title'], 'description': quiz['description'], 'questions': questions}}), 200

        quiz_bank = {
            'earthquake': {
                'title': 'Earthquake Preparedness Quiz',
                'description': 'Test your knowledge of earthquake safety and response.',
                'questions': [
                    {
                        'question': 'What is the safest action during an earthquake?',
                        'options': ['Run outside immediately', 'Drop, cover, and hold on', 'Stand in a doorway', 'Hide under a table'],
                        'answer': 'Drop, cover, and hold on'
                    },
                    {
                        'question': 'Where should you avoid during shaking?',
                        'options': ['Near windows', 'Under sturdy tables', 'Against interior walls', 'In low furniture areas'],
                        'answer': 'Near windows'
                    },
                    {
                        'question': 'After the shaking stops, what is the first thing to do?',
                        'options': ['Call friends', 'Check for injuries', 'Turn off the lights', 'Go back to bed'],
                        'answer': 'Check for injuries'
                    }
                ]
            },
            'flood': {
                'title': 'Flood Safety Quiz',
                'description': 'Assess your readiness for flood hazards and safe evacuation.',
                'questions': [
                    {
                        'question': 'Which item should be part of a flood emergency kit?',
                        'options': ['Heavy furniture', 'Bottled water', 'Extra candles', 'Garden tools'],
                        'answer': 'Bottled water'
                    },
                    {
                        'question': 'If water levels rise quickly, what should you do?',
                        'options': ['Stay in the basement', 'Move to higher ground', 'Open windows', 'Walk through moving water'],
                        'answer': 'Move to higher ground'
                    },
                    {
                        'question': 'Why is it unsafe to drive through floodwater?',
                        'options': ['It is noisy', 'Water may be deeper than it looks', 'It improves traction', 'The car will cool faster'],
                        'answer': 'Water may be deeper than it looks'
                    }
                ]
            },
            'cyclone': {
                'title': 'Cyclone Preparedness Quiz',
                'description': 'Verify your cyclone readiness and shelter best practices.',
                'questions': [
                    {
                        'question': 'What is the best place to shelter during a cyclone?',
                        'options': ['Open field', 'Near broken windows', 'Interior room without windows', 'Under a tree'],
                        'answer': 'Interior room without windows'
                    },
                    {
                        'question': 'Which item is essential during a cyclone?',
                        'options': ['Sandbags', 'Loose furniture', 'Tall ladders', 'Stored propane canisters'],
                        'answer': 'Sandbags'
                    },
                    {
                        'question': 'What should you do if a cyclone warning is issued?',
                        'options': ['Stay outdoors', 'Head to safe shelter', 'Ignore it', 'Open all doors'],
                        'answer': 'Head to safe shelter'
                    }
                ]
            }
        }

        quiz = quiz_bank.get(slug)
        if not quiz:
            return jsonify({'error': 'Quiz not available for this disaster module'}), 404
        return jsonify({'quiz': quiz}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/disasters/<string:slug>/quizzes', methods=['POST'])
def create_disaster_quiz(slug):
    """Create a new disaster quiz from teacher input."""
    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description', '')
    questions = data.get('questions', [])
    teacher_id = data.get('teacher_id')

    if not title or not questions or not isinstance(questions, list):
        return jsonify({'error': 'Quiz title and questions are required'}), 400

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM disasters WHERE slug = ?', (slug,))
            disaster = cursor.fetchone()
            if not disaster:
                return jsonify({'error': 'Disaster module not found'}), 404
            disaster_id = disaster['id']

            cursor.execute('''
                INSERT INTO quizzes (disaster_id, teacher_id, title, description)
                VALUES (?, ?, ?, ?)
            ''', (disaster_id, teacher_id, title, description))
            quiz_id = cursor.lastrowid

            for index, question in enumerate(questions):
                question_text = question.get('question')
                options = question.get('options')
                answer = question.get('answer')
                if not question_text or not options or not answer:
                    continue
                cursor.execute('''
                    INSERT INTO quiz_questions (quiz_id, question_text, options, answer, question_order)
                    VALUES (?, ?, ?, ?, ?)
                ''', (quiz_id, question_text, '||'.join(options), answer, index))
            conn.commit()

        return jsonify({'status': 'success', 'quiz_id': quiz_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/scenarios', methods=['GET'])
def list_scenarios():
    """List all available simulation scenarios"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT s.slug, s.title, s.description, s.difficulty, s.duration, s.role, s.location,
                       d.slug AS disaster_slug, d.title AS disaster_title, d.category AS disaster_category
                FROM scenarios s
                JOIN disasters d ON s.disaster_id = d.id
                ORDER BY d.title, s.title
            ''')
            scenarios = [dict(row) for row in cursor.fetchall()]
        return jsonify({'scenarios': scenarios}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/institutions', methods=['GET'])
def list_institutions():
    """List registered institutions"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, name, type, district, state, readiness_score, participation_rate FROM institutions')
            institutions = [dict(row) for row in cursor.fetchall()]
        return jsonify({'institutions': institutions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/institutions/<int:institution_id>', methods=['GET'])
def get_institution(institution_id):
    """Get institution details with classes and teachers"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, name, type, district, state, readiness_score, participation_rate FROM institutions WHERE id = ?', (institution_id,))
            institution = cursor.fetchone()
            if not institution:
                return jsonify({'error': 'Institution not found'}), 404
            institution_dict = dict(institution)
            cursor.execute('SELECT id, name, department, readiness_score FROM classes WHERE institution_id = ?', (institution_id,))
            institution_dict['classes'] = [dict(row) for row in cursor.fetchall()]
            cursor.execute('SELECT id, name, email, phone, role FROM teachers WHERE institution_id = ?', (institution_id,))
            institution_dict['teachers'] = [dict(row) for row in cursor.fetchall()]
        return jsonify({'institution': institution_dict}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/classes', methods=['GET'])
def list_classes():
    """List classes"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT c.id, c.name, c.department, c.readiness_score, i.name AS institution_name, i.type AS institution_type
                FROM classes c
                JOIN institutions i ON c.institution_id = i.id
                ORDER BY c.name
            ''')
            classes = [dict(row) for row in cursor.fetchall()]
        return jsonify({'classes': classes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/classes/<int:class_id>', methods=['GET'])
def get_class(class_id):
    """Get class details and students"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT c.id, c.name, c.department, c.readiness_score, i.name AS institution_name, i.type AS institution_type
                FROM classes c
                JOIN institutions i ON c.institution_id = i.id
                WHERE c.id = ?
            ''', (class_id,))
            class_row = cursor.fetchone()
            if not class_row:
                return jsonify({'error': 'Class not found'}), 404
            class_dict = dict(class_row)
            cursor.execute('SELECT id, name, email, phone, readiness_score, weak_area FROM students WHERE class_id = ?', (class_id,))
            class_dict['students'] = [dict(row) for row in cursor.fetchall()]
            cursor.execute('SELECT id, title, instructions, assigned_at, due_date FROM teacher_assignments WHERE class_id = ?', (class_id,))
            class_dict['assignments'] = [dict(row) for row in cursor.fetchall()]
        return jsonify({'class': class_dict}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/teachers', methods=['GET'])
def list_teachers():
    """List teachers"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, institution_id, name, email, phone, role FROM teachers ORDER BY name')
            teachers = [dict(row) for row in cursor.fetchall()]
        return jsonify({'teachers': teachers}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/teachers/<int:teacher_id>', methods=['GET'])
def get_teacher(teacher_id):
    """Get teacher details with class and assignment context"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, institution_id, name, email, phone, role FROM teachers WHERE id = ?', (teacher_id,))
            teacher = cursor.fetchone()
            if not teacher:
                return jsonify({'error': 'Teacher not found'}), 404
            teacher_dict = dict(teacher)
            cursor.execute('''
                SELECT c.id, c.name, c.department, c.readiness_score
                FROM classes c
                JOIN teacher_assignments ta ON ta.class_id = c.id
                WHERE ta.teacher_id = ?
                GROUP BY c.id
            ''', (teacher_id,))
            teacher_dict['classes'] = [dict(row) for row in cursor.fetchall()]
            cursor.execute('''
                SELECT ta.id, ta.title, ta.instructions, ta.assigned_at, ta.due_date,
                       c.name AS class_name, s.title AS scenario_title
                FROM teacher_assignments ta
                JOIN classes c ON ta.class_id = c.id
                LEFT JOIN scenarios s ON ta.scenario_id = s.id
                WHERE ta.teacher_id = ?
                ORDER BY ta.assigned_at DESC
            ''', (teacher_id,))
            teacher_dict['assignments'] = [dict(row) for row in cursor.fetchall()]
        return jsonify({'teacher': teacher_dict}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/students', methods=['GET'])
def list_students():
    """List students"""
    student_id = request.args.get('student_id', type=int)
    class_id = request.args.get('class_id', type=int)
    institution_id = request.args.get('institution_id', type=int)
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            base_query = '''
                SELECT s.id, s.name, s.email, s.phone, s.readiness_score, s.weak_area, s.experience,
                       c.name AS class_name, i.name AS institution_name
                FROM students s
                JOIN classes c ON s.class_id = c.id
                JOIN institutions i ON s.institution_id = i.id
            '''
            filters = []
            params = []
            if student_id:
                filters.append('s.id = ?')
                params.append(student_id)
            if class_id:
                filters.append('s.class_id = ?')
                params.append(class_id)
            if institution_id:
                filters.append('s.institution_id = ?')
                params.append(institution_id)
            if filters:
                base_query += ' WHERE ' + ' AND '.join(filters)
            base_query += ' ORDER BY s.experience DESC, s.readiness_score DESC, s.name'
            cursor.execute(base_query, tuple(params))
            students = [dict(row) for row in cursor.fetchall()]
        return jsonify({'students': students}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    """Get student details and assessments"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT s.id, s.name, s.email, s.phone, s.readiness_score, s.weak_area, s.experience,
                       c.name AS class_name, i.name AS institution_name
                FROM students s
                JOIN classes c ON s.class_id = c.id
                JOIN institutions i ON s.institution_id = i.id
                WHERE s.id = ?
            ''', (student_id,))
            student = cursor.fetchone()
            if not student:
                return jsonify({'error': 'Student not found'}), 404
            student_dict = dict(student)
            cursor.execute('SELECT id, type, category, score, xp_awarded, date_taken, details FROM assessments WHERE student_id = ?', (student_id,))
            student_dict['assessments'] = [dict(row) for row in cursor.fetchall()]
            cursor.execute('''
                SELECT sp.id, sp.assignment_id, sp.scenario_id, sp.status, sp.score, sp.completed_at,
                       ta.title AS assignment_title, sc.title AS scenario_title
                FROM student_progress sp
                LEFT JOIN teacher_assignments ta ON sp.assignment_id = ta.id
                LEFT JOIN scenarios sc ON sp.scenario_id = sc.id
                WHERE sp.student_id = ?
            ''', (student_id,))
            student_dict['progress'] = [dict(row) for row in cursor.fetchall()]
        return jsonify({'student': student_dict}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/students/<int:student_id>/experience/reset', methods=['POST'])
def reset_student_experience(student_id):
    """Reset a student's experience points to zero."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM students WHERE id = ?', (student_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Student not found'}), 404

            cursor.execute('UPDATE students SET experience = 0 WHERE id = ?', (student_id,))
            conn.commit()

        return jsonify({'status': 'success', 'message': 'Student experience reset to 0'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/students/experience/reset-all', methods=['POST'])
def reset_all_student_experience():
    """Reset experience points for all students."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE students SET experience = 0')
            conn.commit()

        return jsonify({'status': 'success', 'message': 'All student experience reset to 0'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/students/<int:student_id>/assessments', methods=['POST'])
def create_student_assessment(student_id):
    """Create a new assessment record for a student and update their experience points."""
    data = request.get_json() or {}
    assessment_type = data.get('type')
    category = data.get('category')
    score = data.get('score')
    xp_awarded = data.get('xp_awarded', 0) or 0
    details = data.get('details')

    if not assessment_type or score is None:
        return jsonify({'error': 'Assessment type and score are required'}), 400

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM students WHERE id = ?', (student_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Student not found'}), 404

            cursor.execute('''
                INSERT INTO assessments (student_id, type, category, score, xp_awarded, details)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (student_id, assessment_type, category, score, xp_awarded, details))

            if xp_awarded:
                cursor.execute('UPDATE students SET experience = experience + ? WHERE id = ?', (xp_awarded, student_id))
            conn.commit()
            assessment_id = cursor.lastrowid

        return jsonify({'status': 'success', 'assessment_id': assessment_id, 'xp_awarded': xp_awarded}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/students/leaderboard', methods=['GET'])
def list_student_leaderboard():
    """List student leaderboard sorted by experience points"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT s.id, s.name, s.readiness_score, s.experience, s.weak_area,
                       c.name AS class_name, i.name AS institution_name
                FROM students s
                JOIN classes c ON s.class_id = c.id
                JOIN institutions i ON s.institution_id = i.id
                ORDER BY s.experience DESC, s.readiness_score DESC
                LIMIT 20
            ''')
            leaderboard = [dict(row) for row in cursor.fetchall()]
        return jsonify({'leaderboard': leaderboard}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/teacher-assignments', methods=['GET'])
def list_teacher_assignments():
    """List teacher assignments"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT ta.id, ta.title, ta.instructions, ta.assigned_at, ta.due_date,
                       t.name AS teacher_name, c.name AS class_name, s.title AS scenario_title
                FROM teacher_assignments ta
                JOIN teachers t ON ta.teacher_id = t.id
                JOIN classes c ON ta.class_id = c.id
                JOIN scenarios s ON ta.scenario_id = s.id
                ORDER BY ta.assigned_at DESC
            ''')
            assignments = [dict(row) for row in cursor.fetchall()]
        return jsonify({'assignments': assignments}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/student-progress', methods=['GET'])
def list_student_progress():
    """List student progress records"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT sp.id, sp.status, sp.score, sp.completed_at,
                       st.name AS student_name, ta.title AS assignment_title, sc.title AS scenario_title
                FROM student_progress sp
                LEFT JOIN students st ON sp.student_id = st.id
                LEFT JOIN teacher_assignments ta ON sp.assignment_id = ta.id
                LEFT JOIN scenarios sc ON sp.scenario_id = sc.id
                ORDER BY sp.id DESC
            ''')
            progress = [dict(row) for row in cursor.fetchall()]
        return jsonify({'progress': progress}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/scenarios/<string:slug>', methods=['GET'])
def get_scenario(slug):
    """Get a full scenario including stages and decisions"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT s.id, s.slug, s.title, s.description, s.difficulty, s.duration, s.role, s.location,
                       d.slug AS disaster_slug, d.title AS disaster_title, d.category AS disaster_category
                FROM scenarios s
                JOIN disasters d ON s.disaster_id = d.id
                WHERE s.slug = ?
            ''', (slug,))
            scenario = cursor.fetchone()
            if not scenario:
                return jsonify({'error': 'Scenario not found'}), 404

            scenario_dict = dict(scenario)
            scenario_id = scenario_dict.pop('id')

            cursor.execute('''
                SELECT id, stage_order, title, event, description, time_limit
                FROM scenario_stages
                WHERE scenario_id = ?
                ORDER BY stage_order
            ''', (scenario_id,))
            stages = [dict(row) for row in cursor.fetchall()]

            for stage in stages:
                cursor.execute('''
                    SELECT option_key, text, is_safe, score, feedback, consequence
                    FROM scenario_decisions
                    WHERE stage_id = ?
                    ORDER BY option_key
                ''', (stage['id'],))
                stage['decisions'] = [dict(row) for row in cursor.fetchall()]
                stage.pop('id', None)

            scenario_dict['stages'] = stages
        return jsonify({'scenario': scenario_dict}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
