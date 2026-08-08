/**
 * ResQ Disaster Response - Portal Views for Student, Teacher, and Institution
 */

class StudentView {
    constructor() {
        this.readinessScore = 58;
        this.weakArea = 'Flood preparedness';
        this.nextPath = 'Complete Flood Preparedness → Flood Simulation → Assessment';
        this.experience = 0;
        this.rank = 0;
        this.assessments = [];
        this.progressRecords = [];

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.scoreEl = document.getElementById('student-readiness-score');
        this.weakAreaEl = document.getElementById('student-weak-area');
        this.nextPathEl = document.getElementById('student-next-path');
        this.xpScoreEl = document.getElementById('student-xp-score');
        this.rankEl = document.getElementById('student-rank');
        this.xpLevelEl = document.getElementById('student-level');
        this.xpProgressFillEl = document.getElementById('student-xp-progress-fill');
        this.xpNextMilestoneEl = document.getElementById('student-next-milestone');
        this.xpTotalEl = document.getElementById('student-total-xp');
        this.xpBonusEl = document.getElementById('student-xp-bonus');
        this.quizCompletionTextEl = document.getElementById('student-quiz-completion-text');
        this.quizCompletionFillEl = document.getElementById('student-quiz-completion-fill');
        this.xpBreakdownEl = document.getElementById('student-xp-breakdown');
        this.missionBoardEl = document.getElementById('student-mission-board');
        this.pathList = document.getElementById('student-learning-path');
        this.badgeList = document.getElementById('student-badges');
        this.planBtn = document.getElementById('student-plan-btn');
        this.refreshBtn = document.getElementById('student-refresh-btn');
        this.resetBtn = document.getElementById('student-reset-xp-btn');
    }

