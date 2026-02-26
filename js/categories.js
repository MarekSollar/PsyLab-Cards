const Categories = {
    data: [],
    
    init: function() {
        this.data = Storage.getCategories();
        this.renderList();
        this.updateAllSelects();
        
        Events.on('categoriesChanged', (categories) => {
            this.data = categories;
            this.updateAllSelects();
        });
    },
    
    getAll: function() {
        return this.data;
    },
    
    add: function(name) {
        name = name.trim();
        if (!name) return false;
        if (this.data.includes(name)) {
            UI.showToast('Kategorie již existuje', 'error');
            return false;
        }
        
        this.data.push(name);
        Storage.saveCategories(this.data);
        UI.showToast('Kategorie přidána');
        return true;
    },
    
    delete: function(name) {
        const flashcardsCount = Flashcards.data.filter(f => f.kategorie === name).length;
        const quizCount = Quiz.data.filter(q => q.kategorie === name).length;
        const total = flashcardsCount + quizCount;
        
        UI.showConfirm(
            'Smazat kategorii?',
            `Kategorie "${name}" obsahuje ${total} položek (${flashcardsCount} flashcards, ${quizCount} kvízů). Vše bude smazáno.`,
            () => {
                Flashcards.data = Flashcards.data.filter(f => f.kategorie !== name);
                Quiz.data = Quiz.data.filter(q => q.kategorie !== name);
                this.data = this.data.filter(k => k !== name);
                
                Storage.saveFlashcards(Flashcards.data);
                Storage.saveQuiz(Quiz.data);
                Storage.saveCategories(this.data);
                
                UI.showToast('Kategorie smazána');
            }
        );
    },
    
    renderList: function() {
        const container = document.getElementById('categoriesList');
        if (!container) return;
        
        container.innerHTML = this.data.map(name => {
            const flashcardsCount = Flashcards.data.filter(f => f.kategorie === name).length;
            const quizCount = Quiz.data.filter(q => q.kategorie === name).length;
            
            return `
                <div class="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                    <div>
                        <span class="font-medium">${name}</span>
                        <div class="text-xs text-slate-500 mt-1">
                            <span class="mr-2">📇 ${flashcardsCount}</span>
                            <span>❓ ${quizCount}</span>
                        </div>
                    </div>
                    <button onclick="Categories.delete('${name}')" class="p-2 bg-red-50 rounded-lg">
                        <i data-feather="trash-2" class="w-4 h-4 text-red-500"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        feather.replace();
    },
    
    updateAllSelects: function() {
        const selects = [
            'flashcardsLearnFilter',
            'flashcardsFilter',
            'quizCategoryFilter',
            'quizFilter',
            'modalCategory'
        ];
        
        const options = '<option value="all">Všechny kategorie</option>' + 
            this.data.map(k => `<option value="${k}">${k}</option>`).join('');
        
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = id === 'modalCategory' 
                    ? this.data.map(k => `<option value="${k}">${k}</option>`).join('')
                    : options;
                if (currentValue && this.data.includes(currentValue)) {
                    select.value = currentValue;
                }
            }
        });
    }
};