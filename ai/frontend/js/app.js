/**
 * ResQ Disaster Response - Application Bootstrap & Navigation Manager
 */

class Application {
    constructor() {
        this.currentTab = 'chat';
        this.isDarkMode = false;
        this.userRole = 'student';

        this.chatView = null;
        this.disasterView = null;
        this.mapView = null;
        this.firstAidView = null;
        this.contactsView = null;
        this.sosView = null;
        this.studentView = null;
        this.teacherView = null;
        this.institutionView = null;

        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        console.log('🚀 Initializing ResQ Disaster Response System...');

        // Initialize Views
        this.chatView = new ChatView();
        window.chatView = this.chatView;

        this.disasterView = new DisasterView();
        window.disasterView = this.disasterView;

        this.mapView = new MapView();
        window.mapView = this.mapView;

        this.firstAidView = new FirstAidView();
        window.firstAidView = this.firstAidView;

        this.contactsView = new ContactsView();
        window.contactsView = this.contactsView;

        this.sosView = new SosView();
        window.sosView = this.sosView;

        this.studentView = new StudentView();
        window.studentView = this.studentView;

        this.teacherView = new TeacherView();
        window.teacherView = this.teacherView;

        this.institutionView = new InstitutionView();
        window.institutionView = this.institutionView;

        // Theme Initialization
        const savedTheme = window.localStorage.getItem('resq-theme') || 'light';
        this.isDarkMode = savedTheme === 'dark';
        this.applyTheme();

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        await this.initLogin();

        // Initial Data Load after login completed in login flow
        await Promise.all([
            this.firstAidView.loadGuides(),
            this.disasterView.loadDisasters(),
            this.contactsView.loadContacts(),
            this.sosView.init(),
            this.studentView.loadStudentData(),
            this.teacherView.loadTeacherData(),
            this.institutionView.loadInstitutionData()
        ]);

        // System Health Monitor
        this.monitorSystemHealth();
        setInterval(() => this.monitorSystemHealth(), 10000);
    }