    bindEvents() {
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadStudentData());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetStudentExperience());
        }
        if (this.planBtn) {
            this.planBtn.addEventListener('click', () => this.showFamilyPlan());
        }
    }

    async loadStudentData() {
        let student = null;
        const appUser = window.app;

        if (appUser?.userRole === 'student' && appUser?.userId) {
            const response = await ApiService.getStudentById(appUser.userId);
            student = response.student;
        }

        if (!student) {
            const response = await ApiService.getStudents({ student_id: appUser?.userId });
            student = (response.students || [])[0];
        }

        if (!student) {
            const response = await ApiService.getStudents();
            student = (response.students || [])[0] || {
                name: 'Student A',
                readiness_score: this.readinessScore,
                weak_area: this.weakArea,
                experience: this.experience,
                email: '',
                phone: ''
            };
        }

        this.readinessScore = student.readiness_score || this.readinessScore;
        this.weakArea = student.weak_area || this.weakArea;
        this.nextPath = this.buildRecommendedPath(this.weakArea);
        this.experience = student.experience || 0;
        this.studentName = student.name;
        this.studentClass = student.class_name || 'Class';
        this.assessments = student.assessments || [];
        this.progressRecords = student.progress || [];

        this.renderSummary();
        this.renderXpProgress();
        this.renderXpBreakdown();
        this.renderQuizCompletion();
        this.renderLearningPath();
        this.renderBadges();
        this.renderAssessments(this.assessments);
        this.renderProgressRecords(this.progressRecords);
        await this.loadLeaderboard();
        this.renderMissionBoard();

        if (window.disasterView) {
            window.disasterView.renderDisasterList(window.disasterView.disasters);
        }
    }

    renderAssessments(assessments) {
        const target = document.getElementById('student-assessments');
        if (!target) return;
        if (assessments.length === 0) {
            target.innerHTML = '<div class="empty-card">No recent assessments found.</div>';
            return;
        }

        target.innerHTML = assessments.map(item => `
            <div class="assessment-card">
                <strong>${item.type || 'Assessment'}</strong>
                <span>${item.category || 'Preparedness'}</span>
                <div>${item.score != null ? item.score + '% score' : 'Not scored yet'}</div>
                <small>${item.date_taken ? new Date(item.date_taken).toLocaleDateString() : 'Date not available'}</small>
            </div>
        `).join('');
    }

    renderProgressRecords(progressRecords) {
        const target = document.getElementById('student-progress-records');
        if (!target) return;
        if (progressRecords.length === 0) {
            target.innerHTML = '<div class="empty-card">No progress records found.</div>';
            return;
        }

        target.innerHTML = progressRecords.map(record => `
            <div class="progress-card">
                <strong>${record.assignment_title || 'Assignment'}</strong>
                <span>${record.scenario_title || 'Scenario'}</span>
                <div>${record.status || 'Pending'} • ${record.score != null ? record.score + '%':''}</div>
                <small>${record.completed_at ? new Date(record.completed_at).toLocaleDateString() : 'Not completed yet'}</small>
            </div>
        `).join('');
    }

    buildRecommendedPath(area) {
        if (!area) return this.nextPath;
        const topic = area.replace(/\bpreparedness\b/i, '').trim();
        return `Complete ${topic} Preparedness → ${topic} Simulation → Assessment`;
    }

    renderSummary() {
        if (this.scoreEl) this.scoreEl.innerText = `${this.readinessScore}/100`;
        if (this.weakAreaEl) this.weakAreaEl.innerText = this.weakArea;
        if (this.nextPathEl) this.nextPathEl.innerText = this.nextPath;
        if (this.xpScoreEl) this.xpScoreEl.innerText = `${this.experience || 0} XP`;
        if (this.rankEl) this.rankEl.innerText = this.rank ? `#${this.rank}` : '#—';
    }

    getStudentLevel() {
        return Math.max(1, Math.floor((this.experience || 0) / 100) + 1);
    }

    getXpToNextLevel() {
        const level = this.getStudentLevel();
        const nextLevelXp = level * 100;
        return Math.max(0, nextLevelXp - (this.experience || 0));
    }

    getMissionBonusXP() {
        if (!this.assessments || !this.progressRecords) return 0;
        const completedRewards = [];
        const completedFloodQuiz = this.assessments.some(item => item.category?.toLowerCase().includes('flood') && item.type?.toLowerCase().includes('quiz'));
        const completedEarthquakeSimulation = this.progressRecords.some(item => item.scenario_title?.toLowerCase().includes('earthquake') && item.status?.toLowerCase() === 'completed');
        const planBuilt = this.progressRecords.some(item => item.assignment_title?.toLowerCase().includes('family') || item.scenario_title?.toLowerCase().includes('family'));

        if (completedFloodQuiz) completedRewards.push(80);
        if (completedEarthquakeSimulation) completedRewards.push(110);
        if (planBuilt) completedRewards.push(100);
        return completedRewards.reduce((sum, value) => sum + value, 0);
    }

    renderXpProgress() {
        const baseXp = this.experience || 0;
        const bonusXp = this.getMissionBonusXP();
        const totalXp = baseXp + bonusXp;
        const level = Math.max(1, Math.floor(totalXp / 100) + 1);
        const xpToNext = Math.max(0, level * 100 - totalXp);
        const progress = Math.min(100, Math.round((totalXp % 100) / 100 * 100));

        if (this.xpLevelEl) this.xpLevelEl.innerText = level;
        if (this.xpProgressFillEl) this.xpProgressFillEl.style.width = `${progress}%`;
        if (this.xpNextMilestoneEl) this.xpNextMilestoneEl.innerText = `${xpToNext} XP to next level`;
        if (this.xpTotalEl) this.xpTotalEl.innerText = `${totalXp} XP total`;
        if (this.xpBonusEl) this.xpBonusEl.innerText = bonusXp ? `+${bonusXp} XP earned from completed missions` : '';
        if (this.xpScoreEl) this.xpScoreEl.innerText = `${totalXp} XP`;
        this.renderXpBreakdown();
        this.renderQuizCompletion();
    }

    renderQuizCompletion() {
        const quizAssessments = this.assessments
            .filter(item => item.type?.toLowerCase() === 'quiz' && item.category)
            .map(item => item.category.toLowerCase());
        const completedSlugs = [...new Set(quizAssessments)];
        const completedCount = completedSlugs.length;
        const totalCount = this.getDisasterQuizCount();
        const completionFraction = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        if (this.quizCompletionTextEl) {
            this.quizCompletionTextEl.innerText = `${completedCount}/${totalCount} completed`;
        }
        if (this.quizCompletionFillEl) {
            this.quizCompletionFillEl.style.width = `${completionFraction}%`;
        }
    }

    getDisasterQuizCount() {
        if (!window.disasterView || !window.disasterView.disasters) return 0;
        return window.disasterView.disasters.length;
    }

    renderXpBreakdown() {
        if (!this.xpBreakdownEl) return;

        const baseXp = this.experience || 0;
        const bonusXp = this.getMissionBonusXP();
        const totalXp = baseXp + bonusXp;

        this.xpBreakdownEl.innerHTML = `
            <div class="xp-breakdown-card">
                <strong>Base XP</strong>
                <span>${baseXp} XP</span>
            </div>
            <div class="xp-breakdown-card">
                <strong>Mission Bonus</strong>
                <span>${bonusXp} XP</span>
            </div>
            <div class="xp-breakdown-card total">
                <strong>Total XP</strong>
                <span>${totalXp} XP</span>
            </div>
        `;
    }

    async resetStudentExperience() {
        if (!window.app?.userId) return;
        const confirmed = window.confirm('Reset your experience points to zero? This will clear your current XP total.');
        if (!confirmed) return;

        const response = await ApiService.resetStudentExperience(window.app.userId);
        if (response.error) {
            window.alert(`Unable to reset XP: ${response.error}`);
            return;
        }

        window.alert('Your experience points have been reset successfully.');
        await this.loadStudentData();
    }

    renderMissionBoard() {
        if (!this.missionBoardEl) return;

        const completedFloodQuiz = this.assessments.some(item => item.category?.toLowerCase() === 'flood' && item.type?.toLowerCase().includes('quiz'));
        const completedEarthquakeSimulation = this.progressRecords.some(item => item.scenario_title?.toLowerCase().includes('earthquake') && item.status?.toLowerCase() === 'completed');
        const planBuilt = this.progressRecords.some(item => item.assignment_title?.toLowerCase().includes('family') || item.scenario_title?.toLowerCase().includes('family'));

        const missions = [
            {
                title: 'Complete the Flood Safety Quiz',
                description: 'Take the short quiz to earn XP and improve your flood readiness.',
                reward: 80,
                status: completedFloodQuiz ? 'Completed' : 'Unlocked',
                progress: completedFloodQuiz ? 100 : (this.assessments.length ? 50 : 0)
            },
            {
                title: 'Finish Earthquake Simulation',
                description: 'Complete an earthquake drill scenario to unlock new preparedness skills.',
                reward: 110,
                status: completedEarthquakeSimulation ? 'Completed' : 'Unlocked',
                progress: completedEarthquakeSimulation ? 100 : 40
            },
            {
                title: 'Build a Family Plan',
                description: 'Set up your household emergency plan with meeting spots and contacts.',
                reward: 100,
                status: planBuilt ? 'Completed' : 'In Progress',
                progress: planBuilt ? 100 : 25
            }
        ];

        this.missionBoardEl.innerHTML = missions.map(mission => `
            <div class="mission-card ${mission.status.toLowerCase().replace(/\s+/g, '-')}">
                <div class="mission-details">
                    <strong>${mission.title}</strong>
                    <small>${mission.description}</small>
                </div>
                <div class="mission-meta">
                    <span class="mission-reward">+${mission.reward} XP</span>
                    <span class="mission-status ${mission.status.toLowerCase().replace(/\s+/g, '-')}">${mission.status}</span>
                </div>
                <div class="mission-progress">
                    <div class="mission-progress-fill" style="width: ${mission.progress}%"></div>
                </div>
            </div>
        `).join('');
    }

    renderLearningPath() {
        if (!this.pathList) return;

        const categories = [
            { title: 'Flood Preparedness Module', status: 'In Progress' },
            { title: 'Earthquake Simulation Lab', status: 'Completed' },
            { title: 'Fire Safety Practical', status: 'Pending' },
            { title: 'Family Preparedness Plan', status: 'Recommended' }
        ];

        this.pathList.innerHTML = categories.map(item => `
            <div class="progress-chip ${item.status.toLowerCase().replace(/\s+/g, '-')}">
                <strong>${item.title}</strong>
                <span>${item.status}</span>
            </div>
        `).join('');
    }

    renderBadges() {
        if (!this.badgeList) return;

        const badges = [
            { label: 'Quiz Master', value: 'Completed 3/4' },
            { label: 'Safety Champion', value: 'Earthquake Ready' },
            { label: 'Community Helper', value: 'Family Plan Assigned' }
        ];

        this.badgeList.innerHTML = badges.map(badge => `
            <div class="achievement-badge">
                <span>${badge.label}</span>
                <small>${badge.value}</small>
            </div>
        `).join('');
    }

    async loadLeaderboard() {
        const leaderboardEl = document.getElementById('student-leaderboard');
        if (!leaderboardEl) return;

        const response = await ApiService.getStudentLeaderboard();
        const ranking = response.leaderboard || [];
        if (ranking.length === 0) {
            leaderboardEl.innerHTML = '<div class="empty-card">Leaderboard is currently empty.</div>';
            this.rank = 0;
            this.renderSummary();
            return;
        }

        const currentUserIndex = ranking.findIndex(student => student.id === window.app.userId);
        this.rank = currentUserIndex >= 0 ? currentUserIndex + 1 : 0;
        this.renderSummary();

        leaderboardEl.innerHTML = ranking.map((student, index) => `
            <div class="leaderboard-card ${student.id === window.app.userId ? 'current-user' : ''}">
                <div>
                    <strong>${index + 1}. ${student.name}</strong>
                    <small>${student.class_name || ''}</small>
                </div>
                <div>
                    <span>${student.experience || 0} XP</span>
                    <small>${student.readiness_score || 0}%</small>
                </div>
            </div>
        `).join('');
    }

    showFamilyPlan() {
        window.alert('Family preparedness plan builder is a future enhancement. For now, document meeting points, contacts, kit items, and evacuation routes in your local notebook.');
    }
}

