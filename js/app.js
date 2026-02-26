// Hlavní aplikace
const App = {
    init: function() {
        if (Storage.getDarkMode()) {
            document.body.classList.add('dark');
            document.querySelector('#darkModeToggle i').setAttribute('data-feather', 'sun');
        }
        
        Categories.init();
        Flashcards.init();
        Quiz.init();
        
        feather.replace();
        
        this.switchMainTab('flashcards');
        this.setupModalListeners();
    },
    
    switchMainTab: function(tab) {
        if (tab === 'flashcards') {
            document.getElementById('flashcardsSection').classList.remove('hidden');
            document.getElementById('quizSection').classList.add('hidden');
            document.getElementById('mainTabFlashcards').classList.add('active');
            document.getElementById('mainTabQuiz').classList.remove('active');
        } else {
            document.getElementById('flashcardsSection').classList.add('hidden');
            document.getElementById('quizSection').classList.remove('hidden');
            document.getElementById('mainTabFlashcards').classList.remove('active');
            document.getElementById('mainTabQuiz').classList.add('active');
        }
    },
    
    switchFlashcardTab: function(tab) {
        if (tab === 'learn') {
            document.getElementById('flashcardsLearnTab').classList.remove('hidden');
            document.getElementById('flashcardsManageTab').classList.add('hidden');
            document.getElementById('flashcardTabLearn').classList.add('active');
            document.getElementById('flashcardTabManage').classList.remove('active');
        } else {
            document.getElementById('flashcardsLearnTab').classList.add('hidden');
            document.getElementById('flashcardsManageTab').classList.remove('hidden');
            document.getElementById('flashcardTabLearn').classList.remove('active');
            document.getElementById('flashcardTabManage').classList.add('active');
            Flashcards.renderList();
        }
    },
    
    switchQuizTab: function(tab) {
        if (tab === 'practice') {
            document.getElementById('quizPracticeTab').classList.remove('hidden');
            document.getElementById('quizHistoryTab').classList.add('hidden');
            document.getElementById('quizManageTab').classList.add('hidden');
            document.getElementById('quizTabPractice').classList.add('active');
            document.getElementById('quizTabHistory').classList.remove('active');
            document.getElementById('quizTabManage').classList.remove('active');
        } else if (tab === 'history') {
            document.getElementById('quizPracticeTab').classList.add('hidden');
            document.getElementById('quizHistoryTab').classList.remove('hidden');
            document.getElementById('quizManageTab').classList.add('hidden');
            document.getElementById('quizTabPractice').classList.remove('active');
            document.getElementById('quizTabHistory').classList.add('active');
            document.getElementById('quizTabManage').classList.remove('active');
            Quiz.renderHistory();
        } else {
            document.getElementById('quizPracticeTab').classList.add('hidden');
            document.getElementById('quizHistoryTab').classList.add('hidden');
            document.getElementById('quizManageTab').classList.remove('hidden');
            document.getElementById('quizTabPractice').classList.remove('active');
            document.getElementById('quizTabHistory').classList.remove('active');
            document.getElementById('quizTabManage').classList.add('active');
            Quiz.renderList();
        }
    },
    
    toggleDarkMode: function() {
        const isDark = !document.body.classList.contains('dark');
        document.body.classList.toggle('dark', isDark);
        Storage.saveDarkMode(isDark);
        
        const icon = document.querySelector('#darkModeToggle i');
        icon.setAttribute('data-feather', isDark ? 'sun' : 'moon');
        feather.replace();
    },
    
    setupModalListeners: function() {
        document.getElementById('itemModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('itemModal')) {
                this.closeItemModal();
            }
        });
        
        document.getElementById('categoryModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('categoryModal')) {
                this.closeCategoryModal();
            }
        });
    },
    
    openAddModal: function(type) {
        if (type === 'flashcard') {
            Flashcards.openAdd();
        } else {
            Quiz.openAdd();
        }
    },
    
    openAddModalByCurrentTab: function() {
        const flashcardsSection = document.getElementById('flashcardsSection');
        
        if (!flashcardsSection.classList.contains('hidden')) {
            this.openAddModal('flashcard');
        } else {
            this.openAddModal('quiz');
        }
    },
    
    closeItemModal: function() {
        document.getElementById('itemModal').style.display = 'none';
    },
    
    openCategoryModal: function() {
        Categories.renderList();
        document.getElementById('categoryModal').style.display = 'flex';
    },
    
    closeCategoryModal: function() {
        document.getElementById('categoryModal').style.display = 'none';
    },
    
    saveItem: function() {
        const type = document.getElementById('modalItemType').value;
        if (type === 'flashcard') {
            Flashcards.saveFromModal();
        } else {
            Quiz.saveFromModal();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.switchMainTab = (tab) => App.switchMainTab(tab);
window.switchFlashcardTab = (tab) => App.switchFlashcardTab(tab);
window.switchQuizTab = (tab) => App.switchQuizTab(tab);
window.toggleDarkMode = () => App.toggleDarkMode();
window.openAddModal = (type) => App.openAddModal(type);
window.openAddModalByCurrentTab = () => App.openAddModalByCurrentTab();
window.closeItemModal = () => App.closeItemModal();
window.openCategoryModal = () => App.openCategoryModal();
window.closeCategoryModal = () => App.closeCategoryModal();
window.saveItem = () => App.saveItem();

window.addCategory = () => {
    const name = document.getElementById('newCategoryName').value;
    if (Categories.add(name)) {
        document.getElementById('newCategoryName').value = '';
    }
};

window.confirmDeleteCategory = (name) => Categories.delete(name);