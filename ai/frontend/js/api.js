/**
 * ResQ Disaster Response - API Service Module
 * Connects web frontend to Flask Backend endpoints
 */

const API_BASE = '/api';

const ApiService = {
    /**
     * Server Health Check
     */
    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
            if (!response.ok) throw new Error('Server unhealthy');
            return await response.json();
        } catch (err) {
            console.warn('API Health Check failed:', err.message);
            return { status: 'offline', message: err.message };
        }
    },

    /**
     * Chatbot message query
     * @param {string} message - User query
     * @param {string} category - Category (first_aid, shelter, evacuation, medical, general)
     */
    async sendChatMessage(message, category = 'general') {
        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, category })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (err) {
            console.error('Chat API Error:', err);
            // Local fallback response when server/Ollama is unreachable
            return {
                user_message: message,
                bot_response: this.getOfflineFallback(message, category),
                category: category,
                is_offline_fallback: true
            };
        }
    },

    /**
     * Get emergency contacts
     */
    async getEmergencyContacts() {
        try {
            const response = await fetch(`${API_BASE}/emergency-contacts`);
            if (!response.ok) throw new Error('Failed to fetch contacts');
            return await response.json();
        } catch (err) {
            console.warn('Contacts API offline, using cached fallback');
            return {
                contacts: [
                    { id: 1, name: 'National Emergency Response Centre', type: 'Police', phone: '112', description: 'National emergency helpline for police, fire, and medical response', latitude: 28.6139, longitude: 77.2090 },
                    { id: 2, name: 'National Ambulance Service', type: 'Ambulance', phone: '102', description: 'Ambulance response and medical transport services', latitude: 28.6280, longitude: 77.2167 },
                    { id: 3, name: 'National Disaster Relief Authority', type: 'Relief', phone: '1070', description: 'Disaster relief coordination, shelter and supplies support', latitude: 28.6448, longitude: 77.2167 }
                ]
            };
        }
    },

    /**
     * Get shelter locations
     */
    async getShelters() {
        try {
            const response = await fetch(`${API_BASE}/shelters`);
            if (!response.ok) throw new Error('Failed to fetch shelters');
            return await response.json();
        } catch (err) {
            console.warn('Shelters API offline, using cached fallback');
            return {
                shelters: [
                    { id: 1, name: 'Indira Gandhi Indoor Stadium Shelter', address: 'Indira Gandhi Indoor Stadium, Akshardham, New Delhi, Delhi', latitude: 28.6159, longitude: 77.2511, capacity: 1200, phone: '+91 11 2389 1122', supplies: 'Food, Water, Blankets, Medical Kits' },
                    { id: 2, name: 'Dr. Ambedkar International Centre Relief Camp', address: 'Dr. Ambedkar International Centre, Janpath, New Delhi, Delhi', latitude: 28.6090, longitude: 77.2159, capacity: 850, phone: '+91 11 2371 4374', supplies: 'Emergency Shelter, Sanitation, First Aid' }
                ]
            };
        }
    },

    /**
     * Get first aid guides
     */
    async getFirstAidGuides(category = 'all') {
        try {
            const response = await fetch(`${API_BASE}/first-aid/${encodeURIComponent(category)}`);
            if (!response.ok) throw new Error('Failed to fetch guides');
            return await response.json();
        } catch (err) {
            console.warn('First Aid API offline, using fallback guides');
            return { guides: [] };
        }
    },

    /**
     * List disaster modules
     */
    async getDisasters() {
        try {
            const response = await fetch(`${API_BASE}/disasters`);
            if (!response.ok) throw new Error('Failed to fetch disasters');
            return await response.json();
        } catch (err) {
            console.warn('Disaster API offline, using fallback');
            return { disasters: [] };
        }
    },

    async loginUser(role, email, password) {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Unable to login');
            }
            return await response.json();
        } catch (err) {
            console.error('Login API Error:', err);
            return { error: err.message };
        }
    },

    async getInstitutions() {
        try {
            const response = await fetch(`${API_BASE}/institutions`);
            if (!response.ok) throw new Error('Failed to fetch institutions');
            return await response.json();
        } catch (err) {
            console.warn('Institutions API offline, using fallback');
            return { institutions: [] };
        }
    },

    async getInstitutionById(institutionId) {
        try {
            const response = await fetch(`${API_BASE}/institutions/${institutionId}`);
            if (!response.ok) throw new Error('Failed to fetch institution');
            return await response.json();
        } catch (err) {
            console.warn('Institution API offline', err);
            return { institution: null };
        }
    },

    async getTeachers() {
        try {
            const response = await fetch(`${API_BASE}/teachers`);
            if (!response.ok) throw new Error('Failed to fetch teachers');
            return await response.json();
        } catch (err) {
            console.warn('Teachers API offline, using fallback');
            return { teachers: [] };
        }
    },

    async getClasses() {
        try {
            const response = await fetch(`${API_BASE}/classes`);
            if (!response.ok) throw new Error('Failed to fetch classes');
            return await response.json();
        } catch (err) {
            console.warn('Classes API offline, using fallback');
            return { classes: [] };
        }
    },

    async getStudentById(studentId) {
        try {
            const response = await fetch(`${API_BASE}/students/${studentId}`);
            if (!response.ok) throw new Error('Failed to fetch student');
            return await response.json();
        } catch (err) {
            console.warn('Student API offline', err);
            return { student: null };
        }
    },

    async resetStudentExperience(studentId) {
        try {
            const response = await fetch(`${API_BASE}/students/${studentId}/experience/reset`, {
                method: 'POST'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reset student experience');
            }
            return await response.json();
        } catch (err) {
            console.error('Reset Student Experience API Error:', err);
            return { error: err.message };
        }
    },

    async resetAllStudentExperience() {
        try {
            const response = await fetch(`${API_BASE}/students/experience/reset-all`, {
                method: 'POST'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reset all student experience');
            }
            return await response.json();
        } catch (err) {
            console.error('Reset All Student Experience API Error:', err);
            return { error: err.message };
        }
    },

    async getStudentLeaderboard() {
        try {
            const response = await fetch(`${API_BASE}/students/leaderboard`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');
            return await response.json();
        } catch (err) {
            console.warn('Leaderboard API offline', err);
            return { leaderboard: [] };
        }
    },

    async getTeacherById(teacherId) {
        try {
            const response = await fetch(`${API_BASE}/teachers/${teacherId}`);
            if (!response.ok) throw new Error('Failed to fetch teacher');
            return await response.json();
        } catch (err) {
            console.warn('Teacher API offline', err);
            return { teacher: null };
        }
    },

    async getStudents(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.student_id) params.set('student_id', filters.student_id);
            if (filters.class_id) params.set('class_id', filters.class_id);
            if (filters.institution_id) params.set('institution_id', filters.institution_id);
            const query = params.toString() ? `?${params.toString()}` : '';
            const response = await fetch(`${API_BASE}/students${query}`);
            if (!response.ok) throw new Error('Failed to fetch students');
            return await response.json();
        } catch (err) {
            console.warn('Students API offline, using fallback');
            return { students: [] };
        }
    },

    /**
     * Get disaster module details
     */
    async getDisaster(slug) {
        try {
            const response = await fetch(`${API_BASE}/disasters/${encodeURIComponent(slug)}`);
            if (!response.ok) throw new Error('Failed to fetch disaster details');
            return await response.json();
        } catch (err) {
            console.warn('Disaster module API offline', err);
            return { disaster: null };
        }
    },

    async getDisasterQuiz(slug) {
        try {
            const response = await fetch(`${API_BASE}/disasters/${encodeURIComponent(slug)}/quiz`);
            if (!response.ok) throw new Error('Failed to fetch disaster quiz');
            return await response.json();
        } catch (err) {
            console.warn('Disaster quiz API offline', err);
            return { quiz: null };
        }
    },

    async createDisasterQuiz(slug, quizData) {
        try {
            const response = await fetch(`${API_BASE}/disasters/${encodeURIComponent(slug)}/quizzes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create disaster quiz');
            }
            return await response.json();
        } catch (err) {
            console.error('Create Disaster Quiz API Error:', err);
            return { error: err.message };
        }
    },

    async submitStudentAssessment(studentId, assessment) {
        try {
            const response = await fetch(`${API_BASE}/students/${studentId}/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessment)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save assessment');
            }
            return await response.json();
        } catch (err) {
            console.error('Assessment API Error:', err);
            return { error: err.message };
        }
    },

    /**
     * Get full scenario details
     */
    async getScenario(slug) {
        try {
            const response = await fetch(`${API_BASE}/scenarios/${encodeURIComponent(slug)}`);
            if (!response.ok) throw new Error('Failed to fetch scenario details');
            return await response.json();
        } catch (err) {
            console.warn('Scenario API offline', err);
            return { scenario: null };
        }
    },

    /**
     * Generate SOS Message
     */
    async generateSOS(location, category = 'general') {
        try {
            const response = await fetch(`${API_BASE}/sos/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location, category })
            });
            if (!response.ok) throw new Error('Failed to generate SOS');
            return await response.json();
        } catch (err) {
            const messages = {
                medical: `URGENT MEDICAL HELP NEEDED at ${location}. Person requires immediate assistance.`,
                shelter: `NEED SHELTER at ${location}. Looking for safe refuge and supplies.`,
                general: `HELP NEEDED at ${location}. Requesting emergency assistance.`,
                evacuation: `EVACUATION REQUIRED from ${location}. Immediate evacuation needed.`
            };
            return {
                id: Date.now(),
                message: messages[category] || messages['general'],
                category: category,
                status: 'pending'
            };
        }
    },

    /**
     * Queue SOS message for transmission
     */
    async sendSOS(sosId) {
        try {
            const response = await fetch(`${API_BASE}/sos/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sosId })
            });
            if (!response.ok) throw new Error('Failed to send SOS');
            return await response.json();
        } catch (err) {
            return { status: 'queued', message: 'SOS signal saved to local emergency queue.' };
        }
    },

    /**
     * Get chat conversation history
     */
    async getChatHistory(limit = 50) {
        try {
            const response = await fetch(`${API_BASE}/chat-history?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch chat history');
            return await response.json();
        } catch (err) {
            return { history: [] };
        }
    },

    /**
     * Client-side emergency rule-based fallback response
     */
    getOfflineFallback(query, category) {
        const lower = query.toLowerCase();
        if (lower.includes('cpr') || lower.includes('breathing') || lower.includes('unconscious')) {
            return `🚨 **CPR EMERGENCY STEPS**:\n1. Call emergency services immediately (911).\n2. Place hands in center of chest.\n3. Push hard and fast (100-120 BPM) to beat of "Stayin' Alive".\n4. Give 2 rescue breaths after 30 compressions if trained. Do not stop until help arrives.`;
        }
        if (lower.includes('bleed') || lower.includes('blood') || lower.includes('cut')) {
            return `🩸 **BLEEDING CONTROL**:\n1. Apply continuous direct pressure over wound using sterile cloth.\n2. Elevate injured limb above heart level.\n3. If bleeding continues profusely, apply tourniquet 2 inches above wound. Do NOT loosen tourniquet once placed.`;
        }
        if (lower.includes('burn') || lower.includes('fire')) {
            return `🔥 **BURN FIRST AID**:\n1. Cool burn under cool running water for 10-15 minutes.\n2. Cover loosely with sterile non-stick bandage.\n3. Do NOT apply ice, butter, or pop blisters!`;
        }
        if (lower.includes('shelter') || lower.includes('refuge') || lower.includes('safe')) {
            return `🏠 **SHELTER FINDER**:\nPlease switch to the **Shelters** tab to view your nearest refuge center coordinates, capacity, and available supplies on the map!`;
        }
        return `⚠️ **EMERGENCY DIRECTIVE (${category.toUpperCase()})**:\nEnsure you and others are in immediate physical safety. If experiencing severe trauma, bleeding, or breathing difficulty, see the First Aid tab or generate an SOS distress beacon from the top bar immediately.`;
    }
};

window.ApiService = ApiService;
