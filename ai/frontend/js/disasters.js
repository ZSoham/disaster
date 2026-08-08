/**
 * ResQ Disaster Response - Disaster Library & Scenario Browser
 * Loads disaster modules, scenario summaries, and detail views.
 */

class DisasterView {
    constructor() {
        this.disasters = [];
        this.selectedDisaster = null;
        this.selectedScenario = null;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.searchInput = document.getElementById('disaster-search');
        this.listContainer = document.getElementById('disaster-list');
        this.countBadge = document.getElementById('disaster-count');
        this.detailTitle = document.getElementById('disaster-detail-title');
        this.detailSubtitle = document.getElementById('disaster-detail-subtitle');
        this.detailTags = document.getElementById('disaster-detail-tags');
        this.detailSummary = document.getElementById('detail-summary');
        this.detailBefore = document.getElementById('detail-before');
        this.detailDuring = document.getElementById('detail-during');
        this.detailAfter = document.getElementById('detail-after');
        this.detailSources = document.getElementById('detail-sources');
        this.quizPanel = document.getElementById('disaster-quiz-panel');
        this.scenarioList = document.getElementById('scenario-list');
        this.scenarioDetailContent = document.getElementById('scenario-detail-content');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterDisasters());
        }
    }

    async loadDisasters() {
        const response = await ApiService.getDisasters();
        this.disasters = response.disasters || [];
        this.renderDisasterList(this.disasters);
        this.updateCount();

        if (window.app?.studentView) {
            window.app.studentView.renderQuizCompletion();
        }

        if (this.disasters.length > 0) {
            this.selectDisaster(this.disasters[0].slug);
        }
    }

    updateCount() {
        if (this.countBadge) {
            this.countBadge.innerText = `${this.disasters.length} modules`;
        }
    }

    filterDisasters() {
        const query = (this.searchInput ? this.searchInput.value.trim().toLowerCase() : '');
        const filtered = this.disasters.filter(item => {
            return item.title.toLowerCase().includes(query) ||
                (item.category && item.category.toLowerCase().includes(query)) ||
                (item.summary && item.summary.toLowerCase().includes(query)) ||
                (item.hazard_types && item.hazard_types.toLowerCase().includes(query));
        });
        this.renderDisasterList(filtered);
    }

    renderDisasterList(disasters) {
        if (!this.listContainer) return;
        this.listContainer.innerHTML = '';

        const completedSlugs = new Set(this.getCompletedQuizSlugs());

        if (disasters.length === 0) {
            this.listContainer.innerHTML = `<div class="empty-card">No disaster modules match your search.</div>`;
            return;
        }

        disasters.forEach(disaster => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'disaster-module-card';
            card.dataset.slug = disaster.slug;
            card.addEventListener('click', () => this.selectDisaster(disaster.slug));

            const hazardTags = (disaster.hazard_types || '').split(',').slice(0, 3).map(type => `<span class="module-tag">${this.escapeHTML(type.trim())}</span>`).join('');
            const completedBadge = completedSlugs.has(disaster.slug) ? `<span class="module-status completed">Quiz Completed</span>` : '';

            card.innerHTML = `
                <div class="module-top-row">
                    <div>
                        <h4>${this.escapeHTML(disaster.title)}</h4>
                        <p>${this.escapeHTML(disaster.summary || '')}</p>
                    </div>
                    <span class="module-pill">${this.escapeHTML(disaster.category)}</span>
                </div>
                <div class="module-meta-row">
                    <div class="module-tags">${hazardTags}</div>
                    <div class="module-action">${completedBadge} View</div>
                </div>
            `;

            this.listContainer.appendChild(card);
        });
    }

    async selectDisaster(slug) {
        if (!slug) return;
        const response = await ApiService.getDisaster(slug);
        const disaster = response.disaster;
        if (!disaster) {
            this.showDisasterError();
            return;
        }

        this.selectedDisaster = disaster;
        this.selectedScenario = null;

        this.detailTitle.innerText = disaster.title;
        this.detailSubtitle.innerText = `Category: ${disaster.category} • Hazards: ${disaster.hazard_types || 'Multi-hazard'}`;
        this.detailTags.innerHTML = this.renderTags(disaster.hazard_types);
        this.detailSummary.innerText = disaster.summary || 'No summary is available.';
        this.detailBefore.innerText = disaster.before_summary || 'Preparation guidance not available yet.';
        this.detailDuring.innerText = disaster.during_summary || 'Response guidance not available yet.';
        this.detailAfter.innerText = disaster.after_summary || 'Recovery guidance not available yet.';
        this.detailSources.innerText = disaster.sources || 'Sources not available.';

        this.renderScenarios(disaster.scenarios || []);
        this.clearScenarioDetail();
        this.renderQuizCTA();
        this.markSelectedDisaster(slug);
    }

    renderTags(hazardTypes) {
        if (!hazardTypes) return '';
        return hazardTypes.split(',').map(type => `<span class="detail-tag">${this.escapeHTML(type.trim())}</span>`).join('');
    }

    markSelectedDisaster(slug) {
        document.querySelectorAll('.disaster-module-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.slug === slug);
        });
    }

    renderScenarios(scenarios) {
        if (!this.scenarioList) return;
        this.scenarioList.innerHTML = '';

        if (scenarios.length === 0) {
            this.scenarioList.innerHTML = `<div class="empty-card">No scenarios are available for this module yet.</div>`;
            return;
        }

        scenarios.forEach(scenario => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'scenario-card';
            card.dataset.slug = scenario.slug;
            card.addEventListener('click', () => this.selectScenario(scenario.slug));

            card.innerHTML = `
                <div>
                    <h4>${this.escapeHTML(scenario.title)}</h4>
                    <p>${this.escapeHTML(scenario.description || '')}</p>
                </div>
                <div class="scenario-meta">
                    <span>${this.escapeHTML(scenario.difficulty || 'medium')}</span>
                    <span>${this.escapeHTML(scenario.location || 'unknown')}</span>
                </div>
            `;

            this.scenarioList.appendChild(card);
        });
    }

    async selectScenario(slug) {
        if (!slug) return;

        const response = await ApiService.getScenario(slug);
        const scenario = response.scenario;
        if (!scenario) {
            this.showScenarioError();
            return;
        }

        this.selectedScenario = scenario;
        this.markSelectedScenario(slug);
        this.renderScenarioDetail(scenario);
    }

    markSelectedScenario(slug) {
        document.querySelectorAll('.scenario-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.slug === slug);
        });
    }

    renderScenarioDetail(scenario) {
        if (!this.scenarioDetailContent) return;

        const stageHtml = scenario.stages.map(stage => {
            const decisionHtml = stage.decisions.map(decision => `
                <li><strong>${this.escapeHTML(decision.option_key)}.</strong> ${this.escapeHTML(decision.text)} <span class="tiny-badge ${decision.is_safe ? 'badge-success' : 'badge-warning'}">${decision.is_safe ? 'Safe' : 'Risk'}</span></li>
            `).join('');

            return `
                <div class="scenario-stage-card">
                    <h5>${this.escapeHTML(stage.title)}</h5>
                    <p>${this.escapeHTML(stage.description || '')}</p>
                    <div class="scenario-stage-meta">Time limit: ${stage.time_limit || 0}s</div>
                    <ul class="scenario-decisions-list">${decisionHtml}</ul>
                </div>
            `;
        }).join('');

        this.scenarioDetailContent.innerHTML = `
            <div class="scenario-detail-header">
                <div>
                    <h5>${this.escapeHTML(scenario.title)}</h5>
                    <p>${this.escapeHTML(scenario.description || '')}</p>
                </div>
                <div class="scenario-score-pill">Difficulty: ${this.escapeHTML(scenario.difficulty || 'medium')}</div>
            </div>
            <div class="scenario-quick-meta">
                <span>Role: ${this.escapeHTML(scenario.role || 'citizen')}</span>
                <span>Location: ${this.escapeHTML(scenario.location || 'unknown')}</span>
                <span>Duration: ${scenario.duration || 0}s</span>
            </div>
            <div class="scenario-stage-list">${stageHtml}</div>
            <div class="scenario-guidance-banner">
                <strong>Tip:</strong> Choose safe decisions early to preserve time and safety score. Incorrect choices create consequence paths that change later stages.
            </div>
        `;
    }

    clearScenarioDetail() {
        if (!this.scenarioDetailContent) return;
        this.scenarioDetailContent.innerHTML = `<p>Select a scenario to view its stages, decisions, and scoring guidance.</p>`;
    }

    showDisasterError() {
        if (this.detailSummary) {
            this.detailSummary.innerText = 'Unable to load disaster module details at this time.';
        }
    }

    showScenarioError() {
        if (this.scenarioDetailContent) {
            this.scenarioDetailContent.innerHTML = '<div class="empty-card">Unable to load scenario details at this time.</div>';
        }
    }

    async renderQuizCTA() {
        if (!this.quizPanel || !this.selectedDisaster) return;

        const completedSlugs = new Set(this.getCompletedQuizSlugs());
        const isCompleted = completedSlugs.has(this.selectedDisaster.slug);

        this.quizPanel.innerHTML = `
            <div class="quiz-cta-card exam-mode">
                <h4>Module Exam</h4>
                <p>${isCompleted ? 'This exam has been completed. You may retake it to improve your score.' : 'This is a timed exam for the disaster module. Answer all questions carefully before submitting.'}</p>
                <ul class="exam-rules-list">
                    <li>One attempt per session.</li>
                    <li>All questions are mandatory.</li>
                    <li>Do not refresh the page during the exam.</li>
                </ul>
                <button type="button" class="action-btn" id="start-disaster-quiz-btn">${isCompleted ? 'Retake Exam' : 'Start Exam'}</button>
                ${isCompleted ? '<span class="completed-quiz-note">Completed Exam</span>' : ''}
            </div>
        `;

        const startBtn = document.getElementById('start-disaster-quiz-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startDisasterQuiz());
        }
    }

    async startDisasterQuiz() {
        if (!this.selectedDisaster) return;
        if (!window.app?.userId) {
            window.alert('Login as a student to take the quiz.');
            return;
        }

        const response = await ApiService.getDisasterQuiz(this.selectedDisaster.slug);
        const quiz = response.quiz;
        if (!quiz || !quiz.questions?.length) {
            this.quizPanel.innerHTML = '<div class="empty-card">Quiz is not available for this module yet.</div>';
            return;
        }

        this.currentQuiz = quiz;
        this.renderExamIntro(quiz);
    }

    async submitDisasterQuiz(event, quiz) {
        event.preventDefault();
        if (!window.app?.userId) return;

        this.clearExamTimer();

        const answers = quiz.questions.map((question, index) => {
            const input = document.querySelector(`input[name="question-${index}"]:checked`);
            return input ? input.value : null;
        });

        const correct = quiz.questions.map(question => question.answer);
        const score = answers.reduce((sum, answer, index) => {
            return sum + (answer === correct[index] ? 1 : 0);
        }, 0);

        const xpAwarded = score * 40 + 40;
        const category = this.selectedDisaster.slug || 'preparedness';

        const assessment = {
            type: 'quiz',
            category: category,
            score: Math.round((score / quiz.questions.length) * 100),
            details: JSON.stringify({ answers, correctAnswers: correct, timeRemaining: this.examRemainingSeconds }),
            xp_awarded: xpAwarded
        };

        const result = await ApiService.submitStudentAssessment(window.app.userId, assessment);
        if (result.error) {
            window.alert(`Unable to save quiz result: ${result.error}`);
            return;
        }

        this.quizPanel.innerHTML = `
            <div class="quiz-result-card exam-result-card">
                <h4>Exam Completed</h4>
                <p>You answered ${score} out of ${quiz.questions.length} correctly.</p>
                <p><strong>Score:</strong> ${Math.round((score / quiz.questions.length) * 100)}%</p>
                <p><strong>XP Earned:</strong> ${xpAwarded} XP</p>
                <p><strong>Time Remaining:</strong> ${this.formatTime(this.examRemainingSeconds)}</p>
                <button type="button" class="action-btn" id="view-student-dashboard-btn">View Dashboard</button>
            </div>
        `;

        const dashboardBtn = document.getElementById('view-student-dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => window.app.switchTab('student'));
        }

        if (window.app?.studentView) {
            window.app.studentView.loadStudentData();
        }
    }

    renderExamIntro(quiz) {
        if (!this.quizPanel) return;

        this.quizPanel.innerHTML = `
            <div class="exam-intro-card">
                <h4>${this.escapeHTML(quiz.title)}</h4>
                <p>${this.escapeHTML(quiz.description)}</p>
                <div class="exam-details">
                    <span><strong>Questions:</strong> ${quiz.questions.length}</span>
                    <span><strong>Time Limit:</strong> ${Math.max(quiz.questions.length * 60, 180)} seconds</span>
                    <span><strong>Instructions:</strong> Answer every question. Do not refresh the page.</span>
                </div>
                <button type="button" class="action-btn" id="begin-disaster-exam-btn">Begin Exam</button>
            </div>
        `;

        const beginBtn = document.getElementById('begin-disaster-exam-btn');
        if (beginBtn) {
            beginBtn.addEventListener('click', () => this.beginDisasterExam(quiz));
        }
    }

    beginDisasterExam(quiz) {
        if (!this.quizPanel) return;

        this.examRemainingSeconds = Math.max(quiz.questions.length * 60, 180);
        this.currentQuiz = quiz;
        this.startExamTimer();

        this.quizPanel.innerHTML = `
            <div class="quiz-card exam-card">
                <div class="exam-header">
                    <h4>${this.escapeHTML(quiz.title)}</h4>
                    <div class="exam-timer" id="exam-time-remaining">${this.formatTime(this.examRemainingSeconds)}</div>
                </div>
                <div class="exam-rules-banner">Complete all questions and submit before the timer expires.</div>
                <form id="disaster-quiz-form" class="quiz-form exam-form">
                    ${quiz.questions.map((question, index) => `
                        <div class="quiz-question-card exam-question-card">
                            <div class="quiz-question"><strong>Q${index + 1}.</strong> ${this.escapeHTML(question.question)}</div>
                            <div class="quiz-options">
                                ${question.options.map(option => `
                                    <label class="quiz-option exam-option">
                                        <input type="radio" name="question-${index}" value="${this.escapeHTML(option)}">
                                        <span>${this.escapeHTML(option)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    <button type="submit" class="action-btn">Submit Exam</button>
                </form>
            </div>
        `;

        const quizForm = document.getElementById('disaster-quiz-form');
        if (quizForm) {
            quizForm.addEventListener('submit', event => this.submitDisasterQuiz(event, quiz));
        }
    }

    startExamTimer() {
        this.clearExamTimer();
        this.examTimerId = setInterval(() => {
            this.examRemainingSeconds -= 1;
            const timerEl = document.getElementById('exam-time-remaining');
            if (timerEl) timerEl.innerText = this.formatTime(this.examRemainingSeconds);
            if (this.examRemainingSeconds <= 0) {
                this.clearExamTimer();
                window.alert('Time is up. The exam will now be submitted automatically.');
                const quiz = this.currentQuiz;
                if (quiz) {
                    const event = new Event('submit', { cancelable: true });
                    const form = document.getElementById('disaster-quiz-form');
                    if (form) {
                        form.dispatchEvent(event);
                    }
                }
            }
        }, 1000);
    }

    clearExamTimer() {
        if (this.examTimerId) {
            clearInterval(this.examTimerId);
            this.examTimerId = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.max(0, seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    getCompletedQuizSlugs() {
        const studentView = window.app?.studentView;
        if (!studentView || !studentView.assessments) return [];
        return studentView.assessments
            .filter(item => item.type?.toLowerCase() === 'quiz' && item.category)
            .map(item => item.category.toLowerCase());
    }

    escapeHTML(str) {
        return (str || '').replace(/[&<>'"]/g,
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
}

window.DisasterView = DisasterView;