class TeacherView {
    constructor() {
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.classCountEl = document.getElementById('teacher-class-count');
        this.avgReadinessEl = document.getElementById('teacher-average-readiness');
        this.weaknessEl = document.getElementById('teacher-common-weakness');
        this.assignmentList = document.getElementById('teacher-assignments');
        this.studentStatusList = document.getElementById('teacher-student-status');
        this.assignBtn = document.getElementById('teacher-assign-btn');
        this.resetAllBtn = document.getElementById('teacher-reset-all-xp-btn');
        this.addQuizBtn = document.getElementById('teacher-add-quiz-btn');
        this.quizBuilderEl = document.getElementById('teacher-quiz-builder');
        this.refreshBtn = document.getElementById('teacher-refresh-btn');
        this.teacherDisasters = [];
    }

    bindEvents() {
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadTeacherData());
        }
        if (this.assignBtn) {
            this.assignBtn.addEventListener('click', () => this.createAssignment());
        }
        if (this.resetAllBtn) {
            this.resetAllBtn.addEventListener('click', () => this.resetAllExperience());
        }
        if (this.addQuizBtn) {
            this.addQuizBtn.addEventListener('click', () => this.toggleQuizBuilder());
        }
    }

    async loadTeacherData() {
        const appUser = window.app;
        let teacher = null;
        let assignments = [];
        let students = [];

        if (appUser?.userRole === 'teacher' && appUser?.userId) {
            const response = await ApiService.getTeacherById(appUser.userId);
            teacher = response.teacher;
        }

        if (!teacher) {
            const teachersResponse = await ApiService.getTeachers();
            const teachers = teachersResponse.teachers || [];
            teacher = teachers[0] || { name: 'Ms. Mentor', classes: [] };
        }

        if (teacher?.assignments) {
            assignments = teacher.assignments;
        } else {
            const assignmentsResponse = await ApiService.getTeacherAssignments();
            assignments = assignmentsResponse.assignments || [];
        }

        if (teacher?.classes?.length) {
            const classIds = teacher.classes.map(cls => cls.id);
            const studentResponses = await Promise.all(classIds.map(classId => ApiService.getStudents({ class_id: classId })));
            students = studentResponses.flatMap(result => result.students || []);
        } else {
            const studentsResponse = await ApiService.getStudents();
            students = studentsResponse.students || [];
        }

        const classCount = teacher?.classes?.length || new Set(assignments.map(a => a.class_name)).size || 2;
        const readinessScores = students.map(s => s.readiness_score || 0);
        const avgReadiness = readinessScores.length ? Math.round(readinessScores.reduce((sum, value) => sum + value, 0) / readinessScores.length) : 0;
        const weakTopic = this.findCommonWeakness(students) || 'Evacuation readiness';

        if (this.classCountEl) this.classCountEl.innerText = classCount;
        if (this.avgReadinessEl) this.avgReadinessEl.innerText = `${avgReadiness}%`;
        if (this.weaknessEl) this.weaknessEl.innerText = weakTopic;

        this.teacherDisasters = await this.fetchDisasterModules();
        this.renderAssignments(assignments);
        this.renderStudentStatus(students);
        this.renderQuizBuilder();
    }

    async resetAllExperience() {
        const confirmed = window.confirm('Reset experience points for all students? This will set all XP totals to zero.');
        if (!confirmed) return;

        const response = await ApiService.resetAllStudentExperience();
        if (response.error) {
            window.alert(`Unable to reset all XP: ${response.error}`);
            return;
        }

        window.alert('All student experience has been reset to zero.');
        this.loadTeacherData();
    }

    findCommonWeakness(students) {
        const groups = students.reduce((acc, student) => {
            if (student.weak_area) {
                const area = student.weak_area.toLowerCase();
                acc[area] = (acc[area] || 0) + 1;
            }
            return acc;
        }, {});
        const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
        return sorted.length ? sorted[0][0].replace(/\b(\w)/g, c => c.toUpperCase()) : null;
    }

    renderAssignments(assignments) {
        if (!this.assignmentList) return;
        if (assignments.length === 0) {
            this.assignmentList.innerHTML = '<div class="empty-card">No assignments available yet.</div>';
            return;
        }

        this.assignmentList.innerHTML = assignments.map(item => `
            <div class="assignment-card">
                <strong>${item.title}</strong>
                <p>${item.instructions || 'No instructions provided.'}</p>
                <div class="assignment-meta">
                    <span>${item.class_name || 'Class'} • ${item.scenario_title || 'Scenario'}</span>
                    <span>${item.due_date || 'No due date'}</span>
                </div>
            </div>
        `).join('');
    }

    renderStudentStatus(students) {
        if (!this.studentStatusList) return;
        if (students.length === 0) {
            this.studentStatusList.innerHTML = '<div class="empty-card">No student records available yet.</div>';
            return;
        }

        this.studentStatusList.innerHTML = students.slice(0, 6).map(student => `
            <div class="student-status-card">
                <div>
                    <strong>${student.name}</strong>
                    <span>${student.class_name || 'Class'}</span>
                </div>
                <div>
                    <span>${student.readiness_score || 0}%</span>
                    <small>${student.weak_area || 'No weak area'}</small>
                </div>
            </div>
        `).join('');
    }

    async fetchDisasterModules() {
        try {
            const response = await ApiService.getDisasters();
            return response.disasters || [];
        } catch (err) {
            return [];
        }
    }

    toggleQuizBuilder() {
        if (!this.quizBuilderEl) return;
        if (this.quizBuilderEl.innerHTML.trim() && !this.quizBuilderEl.classList.contains('collapsed')) {
            this.quizBuilderEl.classList.add('collapsed');
            this.quizBuilderEl.innerHTML = '<p class="text-muted">Quiz builder hidden. Click New Quiz to open the editor.</p>';
            return;
        }
        this.quizBuilderEl.classList.remove('collapsed');
        this.renderQuizBuilder();
    }

    renderQuizBuilder() {
        if (!this.quizBuilderEl) return;

        const disasterOptions = this.teacherDisasters.map(disaster => `
            <option value="${disaster.slug}">${disaster.title}</option>
        `).join('');

        this.quizBuilderEl.innerHTML = `
            <div class="quiz-builder-form">
                <label for="teacher-quiz-disaster">Disaster Module</label>
                <select id="teacher-quiz-disaster">
                    <option value="">Select module</option>
                    ${disasterOptions}
                </select>
                <label for="teacher-quiz-title">Quiz Title</label>
                <input id="teacher-quiz-title" type="text" placeholder="Enter quiz title">
                <label for="teacher-quiz-description">Description</label>
                <textarea id="teacher-quiz-description" placeholder="Describe the quiz objectives"></textarea>
                ${Array.from({ length: 3 }, (_, index) => `
                    <div class="quiz-builder-question">
                        <h4>Question ${index + 1}</h4>
                        <input id="teacher-quiz-question-${index}" type="text" placeholder="Question text">
                        ${['A','B','C','D'].map(letter => `
                            <input id="teacher-quiz-question-${index}-option-${letter}" type="text" placeholder="Option ${letter}">
                        `).join('')}
                        <label for="teacher-quiz-answer-${index}">Correct answer</label>
                        <select id="teacher-quiz-answer-${index}">
                            <option value="">Select correct option</option>
                            ${['A','B','C','D'].map(letter => `<option value="${letter}">${letter}</option>`).join('')}
                        </select>
                    </div>
                `).join('')}
                <button class="action-btn small" id="teacher-quiz-submit-btn"><i class="fa-solid fa-check"></i> Save Quiz</button>
            </div>
        `;

        const submitBtn = document.getElementById('teacher-quiz-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', event => this.submitQuiz(event));
        }
    }

    async submitQuiz(event) {
        event.preventDefault();
        if (!this.quizBuilderEl) return;

        const disasterSlug = document.getElementById('teacher-quiz-disaster')?.value;
        const title = document.getElementById('teacher-quiz-title')?.value.trim();
        const description = document.getElementById('teacher-quiz-description')?.value.trim();

        if (!disasterSlug || !title) {
            window.alert('Please select a disaster module and enter a quiz title.');
            return;
        }

        const questions = [];
        for (let index = 0; index < 3; index += 1) {
            const questionText = document.getElementById(`teacher-quiz-question-${index}`)?.value.trim();
            if (!questionText) continue;

            const options = ['A', 'B', 'C', 'D'].map(letter => document.getElementById(`teacher-quiz-question-${index}-option-${letter}`)?.value.trim() || '');
            const answerLetter = document.getElementById(`teacher-quiz-answer-${index}`)?.value;
            const answerIndex = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
            if (!options.every(opt => opt) || answerIndex < 0) {
                window.alert('Please fill in all option fields and select the correct answer for every question you add.');
                return;
            }

            questions.push({
                question: questionText,
                options,
                answer: options[answerIndex]
            });
        }

        if (questions.length === 0) {
            window.alert('Add at least one question to create a quiz.');
            return;
        }

        const quizPayload = {
            title,
            description,
            questions,
            teacher_id: window.app?.userId || null
        };

        const response = await ApiService.createDisasterQuiz(disasterSlug, quizPayload);
        if (response.error) {
            window.alert(`Failed to create quiz: ${response.error}`);
            return;
        }

        window.alert('Quiz created successfully. Students can now take this module quiz.');
        this.quizBuilderEl.innerHTML = '<p class="text-muted">Quiz saved. Use the same button to add another quiz.</p>';
    }

    createAssignment() {
        window.alert('Teacher assignment creation is planned for the next release. Use the backend teacher portal to define assignments and simulations.');
    }
}