    applyTheme() {
        document.body.classList.toggle('theme-dark', this.isDarkMode);
        document.body.classList.toggle('theme-light', !this.isDarkMode);
        window.localStorage.setItem('resq-theme', this.isDarkMode ? 'dark' : 'light');

        const themeBtnIcon = document.querySelector('#theme-toggle i');
        if (themeBtnIcon) {
            themeBtnIcon.classList.toggle('fa-sun', !this.isDarkMode);
            themeBtnIcon.classList.toggle('fa-moon', this.isDarkMode);
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
    }

    switchTab(tabId) {
        if (this.currentTab === tabId) return;
        this.currentTab = tabId;

        // Update Nav UI
        document.querySelectorAll('.app-nav .nav-item').forEach(item => {
            if (item.dataset.tab === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Tab Panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === `tab-${tabId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Special view triggers
        if (tabId === 'shelter') {
            setTimeout(() => {
                if (this.mapView) this.mapView.initMap();
            }, 100);
        }
    }

    setUserRole(role) {
        this.userRole = role;
        window.localStorage.setItem('resq-role', role);
        this.applyRole();
    }

    applyRole() {
        const roleVisibility = {
            student: ['chat', 'disasters', 'student', 'shelter', 'firstaid', 'contacts', 'sos'],
            teacher: ['chat', 'disasters', 'student', 'teacher', 'shelter', 'firstaid', 'contacts', 'sos'],
            institution: ['chat', 'disasters', 'teacher', 'institution', 'shelter', 'firstaid', 'contacts', 'sos']
        };

        const visibleTabs = roleVisibility[this.userRole] || roleVisibility.student;

        document.querySelectorAll('.app-nav .nav-item').forEach(item => {
            const tab = item.dataset.tab;
            item.style.display = visibleTabs.includes(tab) ? 'flex' : 'none';
        });

        if (!visibleTabs.includes(this.currentTab)) {
            const defaultTab = visibleTabs.includes('chat') ? 'chat' : visibleTabs[0];
            this.switchTab(defaultTab);
        }
    }

    async monitorSystemHealth() {
        const statusEl = document.getElementById('network-status');
        if (!statusEl) return;

        const health = await ApiService.checkHealth();
        const dot = statusEl.querySelector('.status-dot');
        const text = statusEl.querySelector('.status-text');

        if (health.status === 'healthy') {
            if (dot) dot.className = 'status-dot online';
            if (text) text.innerText = 'System Ready (Online)';
        } else {
            if (dot) dot.className = 'status-dot offline';
            if (text) text.innerText = 'Offline Mode Active';
        }
    }

    async initLogin() {
        const cachedUser = JSON.parse(window.localStorage.getItem('resq-user') || 'null');
        this.userRole = cachedUser?.role || 'student';
        this.userId = cachedUser?.id || null;
        this.userName = cachedUser?.name || 'Guest';

        const loginPage = document.getElementById('login-page');
        const roleButtons = document.querySelectorAll('.login-role-btn');
        const loginEmailInput = document.getElementById('login-email');
        const loginButton = document.getElementById('login-button');
        const guestButton = document.getElementById('guest-button');
        const loginCloseBtn = document.getElementById('login-close-btn');
        const loginStatus = document.getElementById('login-status');
        const userRoleDisplay = document.getElementById('user-role-display');
        const userNameDisplay = document.getElementById('user-name-display');

        const passwordInput = document.getElementById('login-password');

        const selectRole = async (role) => {
            roleButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.role === role));
            this.userRole = role;
        };

        return new Promise(async resolve => {
            let finished = false;
            const finish = () => {
                if (!finished) {
                    finished = true;
                    resolve();
                }
            };

            roleButtons.forEach(button => {
                button.addEventListener('click', () => selectRole(button.dataset.role));
            });

            if (!this.userId) {
                loginPage?.classList.remove('hidden');
                document.getElementById('main-app')?.classList.add('hidden');
                this.userRole = 'student';
                await selectRole(this.userRole);
            } else {
                loginPage?.classList.add('hidden');
                document.getElementById('main-app')?.classList.remove('hidden');
                userRoleDisplay.innerText = `${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)}`;
                userNameDisplay.innerText = this.userName;
                this.applyRole();
                const defaultTab = this.userRole === 'student' ? 'student' : this.userRole === 'teacher' ? 'teacher' : this.userRole === 'institution' ? 'institution' : 'chat';
                this.switchTab(defaultTab);
                finish();
            }

            loginButton.addEventListener('click', async () => {
                const email = loginEmailInput?.value.trim() || '';
                const passwordValue = passwordInput?.value.trim() || '';
                const activeRoleBtn = Array.from(roleButtons).find(btn => btn.classList.contains('active'));
                const selectedRole = activeRoleBtn?.dataset.role || this.userRole || 'student';

                if (!email || !passwordValue) {
                    window.alert('Please enter your email and password.');
                    return;
                }

                const loginResponse = await ApiService.loginUser(selectedRole, email, passwordValue);
                if (loginResponse.error) {
                    window.alert(`Login failed: ${loginResponse.error}`);
                    return;
                }

                const user = loginResponse.user;
                this.userId = user.id;
                this.userRole = loginResponse.role || this.userRole;
                this.userName = user.name || user.email || 'User';

                window.localStorage.setItem('resq-user', JSON.stringify({ id: this.userId, role: this.userRole, name: this.userName }));
                loginStatus.innerText = `Logged in successfully! Welcome, ${this.userName}.`;
                loginStatus.classList.add('success');
                loginCloseBtn.style.display = 'block';
                loginButton.disabled = true;
                loginButton.innerHTML = '<i class="fa-solid fa-check-circle"></i> Logged In';
                userRoleDisplay.innerText = `${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)}`;
                userNameDisplay.innerText = this.userName;
                this.applyRole();
                const defaultTab = this.userRole === 'student' ? 'student' : this.userRole === 'teacher' ? 'teacher' : this.userRole === 'institution' ? 'institution' : 'chat';
                this.switchTab(defaultTab);
                if (loginPage && document.getElementById('main-app')) {
                    loginPage.classList.add('hidden');
                    document.getElementById('main-app').classList.remove('hidden');
                }
                finish();
            });

            if (loginCloseBtn) {
                loginCloseBtn.addEventListener('click', () => {
                    loginPage?.classList.add('hidden');
                    document.getElementById('main-app')?.classList.remove('hidden');
                });
            }

            guestButton.addEventListener('click', () => {
                window.localStorage.removeItem('resq-user');
                this.userId = null;
                this.userRole = 'student';
                this.userName = 'Guest';
                loginPage?.classList.add('hidden');
                document.getElementById('main-app')?.classList.remove('hidden');
                userRoleDisplay.innerText = 'Guest';
                userNameDisplay.innerText = 'Demo Visitor';
                this.applyRole();
                this.switchTab('student');
                finish();
            });
        });
    }

    logout() {
        window.localStorage.removeItem('resq-user');
        window.location.reload();
    }
}

// Global App Singleton Instance
window.app = new Application();
