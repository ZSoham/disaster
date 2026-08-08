import requests
import json
from .database import get_db

class OfflineChatbot:
    """Handle chatbot interactions using Ollama local LLM"""
    
    def __init__(self, model_name='gemma', ollama_url='http://localhost:11434'):
        self.model_name = model_name
        self.ollama_url = ollama_url
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self):
        """Build system prompt for disaster response assistance"""
        return """You are an offline disaster response assistant running locally on a device with no internet connection.
        
You help people during emergencies by providing:
- First aid guidance and medical advice
- Emergency evacuation procedures
- Shelter information
- Water and food safety tips
- Mental health support
- SOS message composition

Be clear, concise, and compassionate. Always prioritize life safety.
When the user asks for emergency services, provide nearby shelter/contact information if available."""
    
    def chat(self, user_message, category='general'):
        """Send message to Ollama and get response"""
        try:
            # Check if local Ollama is available
            response = requests.post(
                f'{self.ollama_url}/api/generate',
                json={
                    'model': self.model_name,
                    'prompt': f"{self.system_prompt}\n\nUser: {user_message}",
                    'stream': False,
                    'temperature': 0.7,
                },
                timeout=2
            )
            
            if response.status_code == 200:
                bot_response = response.json().get('response', '')
                self._save_chat_history(user_message, bot_response, category)
                return bot_response
            else:
                return self._fallback_response(user_message, category)
        
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.RequestException):
            return self._fallback_response(user_message, category)
    
    def _fallback_response(self, user_message, category):
        """Provide intelligent, context-aware emergency response when Ollama is unavailable"""
        msg_lower = user_message.lower()
        
        # 1. Search SQLite database first_aid_guides for matching terms
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                # Split user query into keywords
                words = [w for w in msg_lower.replace('?', '').replace('!', '').split() if len(w) > 3]
                
                for word in words:
                    cursor.execute('''
                        SELECT title, description, steps, precautions, materials 
                        FROM first_aid_guides 
                        WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(steps) LIKE ? OR LOWER(category) LIKE ?
                    ''', (f'%{word}%', f'%{word}%', f'%{word}%', f'%{word}%'))
                    guide = cursor.fetchone()
                    if guide:
                        guide_dict = dict(guide)
                        res = f"🩹 **EMERGENCY FIRST AID: {guide_dict['title'].upper()}**\n\n"
                        res += f"{guide_dict['description']}\n\n"
                        res += f"**Step-by-Step Instructions:**\n{guide_dict['steps']}\n\n"
                        if guide_dict.get('precautions'):
                            res += f"⚠️ **Precaution:** {guide_dict['precautions']}\n"
                        if guide_dict.get('materials'):
                            res += f"🧰 **Supplies needed:** {guide_dict['materials']}\n"
                        
                        self._save_chat_history(user_message, res, category)
                        return res
                
                # Check for shelter requests
                if any(k in msg_lower for k in ['shelter', 'refuge', 'stay', 'camp', 'place to sleep', 'evacuate to']):
                    cursor.execute('SELECT name, address, capacity, phone, supplies FROM shelter_locations LIMIT 3')
                    shelters = [dict(r) for r in cursor.fetchall()]
                    if shelters:
                        res = "🏠 **NEARBY EMERGENCY SHELTERS**:\n\n"
                        for s in shelters:
                            res += f"• **{s['name']}** ({s['address']})\n  - Capacity: {s['capacity']} beds | Phone: {s['phone']}\n  - Supplies: {s['supplies']}\n\n"
                        res += "Switch to the **Shelters** tab on the left menu for live map directions!"
                        self._save_chat_history(user_message, res, category)
                        return res
                
                # Check for contact requests
                if any(k in msg_lower for k in ['phone', 'contact', 'call', 'number', 'police', 'hospital', 'doctor', 'ambulance']):
                    cursor.execute('SELECT name, type, phone, description FROM emergency_contacts LIMIT 4')
                    contacts = [dict(r) for r in cursor.fetchall()]
                    if contacts:
                        res = "📞 **EMERGENCY DIRECTORY CONTACTS**:\n\n"
                        for c in contacts:
                            res += f"• **{c['name']}** ({c['type']}): `{c['phone']}` - {c['description']}\n"
                        res += "\nSwitch to the **Contacts** tab to dial directly with 1 tap."
                        self._save_chat_history(user_message, res, category)
                        return res
        except Exception as e:
            print(f"Error querying database for fallback: {e}")

        # 2. Rule-based emergency keyword matching fallback
        if any(k in msg_lower for k in ['bleed', 'blood', 'cut', 'wrist', 'wound', 'injury', 'hemorrhage', 'slash', 'puncture', 'stab']):
            res = (
                "🩸 **SEVERE BLEEDING CONTROL (WRIST / LIMB INJURY)**:\n\n"
                "1. **Apply Firm Direct Pressure**: Press clean sterile gauze, cloth, or your hands firmly directly over the bleeding wound on the wrist.\n"
                "2. **Elevate the Arm**: Raise the injured wrist above heart level to slow blood flow.\n"
                "3. **Apply Pressure Bandage**: Wrap cloth or bandage tightly over the dressing to hold continuous pressure.\n"
                "4. **Tourniquet (If Bleeding Profuse)**: If blood spurts or won't stop, bind a tight cloth/belt 2-3 inches ABOVE the wound (towards elbow). Tighten until bleeding stops.\n"
                "5. **Keep Calm & Warm**: Cover victim with jacket/blanket to prevent shock while awaiting emergency dispatch."
            )
            self._save_chat_history(user_message, res, category)
            return res

        if any(k in msg_lower for k in ['burn', 'fire', 'scald', 'skin']):
            res = (
                "🔥 **BURN FIRST AID**:\n\n"
                "1. **Cool Water**: Hold burn under cool running water for 10-15 minutes immediately.\n"
                "2. **Protect Wound**: Cover loosely with sterile non-stick bandage.\n"
                "3. **Do NOT**: Do NOT apply ice, butter, ointment, or pop blisters!"
            )
            self._save_chat_history(user_message, res, category)
            return res

        if any(k in msg_lower for k in ['cpr', 'breath', 'unconscious', 'pulse', 'heart', 'faint']):
            res = (
                "🚨 **CPR LIFE-SAVING INSTRUCTIONS**:\n\n"
                "1. Check responsiveness and breathing.\n"
                "2. Place hands in center of victim's chest.\n"
                "3. Push hard and fast (100-120 BPM) continuously.\n"
                "4. Provide 2 rescue breaths for every 30 compressions if trained."
            )
            self._save_chat_history(user_message, res, category)
            return res

        if any(k in msg_lower for k in ['fracture', 'broken', 'bone', 'sprain', 'arm', 'leg']):
            res = (
                "🦴 **BONE FRACTURE & SPRAIN**:\n\n"
                "1. Keep injured limb completely still.\n"
                "2. Apply rigid splint (cardboard, wood, folded magazine) bound with cloth.\n"
                "3. Do NOT attempt to realign or force bones back into place."
            )
            self._save_chat_history(user_message, res, category)
            return res

        if any(k in msg_lower for k in ['chok', 'swallow', 'airway']):
            res = (
                "😮‍💨 **CHOKING (HEIMLICH MANEUVER)**:\n\n"
                "1. Stand behind person, wrap arms around waist.\n"
                "2. Make a fist above navel, perform rapid inward and upward thrusts.\n"
                "3. Repeat until obstruction dislodges."
            )
            self._save_chat_history(user_message, res, category)
            return res

        default_response = (
            "⚠️ **OFFLINE DISASTER ASSISTANT**:\n"
            "If you or someone nearby is injured, describe the specific symptom (e.g. *bleeding wrist*, *burn*, *chest pain*, *broken bone*, *shelter request*).\n\n"
            "• For First Aid guides: View the **First Aid** tab.\n"
            "• For Nearby Refuge: View the **Shelters** tab.\n"
            "• For Emergency Phone Numbers: View the **Contacts** tab.\n"
            "• For Distress Transmission: Use the **SOS Beacon** button at top right."
        )
        self._save_chat_history(user_message, default_response, category)
        return default_response
    
    def _save_chat_history(self, user_msg, bot_msg, category):
        """Save conversation to database"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO chat_history (user_message, bot_response, category)
                    VALUES (?, ?, ?)
                ''', (user_msg, bot_msg, category))
                conn.commit()
        except Exception as e:
            print(f"Error saving chat history: {e}")
