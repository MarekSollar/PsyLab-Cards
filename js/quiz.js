const Quiz = {
    data: [],
    history: [],
    currentQuestions: [],
    currentIndex: 0,
    userAnswers: [],
    active: false,
    selected: new Set(),
    filter: 'all',
    
    init: function() {
        this.data = Storage.getQuiz();
        this.history = Storage.getQuizHistory();
        this.renderUI();
        
        Events.on('quizChanged', () => {
            this.renderUI();
        });
        
        Events.on('categoriesChanged', () => {
            this.renderUI();
        });
    },
    
    renderUI: function() {
        this.updateStats();
        this.renderList();
    },
    
    updateStats: function() {
        const total = this.data.length;
        const completed = this.history.length;
        
        const avg = this.history.length > 0 
            ? Math.round(this.history.reduce((sum, q) => sum + (q.score / q.total * 100), 0) / this.history.length) 
            : 0;
        
        const best = this.history.length > 0
            ? Math.max(...this.history.map(q => (q.score / q.total * 100)))
            : 0;
        
        document.getElementById('quizTotalQuestions').innerText = total;
        document.getElementById('quizCompletedCount').innerText = completed;
        document.getElementById('quizAverageScore').innerText = avg + '%';
        document.getElementById('quizBestScore').innerText = Math.round(best) + '%';
        
        if (total === 0) {
            document.getElementById('quizEmptyState').classList.remove('hidden');
            document.getElementById('quizActiveArea').classList.add('hidden');
            document.getElementById('quizStatsSection').classList.add('hidden');
        } else {
            document.getElementById('quizEmptyState').classList.add('hidden');
            document.getElementById('quizStatsSection').classList.remove('hidden');
        }
    },
    
    startNew: function() {
        const category = document.getElementById('quizCategoryFilter').value;
        const countOption = document.getElementById('quizQuestionCount').value;
        
        let available = this.data.filter(q => {
            if (category !== 'all' && q.kategorie !== category) return false;
            return true;
        });
        
        if (available.length === 0) {
            UI.showToast('Žádné otázky k dispozici', 'error');
            return;
        }
        
        let questionCount = countOption === 'all' ? available.length : parseInt(countOption);
        questionCount = Math.min(questionCount, available.length);
        
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        this.currentQuestions = shuffled.slice(0, questionCount);
        
        this.userAnswers = new Array(this.currentQuestions.length).fill(null);
        this.currentIndex = 0;
        this.active = true;
        
        document.getElementById('quizEmptyState').classList.add('hidden');
        document.getElementById('quizResultsArea').classList.add('hidden');
        document.getElementById('quizActiveArea').classList.remove('hidden');
        
        this.renderQuestion();
    },
    
    shuffle: function() {
        if (this.currentQuestions.length === 0) return;
        
        for (let i = this.currentQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentQuestions[i], this.currentQuestions[j]] = [this.currentQuestions[j], this.currentQuestions[i]];
        }
        
        this.userAnswers = new Array(this.currentQuestions.length).fill(null);
        this.currentIndex = 0;
        this.renderQuestion();
        UI.showToast('Otázky zamíchány');
    },
    
    renderQuestion: function() {
        if (this.currentQuestions.length === 0) return;
        
        const question = this.currentQuestions[this.currentIndex];
        const currentAnswer = this.userAnswers[this.currentIndex];
        
        document.getElementById('quizQuestion').innerText = question.otazka;
        document.getElementById('quizQuestionCounter').innerText = `Otázka ${this.currentIndex + 1}/${this.currentQuestions.length}`;
        
        const progress = ((this.currentIndex + 1) / this.currentQuestions.length) * 100;
        document.getElementById('quizProgressFill').style.width = `${progress}%`;
        
        const correctCount = this.userAnswers.filter((ans, idx) => {
            if (!ans || !this.currentQuestions[idx]) return false;
            return ans === this.currentQuestions[idx].odpoved;
        }).length;
        document.getElementById('quizScore').innerText = `${correctCount}/${this.currentQuestions.length} správně`;
        
        let options = question.moznosti || [];
        
        if (options.length === 0) {
            document.getElementById('quizOptions').innerHTML = `
                <div class="text-center p-4 bg-yellow-50 rounded-xl text-yellow-700">
                    <i data-feather="alert-circle" class="w-6 h-6 mx-auto mb-2"></i>
                    <p>Tato otázka nemá definované možnosti odpovědí.</p>
                    <p class="text-sm mt-2">Správná odpověď: <strong>${question.odpoved}</strong></p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        const letters = ['A', 'B', 'C', 'D'];
        let optionsHtml = '';
        
        options.forEach((opt, idx) => {
            let optionClass = 'quiz-option';
            if (currentAnswer !== null) {
                if (opt === question.odpoved) {
                    optionClass += ' correct';
                } else if (opt === currentAnswer && opt !== question.odpoved) {
                    optionClass += ' incorrect';
                }
                if (currentAnswer) {
                    optionClass += ' disabled';
                }
            }
            
            const escapedOpt = opt.replace(/'/g, "\\'");
            
            optionsHtml += `
                <div class="${optionClass}" onclick="${currentAnswer === null ? `Quiz.selectOption('${escapedOpt}')` : ''}">
                    <span class="option-letter">${letters[idx]}</span>
                    <span>${opt}</span>
                </div>
            `;
        });
        
        document.getElementById('quizOptions').innerHTML = optionsHtml;
        
        document.getElementById('quizPrevBtn').disabled = this.currentIndex === 0;
        document.getElementById('quizNextBtn').innerHTML = this.currentIndex === this.currentQuestions.length - 1 
            ? 'Dokončit <i data-feather="check" class="w-4 h-4"></i>' 
            : 'Další <i data-feather="arrow-right" class="w-4 h-4"></i>';
        
        feather.replace();
    },
    
    selectOption: function(option) {
        this.userAnswers[this.currentIndex] = option;
        this.renderQuestion();
        
        if (this.currentIndex < this.currentQuestions.length - 1) {
            setTimeout(() => {
                this.currentIndex++;
                this.renderQuestion();
            }, 600);
        }
    },
    
    next: function() {
        if (this.currentIndex < this.currentQuestions.length - 1) {
            this.currentIndex++;
            this.renderQuestion();
        } else {
            this.showResults();
        }
    },
    
    previous: function() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderQuestion();
        }
    },
    
    showResults: function() {
        const correct = this.userAnswers.filter((ans, idx) => {
            return ans === this.currentQuestions[idx]?.odpoved;
        }).length;
        
        const percentage = (correct / this.currentQuestions.length) * 100;
        
        const result = {
            date: new Date().toISOString(),
            score: correct,
            total: this.currentQuestions.length,
            category: document.getElementById('quizCategoryFilter').value,
            percentage: percentage
        };
        
        this.history.push(result);
        
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
        }
        
        Storage.saveQuizHistory(this.history);
        
        document.getElementById('quizResultScore').innerText = `${correct}/${this.currentQuestions.length}`;
        
        let message = '';
        if (percentage >= 90) message = 'Výborně! Jste expert!';
        else if (percentage >= 75) message = 'Velmi dobře!';
        else if (percentage >= 60) message = 'Dobré, ale může to být lepší';
        else if (percentage >= 40) message = 'Je potřeba více studovat';
        else message = 'Nevzdávejte to, příště to bude lepší';
        
        document.getElementById('quizResultMessage').innerText = message;
        
        document.getElementById('quizActiveArea').classList.add('hidden');
        document.getElementById('quizResultsArea').classList.remove('hidden');
        
        this.updateStats();
    },
    
    renderList: function() {
        const filter = document.getElementById('quizFilter')?.value || 'all';
        const filtered = filter === 'all' ? this.data : this.data.filter(q => q.kategorie === filter);
        
        const container = document.getElementById('quizList');
        if (!container) return;
        
        container.innerHTML = filtered.length ? filtered.map(q => {
            const hasOptions = q.moznosti && q.moznosti.length > 0;
            
            return `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div class="flex items-start gap-3">
                        <input type="checkbox" class="card-checkbox quiz-checkbox" data-id="${q.id}" 
                            onchange="Quiz.toggleSelect(${q.id}, this.checked)" 
                            ${this.selected.has(q.id) ? 'checked' : ''}>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex gap-2">
                                    <span class="category-tag"><i data-feather="folder"></i> ${q.kategorie}</span>
                                    ${hasOptions ? 
                                        '<span class="status-badge bg-green-100 text-green-600"><i data-feather="check"></i> 4 možnosti</span>' : 
                                        '<span class="status-badge bg-yellow-100 text-yellow-600"><i data-feather="alert-circle"></i> Chybí možnosti</span>'
                                    }
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="Quiz.openEdit(${q.id})" class="p-2 bg-blue-50 rounded-lg">
                                        <i data-feather="edit-2" class="w-4 h-4 text-blue-500"></i>
                                    </button>
                                    <button onclick="Quiz.delete(${q.id})" class="p-2 bg-red-50 rounded-lg">
                                        <i data-feather="trash-2" class="w-4 h-4 text-red-500"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="font-medium mb-2">❓ ${q.otazka}</p>
                            <p class="text-sm text-green-600 font-medium mb-2">✓ ${q.odpoved}</p>
                            
                            ${hasOptions ? `
                                <div class="text-sm bg-slate-50 p-2 rounded-lg">
                                    <span class="text-slate-500 text-xs">Možnosti:</span>
                                    <div class="grid grid-cols-2 gap-1 mt-1">
                                        ${q.moznosti.map((opt, i) => `
                                            <div class="text-xs ${opt === q.odpoved ? 'text-green-600 font-bold' : 'text-slate-600'}">
                                                ${String.fromCharCode(65 + i)}: ${opt}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<div class="text-center py-8 text-slate-500">Žádné kvízové otázky</div>';
        
        feather.replace();
        this.updateSelectedCount();
    },
    
    toggleSelect: function(id, checked) {
        if (checked) {
            this.selected.add(id);
        } else {
            this.selected.delete(id);
            document.getElementById('quizSelectAll').checked = false;
        }
        this.updateSelectedCount();
    },
    
    toggleSelectAll: function() {
        const checkbox = document.getElementById('quizSelectAll');
        const cards = document.querySelectorAll('.quiz-checkbox');
        
        cards.forEach(card => {
            card.checked = checkbox.checked;
            if (checkbox.checked) {
                this.selected.add(parseInt(card.dataset.id));
            } else {
                this.selected.delete(parseInt(card.dataset.id));
            }
        });
        
        this.updateSelectedCount();
    },
    
    updateSelectedCount: function() {
        document.getElementById('quizSelectedCount').innerText = `${this.selected.size} vybráno`;
    },
    
    deleteSelected: function() {
        if (this.selected.size === 0) {
            UI.showToast('Žádné otázky nevybrány', 'error');
            return;
        }
        
        UI.showConfirm(
            'Smazat vybrané?',
            `${this.selected.size} otázek bude smazáno.`,
            () => {
                this.data = this.data.filter(q => !this.selected.has(q.id));
                this.selected.clear();
                document.getElementById('quizSelectAll').checked = false;
                
                Storage.saveQuiz(this.data);
                this.renderList();
                this.updateStats();
                UI.showToast('Vybrané otázky smazány');
            }
        );
    },
    
    delete: function(id) {
        UI.showConfirm(
            'Smazat otázku?',
            'Tuto akci nelze vrátit.',
            () => {
                this.data = this.data.filter(q => q.id != id);
                this.selected.delete(id);
                Storage.saveQuiz(this.data);
                this.renderList();
                this.updateStats();
            }
        );
    },
    
    openAdd: function() {
        document.getElementById('modalTitle').innerText = 'Nová kvízová otázka';
        document.getElementById('modalItemType').value = 'quiz';
        document.getElementById('modalItemId').value = '';
        document.getElementById('modalQuestion').value = '';
        document.getElementById('modalAnswer').value = '';
        document.getElementById('modalCategory').value = Categories.data[0] || 'Obecná';
        
        document.getElementById('modalOption1').value = '';
        document.getElementById('modalOption2').value = '';
        document.getElementById('modalOption3').value = '';
        document.getElementById('modalOption4').value = '';
        document.getElementById('modalCorrectIndex').value = '0';
        
        document.getElementById('answerField').classList.add('hidden');
        document.getElementById('quizOptionsField').classList.remove('hidden');
        
        document.getElementById('itemModal').style.display = 'flex';
    },
    
    openEdit: function(id) {
        const question = this.data.find(q => q.id == id);
        if (!question) return;
        
        document.getElementById('modalTitle').innerText = 'Upravit otázku';
        document.getElementById('modalItemType').value = 'quiz';
        document.getElementById('modalItemId').value = question.id;
        document.getElementById('modalQuestion').value = question.otazka;
        document.getElementById('modalAnswer').value = question.odpoved;
        document.getElementById('modalCategory').value = question.kategorie;
        
        const options = question.moznosti || ['', '', '', ''];
        document.getElementById('modalOption1').value = options[0] || '';
        document.getElementById('modalOption2').value = options[1] || '';
        document.getElementById('modalOption3').value = options[2] || '';
        document.getElementById('modalOption4').value = options[3] || '';
        
        const correctIndex = options.findIndex(opt => opt === question.odpoved);
        document.getElementById('modalCorrectIndex').value = correctIndex >= 0 ? correctIndex : 0;
        
        document.getElementById('answerField').classList.add('hidden');
        document.getElementById('quizOptionsField').classList.remove('hidden');
        
        document.getElementById('itemModal').style.display = 'flex';
    },
    
    closeModal: function() {
        document.getElementById('itemModal').style.display = 'none';
    },
    
    saveFromModal: function() {
        const id = document.getElementById('modalItemId').value;
        const question = document.getElementById('modalQuestion').value;
        const category = document.getElementById('modalCategory').value;
        
        const option1 = document.getElementById('modalOption1').value.trim();
        const option2 = document.getElementById('modalOption2').value.trim();
        const option3 = document.getElementById('modalOption3').value.trim();
        const option4 = document.getElementById('modalOption4').value.trim();
        
        const correctIndex = parseInt(document.getElementById('modalCorrectIndex').value);
        
        const options = [];
        if (option1) options.push(option1);
        if (option2) options.push(option2);
        if (option3) options.push(option3);
        if (option4) options.push(option4);
        
        if (!question) {
            UI.showToast('Zadejte otázku', 'error');
            return;
        }
        
        if (options.length < 2) {
            UI.showToast('Musíte vyplnit alespoň 2 možnosti', 'error');
            return;
        }
        
        if (correctIndex >= options.length) {
            UI.showToast('Neplatný index správné odpovědi', 'error');
            return;
        }
        
        const correctAnswer = options[correctIndex];
        
        if (id) {
            const q = this.data.find(q => q.id == id);
            if (q) {
                q.otazka = question;
                q.odpoved = correctAnswer;
                q.kategorie = category;
                q.moznosti = options;
            }
        } else {
            this.data.push({
                id: Date.now(),
                otazka: question,
                odpoved: correctAnswer,
                kategorie: category,
                moznosti: options
            });
        }
        
        Storage.saveQuiz(this.data);
        this.closeModal();
        UI.showToast('Uloženo');
    },
    
    renderHistory: function() {
        const filter = document.getElementById('historyTimeFilter').value;
        let history = [...this.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filter !== 'all') {
            const days = parseInt(filter);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            history = history.filter(h => new Date(h.date) > cutoff);
        }
        
        this.renderHistoryChart(history);
        this.renderCategoryStats(history);
        this.renderRecentResults(history);
    },
    
    renderHistoryChart: function(history) {
        const container = document.getElementById('chartContainer');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="w-full text-center text-slate-500 py-8">Žádná data k zobrazení</div>';
            return;
        }
        
        const lastResults = history.slice(0, 10).reverse();
        
        let chartHtml = '';
        
        lastResults.forEach((result) => {
            const percentage = (result.score / result.total) * 100;
            const height = Math.max(10, (percentage / 100) * 160);
            const date = new Date(result.date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
            
            let color = 'bg-red-400';
            if (percentage >= 80) color = 'bg-green-400';
            else if (percentage >= 60) color = 'bg-emerald-400';
            else if (percentage >= 40) color = 'bg-yellow-400';
            
            chartHtml += `
                <div class="flex flex-col items-center flex-1">
                    <div class="w-full ${color} rounded-t-lg" style="height: ${height}px; min-height: 10px;"></div>
                    <div class="text-xs mt-1 text-slate-600">${date}</div>
                    <div class="text-xs font-semibold">${Math.round(percentage)}%</div>
                </div>
            `;
        });
        
        container.innerHTML = chartHtml;
    },
    
    renderCategoryStats: function(history) {
        if (history.length === 0) {
            document.getElementById('categoryStats').innerHTML = '<div class="text-center text-slate-500 py-4">Zatím žádné výsledky</div>';
            return;
        }
        
        const categoryStats = {};
        
        history.forEach(result => {
            const cat = result.category || 'Vše';
            if (!categoryStats[cat]) {
                categoryStats[cat] = { total: 0, correct: 0, count: 0 };
            }
            categoryStats[cat].total += result.total;
            categoryStats[cat].correct += result.score;
            categoryStats[cat].count++;
        });
        
        let html = '';
        for (const [category, stats] of Object.entries(categoryStats)) {
            const percentage = Math.round((stats.correct / stats.total) * 100);
            
            let barColor = 'bg-green-500';
            if (percentage < 60) barColor = 'bg-yellow-500';
            if (percentage < 40) barColor = 'bg-red-500';
            
            html += `
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span>${category}</span>
                        <span class="font-semibold">${percentage}%</span>
                    </div>
                    <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full ${barColor}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="text-xs text-slate-500 mt-1">
                        ${stats.correct}/${stats.total} správně (${stats.count} kvízů)
                    </div>
                </div>
            `;
        }
        
        document.getElementById('categoryStats').innerHTML = html;
    },
    
    renderRecentResults: function(history) {
        if (history.length === 0) {
            document.getElementById('recentResults').innerHTML = '<div class="text-center text-slate-500 py-4">Zatím žádné výsledky</div>';
            return;
        }
        
        const recent = history.slice(0, 10);
        
        let html = '';
        recent.forEach((result) => {
            const date = UI.formatDate(result.date);
            const percentage = Math.round((result.score / result.total) * 100);
            
            let badgeColor = 'bg-green-100 text-green-700';
            let icon = 'check-circle';
            
            if (percentage < 60) {
                badgeColor = 'bg-yellow-100 text-yellow-700';
                icon = 'alert-circle';
            }
            if (percentage < 40) {
                badgeColor = 'bg-red-100 text-red-700';
                icon = 'x-circle';
            }
            
            html += `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg ${badgeColor} flex items-center justify-center">
                            <i data-feather="${icon}" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <div class="font-medium">${result.score}/${result.total}</div>
                            <div class="text-xs text-slate-500">${date}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold ${percentage >= 60 ? 'text-green-600' : 'text-orange-600'}">${percentage}%</div>
                        <div class="text-xs text-slate-500">${result.category || 'Vše'}</div>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('recentResults').innerHTML = html;
        feather.replace();
    },
    
    clearHistory: function() {
        UI.showConfirm(
            'Smazat historii?',
            'Všechny uložené výsledky budou smazány.',
            () => {
                this.history = [];
                Storage.saveQuizHistory(this.history);
                this.renderHistory();
                this.updateStats();
                UI.showToast('Historie smazána');
            }
        );
    },
    
    export: function() {
        const data = {
            quizQuestions: this.data,
            exportDate: new Date().toISOString(),
            type: 'quiz'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        UI.showToast('Kvízové otázky exportovány');
    },
    
    import: function(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.quizQuestions && imported.type === 'quiz') {
                    this.data = imported.quizQuestions.map(q => ({
                        ...q,
                        id: Date.now() + Math.random(),
                        moznosti: q.moznosti || q.quizOptions || []
                    }));
                    Storage.saveQuiz(this.data);
                    UI.showToast('Kvízové otázky importovány');
                } else {
                    UI.showToast('Neplatný soubor kvízu', 'error');
                }
            } catch (error) {
                UI.showToast('Chyba při importu', 'error');
            }
        };
        reader.readAsText(file);
    }
};

window.startNewQuiz = () => Quiz.startNew();
window.shuffleQuiz = () => Quiz.shuffle();
window.nextQuizQuestion = () => Quiz.next();
window.previousQuizQuestion = () => Quiz.previous();
window.renderQuizHistory = () => Quiz.renderHistory();
window.clearQuizHistory = () => Quiz.clearHistory();
window.filterQuiz = () => Quiz.renderList();
window.toggleSelectAllQuiz = () => Quiz.toggleSelectAll();
window.deleteSelectedQuiz = () => Quiz.deleteSelected();
window.exportQuiz = () => Quiz.export();
window.importQuiz = (e) => Quiz.import(e.target.files[0]);