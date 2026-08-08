import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'disaster_response.db')

def init_db():
    """Initialize SQLite database with schema"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Emergency Contacts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emergency_contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            phone TEXT,
            description TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')
    
    # First Aid Guide Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS first_aid_guides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            steps TEXT,
            precautions TEXT,
            materials TEXT
        )
    ''')
    
    # Shelter Locations Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shelter_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            capacity INTEGER,
            phone TEXT,
            supplies TEXT
        )
    ''')
    
    # Offline Maps Data Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS offline_maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tile_url TEXT NOT NULL,
            zoom_level INTEGER,
            latitude REAL,
            longitude REAL,
            data BLOB
        )
    ''')
    
    # Disasters Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS disasters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            summary TEXT,
            hazard_types TEXT,
            before_summary TEXT,
            during_summary TEXT,
            after_summary TEXT,
            sources TEXT
        )
    ''')

    # Scenarios Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disaster_id INTEGER NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            difficulty TEXT,
            duration INTEGER,
            role TEXT,
            location TEXT,
            FOREIGN KEY(disaster_id) REFERENCES disasters(id)
        )
    ''')

    # Scenario Stages Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scenario_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scenario_id INTEGER NOT NULL,
            stage_order INTEGER NOT NULL,
            title TEXT NOT NULL,
            event TEXT,
            description TEXT,
            time_limit INTEGER DEFAULT 0,
            FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
        )
    ''')

    # Scenario Decisions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scenario_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_id INTEGER NOT NULL,
            option_key TEXT NOT NULL,
            text TEXT NOT NULL,
            is_safe INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            feedback TEXT,
            consequence TEXT,
            FOREIGN KEY(stage_id) REFERENCES scenario_stages(id)
        )
    ''')
    
    # SOS Messages Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sos_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_location TEXT,
            message TEXT,
            category TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending'
        )
    ''')
    
    # Chat History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_message TEXT NOT NULL,
            bot_response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            category TEXT
        )
    ''')

    # Institution & Learning Ecosystem Tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS institutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            district TEXT,
            state TEXT,
            email TEXT,
            password TEXT,
            readiness_score INTEGER DEFAULT 0,
            participation_rate REAL DEFAULT 0
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            institution_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            department TEXT,
            readiness_score INTEGER DEFAULT 0,
            FOREIGN KEY(institution_id) REFERENCES institutions(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            institution_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            password TEXT,
            phone TEXT,
            role TEXT DEFAULT 'mentor',
            FOREIGN KEY(institution_id) REFERENCES institutions(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            institution_id INTEGER NOT NULL,
            class_id INTEGER,
            name TEXT NOT NULL,
            email TEXT,
            password TEXT,
            phone TEXT,
            readiness_score INTEGER DEFAULT 0,
            weak_area TEXT,
            experience INTEGER DEFAULT 0,
            FOREIGN KEY(institution_id) REFERENCES institutions(id),
            FOREIGN KEY(class_id) REFERENCES classes(id)
        )
    ''')

    cursor.execute('PRAGMA table_info(students)')
    existing_columns = [row[1] for row in cursor.fetchall()]
    if 'experience' not in existing_columns:
        cursor.execute('ALTER TABLE students ADD COLUMN experience INTEGER DEFAULT 0')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            category TEXT,
            score INTEGER,
            xp_awarded INTEGER DEFAULT 0,
            date_taken DATETIME DEFAULT CURRENT_TIMESTAMP,
            details TEXT,
            FOREIGN KEY(student_id) REFERENCES students(id)
        )
    ''')

    cursor.execute('PRAGMA table_info(assessments)')
    assessment_columns = [row[1] for row in cursor.fetchall()]
    if 'xp_awarded' not in assessment_columns:
        cursor.execute('ALTER TABLE assessments ADD COLUMN xp_awarded INTEGER DEFAULT 0')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disaster_id INTEGER NOT NULL,
            teacher_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(disaster_id) REFERENCES disasters(id),
            FOREIGN KEY(teacher_id) REFERENCES teachers(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            options TEXT NOT NULL,
            answer TEXT NOT NULL,
            question_order INTEGER DEFAULT 0,
            FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teacher_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            scenario_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            instructions TEXT,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            due_date DATETIME,
            FOREIGN KEY(teacher_id) REFERENCES teachers(id),
            FOREIGN KEY(class_id) REFERENCES classes(id),
            FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            assignment_id INTEGER,
            scenario_id INTEGER,
            status TEXT DEFAULT 'pending',
            score INTEGER DEFAULT 0,
            completed_at DATETIME,
            FOREIGN KEY(student_id) REFERENCES students(id),
            FOREIGN KEY(assignment_id) REFERENCES teacher_assignments(id),
            FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
        )
    ''')
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def insert_sample_data():
    """Insert sample data into database"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if contacts already initialized
        cursor.execute('SELECT COUNT(*) FROM emergency_contacts')
        if cursor.fetchone()[0] == 0:
            contacts = [
                ('National Emergency Response Centre', 'Police', '112', 'National emergency helpline for police, fire, and medical response', 28.6139, 77.2090),
                ('National Ambulance Service', 'Ambulance', '102', 'Ambulance response and medical transport services', 28.6280, 77.2167),
                ('National Disaster Relief Authority', 'Relief', '1070', 'Disaster relief coordination, shelter and supplies support', 28.6448, 77.2167),
                ('Fire & Rescue Services', 'Fire', '101', 'Firefighting, rescue, and disaster mitigation services', 28.6266, 77.2190),
                ('Disaster Management Helpline', 'Helpline', '108', 'Civil defense and evacuation coordination hotline', 28.6175, 77.2070),
                ('Mental Health Support', 'Helpline', '14446', 'Psychological first aid and crisis support', 28.6203, 77.2120),
                ('Blood Donation Emergency', 'Health', '104', 'Emergency blood donation and hospital coordination', 28.6100, 77.2300)
            ]
            cursor.executemany('''
                INSERT INTO emergency_contacts (name, type, phone, description, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', contacts)

        # Check if shelters already initialized
        cursor.execute('SELECT COUNT(*) FROM shelter_locations')
        if cursor.fetchone()[0] == 0:
            shelters = [
                ('Indira Gandhi Indoor Stadium Shelter', 'Indira Gandhi Indoor Stadium, Akshardham, New Delhi, Delhi', 28.6159, 77.2511, 1200, '+91 11 2389 1122', 'Food, Water, Blankets, Medical Kits'),
                ('Dr. Ambedkar International Centre Relief Camp', 'Dr. Ambedkar International Centre, Janpath, New Delhi, Delhi', 28.6090, 77.2159, 850, '+91 11 2371 4374', 'Emergency Shelter, Sanitation, First Aid'),
                ('Jawaharlal Nehru Stadium Refuge Hub', 'Jawaharlal Nehru Stadium, Delhi', 28.5927, 77.2334, 1000, '+91 11 2436 3523', 'Cots, Meals, Chargers, Medical Assistance'),
                ('Ramlila Maidan Emergency Shelter', 'Ramlila Maidan, New Delhi, Delhi', 28.6329, 77.2188, 650, '+91 11 2336 6180', 'Drinking Water, Blankets, Sanitary Kits'),
                ('Major Dhyan Chand National Stadium Camp', 'Major Dhyan Chand National Stadium, New Delhi, Delhi', 28.6014, 77.2386, 780, '+91 11 2338 9506', 'Food, Medical Triage, Family Assistance')
            ]
            cursor.executemany('''
                INSERT INTO shelter_locations (name, address, latitude, longitude, capacity, phone, supplies)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', shelters)
        
        # Check if first aid guides already initialized
        cursor.execute('SELECT COUNT(*) FROM first_aid_guides')
        if cursor.fetchone()[0] == 0:
            guides = [
                (
                    'CPR - Cardiopulmonary Resuscitation',
                    'Life-Saving',
                    'Maintain blood circulation during cardiac arrest until medical help arrives.',
                    '1. Check for responsiveness and pulse.\n2. Call 911 or emergency dispatch.\n3. Position hands in center of chest.\n4. Push hard and fast (100-120 BPM) to the beat of "Stayin Alive".\n5. Provide 2 rescue breaths after every 30 compressions if trained.',
                    'Do not stop compressions unless victim revives or help takes over.',
                    'CPR Mask, Disposable Gloves'
                ),
                (
                    'Severe Bleeding Control',
                    'Trauma',
                    'Stop excessive blood loss using direct pressure, elevation, and tourniquets.',
                    '1. Expose the wound and check for embedded objects.\n2. Apply firm, continuous direct pressure using sterile cloth or hands.\n3. Elevate the injured limb above heart level if no fracture suspected.\n4. If bleeding continues, apply a tourniquet 2-3 inches above the wound.\n5. Keep patient warm and calm to prevent shock.',
                    'Do NOT remove tourniquet once applied. Note the exact time applied.',
                    'Sterile Gauze, Elastic Bandage, Tourniquet, Gloves'
                ),
                (
                    'Burn Treatment (1st & 2nd Degree)',
                    'Burns',
                    'Relieve pain, prevent infection, and stabilize thermal or chemical burn wounds.',
                    '1. Remove heat source immediately.\n2. Cool burn with cool running water for at least 10-15 minutes.\n3. Remove rings or tight items near burned area before swelling.\n4. Cover burn loosely with sterile non-stick bandage.\n5. Give OTC pain reliever if available.',
                    'Do NOT apply ice, butter, grease, or pop burn blisters.',
                    'Cool Clean Water, Sterile Non-Stick Pads, Burn Gel'
                ),
                (
                    'Bone Fracture & Sprain Immobilization',
                    'Trauma',
                    'Immobilize fractured or severe sprain limbs to minimize tissue damage and pain.',
                    '1. Keep injured area completely still.\n2. Apply ice wrapped in cloth to reduce swelling.\n3. Create a rigid splint using rolled magazines, wood, or cardboard.\n4. Secure splint with cloth strips above and below the fracture site.\n5. Check circulation (pulse and warmth) below splint.',
                    'Do NOT attempt to realign or push back protruding bones.',
                    'Splint material (wood/cardboard), Bandages/Cloth, Ice Pack'
                ),
                (
                    'Choking - Heimlich Maneuver',
                    'Life-Saving',
                    'Clear airway obstruction in conscious adults or children over 1 year.',
                    '1. Stand behind person and wrap arms around waist.\n2. Make a fist with one hand, place thumb side above navel.\n3. Grasp fist with other hand and give quick upward abdominal thrusts.\n4. Repeat until object is dislodged or person becomes unconscious.',
                    'If person loses consciousness, lower gently to ground and begin CPR.',
                    'None required (Hands-on procedure)'
                ),
                (
                    'Emergency Water Purification',
                    'Sanitation',
                    'Make contaminated flood or raw water safe for drinking in disaster zones.',
                    '1. Filter cloudy water through clean cloth, paper towel, or coffee filter.\n2. Bring water to a rolling boil for at least 1 full minute.\n3. Alternatively, add 8 drops of unscented liquid household bleach per gallon.\n4. Stir thoroughly and let stand for 30 minutes before drinking.',
                    'Never use scented or color-safe bleach. Water should have light chlorine odor.',
                    'Clean Cloth, Cooking Pot/Heat Source, Unscented Bleach, Dropper'
                )
            ]
            cursor.executemany('''
                INSERT INTO first_aid_guides (title, category, description, steps, precautions, materials)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', guides)
        
        # Check if disaster data already initialized
        cursor.execute('SELECT COUNT(*) FROM disasters')
        if cursor.fetchone()[0] == 0:
            disasters = [
                (
                    'earthquake',
                    'Earthquake Preparedness',
                    'Geological',
                    'Learn how to stay safe during earthquakes, build a family plan, and make the right decisions when shaking starts.',
                    'earthquake',
                    'Recognize shaking, protect yourself, and move to a safer place after the event.',
                    'Drop, Cover, and Hold On. Avoid exits and glass. Move only after shaking stops.',
                    'Evaluate building damage, reconnect with family, and restore emergency supplies.',
                    'NDMA, USGS, UNDRR'
                ),
                (
                    'flood',
                    'Flood Awareness & Response',
                    'Hydrological',
                    'Understand flood hazards, safe evacuation choices, and household preparedness for rising water.',
                    'flood, flash flood, urban flood',
                    'Prepare sandbags, locate high ground, and protect important documents.',
                    'Monitor local water levels, move to high ground after water recedes, and avoid contaminated water.',
                    'After the flood, avoid standing water, check for structural damage, and clean water safely.',
                    'NDMA, IMD, NDRF'
                ),
                (
                    'cyclone',
                    'Cyclone Readiness',
                    'Meteorological',
                    'Prepare your family and community for cyclones with shelter planning, early warnings, and evacuation decisions.',
                    'cyclone, storm surge, high wind',
                    'Secure loose objects, review evacuation routes, and maintain emergency supplies.',
                    'Stay indoors until the storm passes, avoid floodwater, and inspect for damage carefully.',
                    'After the cyclone, check for damage safely, avoid fallen power lines, and restore emergency supplies.',
                    'IMD, NDMA, NDRF'
                )
            ]
            cursor.executemany('''
                INSERT INTO disasters (slug, title, category, summary, hazard_types, before_summary, during_summary, after_summary, sources)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', disasters)

        # Check if scenarios already initialized
        cursor.execute('SELECT COUNT(*) FROM scenarios')
        if cursor.fetchone()[0] == 0:
            cursor.execute('SELECT id FROM disasters WHERE slug = ?', ('earthquake',))
            earthquake_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM disasters WHERE slug = ?', ('flood',))
            flood_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM disasters WHERE slug = ?', ('cyclone',))
            cyclone_id = cursor.fetchone()[0]

            scenarios = [
                (earthquake_id, 'earthquake-school-drill', 'Earthquake School Drill',
                    'You are in a school classroom when the ground begins to shake. Make safe choices to protect students and reach the assembly area.',
                    'medium', 600, 'student', 'school'),
                (flood_id, 'urban-flood-evacuation', 'Urban Flood Evacuation',
                    'Sudden heavy rain causes street flooding in a coastal city. Choose safe routes and manage your emergency kit.',
                    'medium', 600, 'citizen', 'urban'),
                (cyclone_id, 'cyclone-shelter-planning', 'Cyclone Shelter Planning',
                    'A cyclone warning has been issued for your coastal town. Secure supplies, decide whether to shelter in place or evacuate, and protect family members.',
                    'medium', 900, 'citizen', 'coastal')
            ]
            cursor.executemany('''
                INSERT INTO scenarios (disaster_id, slug, title, description, difficulty, duration, role, location)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', scenarios)

        # Check if scenario stages already initialized
        cursor.execute('SELECT COUNT(*) FROM scenario_stages')
        if cursor.fetchone()[0] == 0:
            # Earthquake scenario stages
            cursor.execute('SELECT id FROM scenarios WHERE slug = ?', ('earthquake-school-drill',))
            eq_scenario_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenarios WHERE slug = ?', ('urban-flood-evacuation',))
            flood_scenario_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenarios WHERE slug = ?', ('cyclone-shelter-planning',))
            cyclone_scenario_id = cursor.fetchone()[0]

            stages = [
                (eq_scenario_id, 1, 'Initial Shake', 'earthquake_start', 'The floor begins to tremble and pictures fall from the walls. Students glance around nervously.', 45),
                (eq_scenario_id, 2, 'Aftershock Threat', 'aftershock_warning', 'The shaking stops momentarily, but there are reports of aftershocks nearby.', 30),
                (flood_scenario_id, 1, 'Rising Water', 'flood_warning', 'The river level is rising quickly and streets are starting to flood near your home.', 45),
                (flood_scenario_id, 2, 'Route Choice', 'route_decision', 'Water is blocking some roads. Choose a path to safety for your family member.', 45),
                (cyclone_scenario_id, 1, 'Cyclone Watch', 'cyclone_warning', 'A cyclone warning alert has been issued. Strong wind and rain are expected within hours.', 60),
                (cyclone_scenario_id, 2, 'Shelter Decision', 'shelter_choice', 'Your local shelter has limited capacity. Decide whether to evacuate now or stay home with precautions.', 60)
            ]
            cursor.executemany('''
                INSERT INTO scenario_stages (scenario_id, stage_order, title, event, description, time_limit)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', stages)

        # Check if scenario decisions already initialized
        cursor.execute('SELECT COUNT(*) FROM scenario_decisions')
        if cursor.fetchone()[0] == 0:
            cursor.execute('SELECT id FROM scenario_stages WHERE title = ?', ('Initial Shake',))
            eq_stage_1 = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenario_stages WHERE title = ?', ('Aftershock Threat',))
            eq_stage_2 = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenario_stages WHERE title = ?', ('Rising Water',))
            flood_stage_1 = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenario_stages WHERE title = ?', ('Route Choice',))
            flood_stage_2 = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenario_stages WHERE title = ?', ('Cyclone Watch',))
            cyclone_stage_1 = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenario_stages WHERE title = ?', ('Shelter Decision',))
            cyclone_stage_2 = cursor.fetchone()[0]

            decisions = [
                (eq_stage_1, 'A', 'Run immediately toward the school exit', 0, -10, 'Running while the ground is shaking is dangerous. Stay put and protect yourself.', 'Time penalty, minor injury risk'),
                (eq_stage_1, 'B', 'Drop, Cover and Hold On', 1, 20, 'Correct. Drop, cover under sturdy furniture, and hold on until shaking stops.', 'Safety score increase'),
                (eq_stage_1, 'C', 'Use the elevator to leave', 0, -15, 'Elevators may fail during an earthquake. Stay in the classroom and cover yourself.', 'High risk of getting trapped'),
                (eq_stage_1, 'D', 'Stand near a window and wait', 0, -10, 'Windows can shatter. This is unsafe during shaking.', 'Risk of cuts from glass'),
                (eq_stage_2, 'A', 'Evacuate immediately through the stairwell', 0, -5, 'Wait until shaking stops before moving; stairwells may be unsafe during aftershocks.', 'Potential injury from falling debris'),
                (eq_stage_2, 'B', 'Check for injuries and calm students', 1, 15, 'Good choice. Attend to safety and prepare to move once it is safe.', 'Safety and readiness improved'),
                (flood_stage_1, 'A', 'Move valuables to higher shelves and wait', 1, 10, 'Secure important items and keep your family in a safe upper room.', 'Preparedness improves'),
                (flood_stage_1, 'B', 'Try to walk through the floodwater now', 0, -20, 'Floodwater may be deeper and faster than it looks. Avoid walking through it.', 'High risk of being swept away'),
                (flood_stage_2, 'A', 'Take the main road even if it is partially flooded', 0, -15, 'Main roads can become dangerous. Choose higher ground route instead.', 'Increased danger'),
                (flood_stage_2, 'B', 'Use the marked evacuation route on high ground', 1, 20, 'Correct. Higher ground and official routes are safer during floods.', 'Safety score increase'),
                (cyclone_stage_1, 'A', 'Secure doors and windows and stay indoors', 1, 15, 'Right approach. Stay inside and secure your home ahead of the storm.', 'Preparedness improves'),
                (cyclone_stage_1, 'B', 'Wait until the storm starts to see how bad it is', 0, -10, 'Delaying preparation is risky. Prepare now while there is time.', 'Lost preparedness window'),
                (cyclone_stage_2, 'A', 'Go to the community shelter now', 1, 20, 'If the shelter is safe and available, evacuating early is the safest option.', 'Safety score increase'),
                (cyclone_stage_2, 'B', 'Stay home and rely on your emergency kit', 0, -10, 'Home may be unsafe if wind and surge increase. Shelters are generally safer.', 'Potential risk if structure fails')
            ]
            cursor.executemany('''
                INSERT INTO scenario_decisions (stage_id, option_key, text, is_safe, score, feedback, consequence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', decisions)

        # Check if institutions and education ecosystem data already initialized
        cursor.execute('SELECT COUNT(*) FROM institutions')
        if cursor.fetchone()[0] == 0:
            institutions = [
                ('New Delhi Disaster Preparedness Academy', 'college', 'New Delhi', 'Delhi', 'admin@nddpa.edu.in', 'Inst@123', 78, 0.84),
                ('Delhi Public School Sector 15', 'school', 'Gurgaon', 'Haryana', 'admin@dps15.edu.in', 'School@123', 72, 0.78)
            ]
            cursor.executemany('''
                INSERT INTO institutions (name, type, district, state, email, password, readiness_score, participation_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', institutions)

        cursor.execute('SELECT COUNT(*) FROM classes')
        if cursor.fetchone()[0] == 0:
            cursor.execute('SELECT id FROM institutions WHERE name = ?', ('New Delhi Disaster Preparedness Academy',))
            institution_college_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM institutions WHERE name = ?', ('Delhi Public School Sector 15',))
            institution_school_id = cursor.fetchone()[0]

            classes = [
                (institution_college_id, 'FY Computer Engineering', 'Engineering', 82),
                (institution_college_id, 'IT Engineering', 'Engineering', 79),
                (institution_school_id, 'Grade 10 - A', 'Secondary', 74),
                (institution_school_id, 'Grade 10 - B', 'Secondary', 69)
            ]
            cursor.executemany('''
                INSERT INTO classes (institution_id, name, department, readiness_score)
                VALUES (?, ?, ?, ?)
            ''', classes)

        cursor.execute('SELECT COUNT(*) FROM teachers')
        if cursor.fetchone()[0] == 0:
            cursor.execute('SELECT id FROM institutions WHERE name = ?', ('New Delhi Disaster Preparedness Academy',))
            institution_college_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM institutions WHERE name = ?', ('Delhi Public School Sector 15',))
            institution_school_id = cursor.fetchone()[0]

            teachers = [
                (institution_college_id, 'Ms. Ananya Singh', 'ananya.singh@nddpa.edu.in', 'Ananya@123', '+91 98765 43210', 'Preparedness Mentor'),
                (institution_college_id, 'Mr. Rajat Mehra', 'rajat.mehra@nddpa.edu.in', 'Rajat@321', '+91 98765 43211', 'Preparedness Mentor'),
                (institution_school_id, 'Ms. Priya Sharma', 'priya.sharma@dps15.edu.in', 'Priya@456', '+91 98765 43212', 'Preparedness Mentor')
            ]
            cursor.executemany('''
                INSERT INTO teachers (institution_id, name, email, password, phone, role)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', teachers)

        cursor.execute('SELECT COUNT(*) FROM students')
        if cursor.fetchone()[0] == 0:
            cursor.execute('SELECT id FROM institutions WHERE name = ?', ('New Delhi Disaster Preparedness Academy',))
            institution_college_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM institutions WHERE name = ?', ('Delhi Public School Sector 15',))
            institution_school_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM classes WHERE name = ?', ('FY Computer Engineering',))
            class_ce_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM classes WHERE name = ?', ('Grade 10 - A',))
            class_g10a_id = cursor.fetchone()[0]

            students = [
                (institution_college_id, class_ce_id, 'Student A', 'studenta@nddpa.edu.in', 'StudentA@123', '+91 99999 00001', 82, 'fire safety', 420),
                (institution_college_id, class_ce_id, 'Student B', 'studentb@nddpa.edu.in', 'StudentB@123', '+91 99999 00002', 76, 'flood preparedness', 355),
                (institution_school_id, class_g10a_id, 'Student C', 'studentc@dps15.edu.in', 'StudentC@123', '+91 99999 00003', 69, 'earthquake readiness', 285)
            ]
            cursor.executemany('''
                INSERT INTO students (institution_id, class_id, name, email, password, phone, readiness_score, weak_area, experience)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', students)

        cursor.execute('SELECT COUNT(*) FROM teacher_assignments')
        if cursor.fetchone()[0] == 0:
            cursor.execute('SELECT id FROM teachers WHERE name = ?', ('Ms. Ananya Singh',))
            teacher_ananya_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM classes WHERE name = ?', ('FY Computer Engineering',))
            class_ce_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM scenarios WHERE slug = ?', ('earthquake-school-drill',))
            scenario_eq_id = cursor.fetchone()[0]

            assignments = [
                (teacher_ananya_id, class_ce_id, scenario_eq_id, 'Earthquake Preparedness Drill', 'Assign students to complete the Earthquake School Drill scenario and review their scores.', None)
            ]
            cursor.executemany('''
                INSERT INTO teacher_assignments (teacher_id, class_id, scenario_id, title, instructions, due_date)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', assignments)

        cursor.execute('SELECT COUNT(*) FROM assessments')
        if cursor.fetchone()[0] == 0:
            cursor.execute('SELECT id FROM students WHERE name = ?', ('Student A',))
            student_a_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM students WHERE name = ?', ('Student B',))
            student_b_id = cursor.fetchone()[0]
            cursor.execute('SELECT id FROM students WHERE name = ?', ('Student C',))
            student_c_id = cursor.fetchone()[0]

            assessments = [
                (student_a_id, 'initial', 'earthquake', 58, 95, 'Initial disaster readiness assessment', None),
                (student_b_id, 'simulation', 'flood', 84, 120, 'Flood simulation performance', None),
                (student_c_id, 'quiz', 'fire', 63, 75, 'Fire safety quiz', None)
            ]
            cursor.executemany('''
                INSERT INTO assessments (student_id, type, category, score, xp_awarded, details, date_taken)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', assessments)

        conn.commit()