class InstitutionView {
    constructor() {
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.scoreEl = document.getElementById('institution-score');
        this.studentCountEl = document.getElementById('institution-student-count');
        this.participationEl = document.getElementById('institution-participation');
        this.departmentList = document.getElementById('institution-departments');
        this.reportList = document.getElementById('institution-reports');
        this.leaderboardList = document.getElementById('institution-leaderboard');
        this.refreshBtn = document.getElementById('institution-refresh-btn');
    }

    bindEvents() {
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadInstitutionData());
        }
    }

    async loadInstitutionData() {
        const appUser = window.app;
        let institution = null;
        let classes = [];
        let students = [];

        if (appUser?.userRole === 'institution' && appUser?.userId) {
            const response = await ApiService.getInstitutionById(appUser.userId);
            institution = response.institution;
        }

        if (!institution) {
            const institutionsResponse = await ApiService.getInstitutions();
            institution = (institutionsResponse.institutions || [])[0] || {
                name: 'New Delhi Disaster Preparedness Academy',
                readiness_score: 83,
                participation_rate: 0.84
            };
        }

        if (institution?.id) {
            const classesResponse = await ApiService.getClasses();
            classes = (classesResponse.classes || []).filter(c => c.institution_name === institution.name);
            students = (await ApiService.getStudents({ institution_id: institution.id })).students || [];
        } else {
            const classesResponse = await ApiService.getClasses();
            classes = classesResponse.classes || [];
            const studentsResponse = await ApiService.getStudents();
            students = studentsResponse.students || [];
        }

        const studentCount = students.length || 120;
        const participation = Math.round((institution.participation_rate || 0.84) * 100);

        this.renderSummary(institution, studentCount, participation);
        this.renderDepartments(classes);
        this.renderReports(institution);
        this.renderLeaderboard([institution]);
    }

    renderSummary(institution, studentCount, participation) {
        if (this.scoreEl) this.scoreEl.innerText = `${institution.readiness_score || 83}/100`;
        if (this.studentCountEl) this.studentCountEl.innerText = studentCount;
        if (this.participationEl) this.participationEl.innerText = `${participation}%`;
    }

    renderDepartments(classes) {
        if (!this.departmentList) return;
        if (classes.length === 0) {
            this.departmentList.innerHTML = '<div class="empty-card">No department readiness data available.</div>';
            return;
        }

        const groups = classes.reduce((acc, cls) => {
            const key = cls.department || 'General';
            if (!acc[key]) acc[key] = [];
            acc[key].push(cls.readiness_score || 0);
            return acc;
        }, {});

        this.departmentList.innerHTML = Object.entries(groups).map(([department, scores]) => {
            const avg = scores.length ? Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length) : 0;
            return `
                <div class="department-card">
                    <strong>${department}</strong>
                    <span>${avg}%</span>
                </div>
            `;
        }).join('');
    }

    renderReports(institution) {
        if (!this.reportList) return;
        const recommendations = [
            'Increase flood simulation drills for incoming students.',
            'Add family preparedness mission to classroom activities.',
            'Run an institution-wide evacuation challenge next month.'
        ];

        this.reportList.innerHTML = recommendations.map(text => `
            <div class="report-card">
                <p>${text}</p>
            </div>
        `).join('');
    }

    renderLeaderboard(institutions) {
        if (!this.leaderboardList) return;

        const leaderboard = institutions.slice(0, 4).map((institution, index) => ({
            name: institution.name,
            score: institution.readiness_score || 80,
            rank: index + 1
        }));

        this.leaderboardList.innerHTML = leaderboard.map(item => `
            <div class="leaderboard-card">
                <span>${item.rank}. ${item.name}</span>
                <strong>${item.score}%</strong>
            </div>
        `).join('');
    }
}

window.StudentView = StudentView;
window.TeacherView = TeacherView;
window.InstitutionView = InstitutionView;
