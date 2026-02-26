const Flashcards = {
    data: [],
    currentCard: null,
    flipped: false,
    toLearn: [],
    learnFilter: 'all',
    selected: new Set(),
    
    init: function() {
        this.data = Storage.getFlashcards();
        this.updateLearnList();
        this.renderUI();
        
        Events.on('flashcardsChanged', () => {
            this.updateLearnList();
            this.renderUI();
        });
        
        Events.on('categoriesChanged', () => {
            this.updateLearnList();
            this.renderUI();
        });
    },
    
    updateLearnList: function() {
        this.toLearn = this.data.filter(f => {
            if (this.learnFilter !== 'all' && f.kategorie !== this.learnFilter) return false;
            return f.vaha < 3;
        });
    },
    
    renderUI: function() {
        this.updateStats();
        this.renderCard();
        this.renderList();
    },
    
    updateStats: function() {
        const celkem = this.data.length;
        const nauceno = this.data.filter(f => f.vaha >= 3).length;
        
        document.getElementById('statsFlashcards').innerText = `${nauceno}/${celkem}`;
        document.getElementById('flashcardsKUceni').innerText = this.toLearn.length;
        document.getElementById('flashcardsNaucedo').innerText = nauceno;
        document.getElementById('flashcardsCelkem').innerText = celkem;
        
        const progress = celkem > 0 ? (nauceno / celkem) * 100 : 0;
        document.getElementById('flashcardsProgressBar').style.width = progress + '%';
        
        if (celkem === 0) {
            document.getElementById('flashcardsEmptyState').classList.remove('hidden');
            document.getElementById('flashcardsCardArea').classList.add('hidden');
        } else {
            document.getElementById('flashcardsEmptyState').classList.add('hidden');
            document.getElementById('flashcardsCardArea').classList.remove('hidden');
        }
    },
    
    renderCard: function() {
        if (this.data.length === 0) return;
        
        if (this.toLearn.length > 0) {
            this.showRandom();
        } else {
            this.showAll();
        }
    },
    
    showRandom: function() {
        if (this.toLearn.length === 0) {
            this.showAll();
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * this.toLearn.length);
        this.setCurrentCard(this.toLearn[randomIndex]);
    },
    
    showAll: function() {
        const filtered = this.learnFilter === 'all' 
            ? this.data 
            : this.data.filter(f => f.kategorie === this.learnFilter);
        
        if (filtered.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * filtered.length);
        this.setCurrentCard(filtered[randomIndex]);
    },
    
    setCurrentCard: function(card) {
        this.currentCard = card;
        this.flipped = false;
        
        document.getElementById('flashcardsFlashcard').classList.remove('rotate-y-180');
        document.getElementById('flashcardsOtazkaText').innerText = card.otazka;
        document.getElementById('flashcardsOdpovedText').innerText = card.odpoved;
        document.getElementById('flashcardsKartaKategorie').innerHTML = `<i data-feather="folder"></i> ${card.kategorie}`;
        
        const currentList = this.learnFilter === 'all' 
            ? this.data 
            : this.data.filter(f => f.kategorie === this.learnFilter);
        const index = currentList.findIndex(c => c.id === card.id) + 1;
        document.getElementById('flashcardsPocitadlo').innerText = `${index}/${currentList.length}`;
        
        this.updateCardStatus(card);
        feather.replace();
    },
    
    updateCardStatus: function(card) {
        let statusIcon = 'clock';
        let statusText = 'Nová';
        if (card.vaha === 1) { statusIcon = 'refresh-cw'; statusText = 'Opakování'; }
        else if (card.vaha === 2) { statusIcon = 'alert-circle'; statusText = 'Téměř'; }
        else if (card.vaha >= 3) { statusIcon = 'check-circle'; statusText = 'Naučeno'; }
        
        document.getElementById('flashcardsKartaStatus').innerHTML = `<i data-feather="${statusIcon}"></i> ${statusText} (Váha: ${card.vaha})`;
    },
    
    rate: function(value) {
        if (!this.currentCard) return;
        
        let change = value === 1 ? 1 : value === 2 ? 0.5 : value === 3 ? -0.5 : -1;
        
        const card = this.data.find(c => c.id === this.currentCard.id);
        if (card) {
            card.vaha = Math.max(0, Math.min(4, card.vaha + change));
            card.hodnoceni.push({ hodnota: value, cas: new Date().toISOString() });
            
            Storage.saveFlashcards(this.data);
            
            const messages = ['Výborně!', 'Dobře', 'Ještě zkusíme', 'Zopakujeme'];
            UI.showToast(messages[value - 1]);
            
            this.updateLearnList();
            this.renderCard();
        }
    },
    
    setWeight: function(cardId, weight) {
        const card = this.data.find(c => c.id === cardId);
        if (card) {
            card.vaha = Math.max(0, Math.min(4, parseInt(weight) || 0));
            Storage.saveFlashcards(this.data);
            this.renderList();
            this.renderCard();
        }
    },
    
    flip: function() {
        if (!this.currentCard) return;
        document.getElementById('flashcardsFlashcard').classList.toggle('rotate-y-180');
        this.flipped = !this.flipped;
    },
    
    filterLearn: function(filter) {
        this.learnFilter = filter;
        this.updateLearnList();
        this.renderCard();
    },
    
    resetAll: function() {
        UI.showConfirm(
            'Resetovat flashcards?',
            'Všem kartičkám bude nastavena váha 0.',
            () => {
                this.data.forEach(f => {
                    f.vaha = 0;
                    f.hodnoceni = [];
                });
                Storage.saveFlashcards(this.data);
                UI.showToast('Flashcards resetovány');
            }
        );
    },
    
    renderList: function() {
        const filter = document.getElementById('flashcardsFilter')?.value || 'all';
        const filtered = filter === 'all' ? this.data : this.data.filter(f => f.kategorie === filter);
        
        const container = document.getElementById('flashcardsList');
        if (!container) return;
        
        container.innerHTML = filtered.length ? filtered.map(f => {
            const statusIcon = f.vaha >= 3 ? 'check-circle' : f.vaha === 2 ? 'alert-circle' : f.vaha === 1 ? 'refresh-cw' : 'clock';
            const statusColor = f.vaha >= 3 ? 'text-green-500' : f.vaha === 2 ? 'text-orange-500' : 'text-blue-500';
            
            return `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div class="flex items-start gap-3">
                        <input type="checkbox" class="card-checkbox flashcard-checkbox" data-id="${f.id}" 
                            onchange="Flashcards.toggleSelect(${f.id}, this.checked)" 
                            ${this.selected.has(f.id) ? 'checked' : ''}>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex gap-2 flex-wrap">
                                    <span class="category-tag"><i data-feather="folder"></i> ${f.kategorie}</span>
                                    <span class="status-badge ${statusColor}"><i data-feather="${statusIcon}"></i> Váha: ${f.vaha}</span>
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="Flashcards.openEdit(${f.id})" class="p-2 bg-blue-50 rounded-lg">
                                        <i data-feather="edit-2" class="w-4 h-4 text-blue-500"></i>
                                    </button>
                                    <button onclick="Flashcards.delete(${f.id})" class="p-2 bg-red-50 rounded-lg">
                                        <i data-feather="trash-2" class="w-4 h-4 text-red-500"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="font-medium mb-1">❓ ${f.otazka}</p>
                            <p class="text-sm text-slate-600 mb-2">💡 ${f.odpoved}</p>
                            
                            <div class="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                <span class="text-xs text-slate-500">Nastavit váhu:</span>
                                <select onchange="Flashcards.setWeight(${f.id}, this.value)" class="text-xs p-1 border rounded">
                                    <option value="0" ${f.vaha === 0 ? 'selected' : ''}>0 - Nová</option>
                                    <option value="1" ${f.vaha === 1 ? 'selected' : ''}>1 - Opakování</option>
                                    <option value="2" ${f.vaha === 2 ? 'selected' : ''}>2 - Téměř</option>
                                    <option value="3" ${f.vaha === 3 ? 'selected' : ''}>3 - Naučeno</option>
                                    <option value="4" ${f.vaha === 4 ? 'selected' : ''}>4 - Mistr</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<div class="text-center py-8 text-slate-500">Žádné flashcards</div>';
        
        feather.replace();
        this.updateSelectedCount();
    },
    
    toggleSelect: function(id, checked) {
        if (checked) {
            this.selected.add(id);
        } else {
            this.selected.delete(id);
            document.getElementById('flashcardsSelectAll').checked = false;
        }
        this.updateSelectedCount();
    },
    
    toggleSelectAll: function() {
        const checkbox = document.getElementById('flashcardsSelectAll');
        const cards = document.querySelectorAll('.flashcard-checkbox');
        
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
        document.getElementById('flashcardsSelectedCount').innerText = `${this.selected.size} vybráno`;
    },
    
    deleteSelected: function() {
        if (this.selected.size === 0) {
            UI.showToast('Žádné flashcards nevybrány', 'error');
            return;
        }
        
        UI.showConfirm(
            'Smazat vybrané?',
            `${this.selected.size} flashcards bude smazáno.`,
            () => {
                this.data = this.data.filter(f => !this.selected.has(f.id));
                this.selected.clear();
                document.getElementById('flashcardsSelectAll').checked = false;
                
                Storage.saveFlashcards(this.data);
                this.renderList();
                this.renderCard();
                UI.showToast('Vybrané flashcards smazány');
            }
        );
    },
    
    resetSelected: function() {
        if (this.selected.size === 0) {
            UI.showToast('Žádné flashcards nevybrány', 'error');
            return;
        }
        
        UI.showConfirm(
            'Resetovat vybrané?',
            `${this.selected.size} flashcards bude mít váhu 0.`,
            () => {
                this.data.forEach(f => {
                    if (this.selected.has(f.id)) {
                        f.vaha = 0;
                        f.hodnoceni = [];
                    }
                });
                
                Storage.saveFlashcards(this.data);
                this.selected.clear();
                document.getElementById('flashcardsSelectAll').checked = false;
                this.renderList();
                this.renderCard();
                UI.showToast('Vybrané flashcards resetovány');
            }
        );
    },
    
    delete: function(id) {
        UI.showConfirm(
            'Smazat flashcard?',
            'Tuto akci nelze vrátit.',
            () => {
                this.data = this.data.filter(f => f.id != id);
                this.selected.delete(id);
                Storage.saveFlashcards(this.data);
                this.renderList();
                this.renderCard();
            }
        );
    },
    
    openAdd: function() {
        document.getElementById('modalTitle').innerText = 'Nová flashcard';
        document.getElementById('modalItemType').value = 'flashcard';
        document.getElementById('modalItemId').value = '';
        document.getElementById('modalQuestion').value = '';
        document.getElementById('modalAnswer').value = '';
        document.getElementById('modalCategory').value = Categories.data[0] || 'Obecná';
        
        document.getElementById('answerField').classList.remove('hidden');
        document.getElementById('quizOptionsField').classList.add('hidden');
        
        document.getElementById('itemModal').style.display = 'flex';
    },
    
    openEdit: function(id) {
        const card = this.data.find(f => f.id == id);
        if (!card) return;
        
        document.getElementById('modalTitle').innerText = 'Upravit flashcard';
        document.getElementById('modalItemType').value = 'flashcard';
        document.getElementById('modalItemId').value = card.id;
        document.getElementById('modalQuestion').value = card.otazka;
        document.getElementById('modalAnswer').value = card.odpoved;
        document.getElementById('modalCategory').value = card.kategorie;
        
        document.getElementById('answerField').classList.remove('hidden');
        document.getElementById('quizOptionsField').classList.add('hidden');
        
        document.getElementById('itemModal').style.display = 'flex';
    },
    
    closeModal: function() {
        document.getElementById('itemModal').style.display = 'none';
    },
    
    saveFromModal: function() {
        const id = document.getElementById('modalItemId').value;
        const question = document.getElementById('modalQuestion').value;
        const answer = document.getElementById('modalAnswer').value;
        const category = document.getElementById('modalCategory').value;
        
        if (!question || !answer) {
            UI.showToast('Vyplňte otázku a odpověď', 'error');
            return;
        }
        
        if (id) {
            const card = this.data.find(f => f.id == id);
            if (card) {
                card.otazka = question;
                card.odpoved = answer;
                card.kategorie = category;
            }
        } else {
            this.data.push({
                id: Date.now(),
                otazka: question,
                odpoved: answer,
                kategorie: category,
                vaha: 0,
                hodnoceni: []
            });
        }
        
        Storage.saveFlashcards(this.data);
        this.closeModal();
        UI.showToast('Uloženo');
    },
    
    export: function() {
        const data = {
            flashcards: this.data,
            exportDate: new Date().toISOString(),
            type: 'flashcards'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flashcards-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        UI.showToast('Flashcards exportovány');
    },
    
    import: function(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.flashcards && imported.type === 'flashcards') {
                    this.data = imported.flashcards.map(f => ({
                        ...f,
                        id: Date.now() + Math.random(),
                        vaha: 0,
                        hodnoceni: []
                    }));
                    Storage.saveFlashcards(this.data);
                    UI.showToast('Flashcards importovány');
                } else {
                    UI.showToast('Neplatný soubor flashcards', 'error');
                }
            } catch (error) {
                UI.showToast('Chyba při importu', 'error');
            }
        };
        reader.readAsText(file);
    }
};

window.otocFlashcard = () => Flashcards.flip();
window.hodnotitFlashcard = (v) => Flashcards.rate(v);
window.filterFlashcardsLearn = () => Flashcards.filterLearn(document.getElementById('flashcardsLearnFilter').value);
window.resetFlashcardsProgress = () => Flashcards.resetAll();
window.reshuffleFlashcards = () => { Flashcards.updateLearnList(); Flashcards.renderCard(); UI.showToast('Seznam zamíchán'); };
window.showAllFlashcards = () => { Flashcards.learnFilter = document.getElementById('flashcardsLearnFilter').value; Flashcards.showAll(); };
window.filterFlashcards = () => Flashcards.renderList();
window.toggleSelectAllFlashcards = () => Flashcards.toggleSelectAll();
window.resetSelectedFlashcards = () => Flashcards.resetSelected();
window.deleteSelectedFlashcards = () => Flashcards.deleteSelected();
window.exportFlashcards = () => Flashcards.export();
window.importFlashcards = (e) => Flashcards.import(e.target.files[0]);