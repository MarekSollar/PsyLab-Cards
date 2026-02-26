const Storage = {
    // Flashcards
    getFlashcards: function() {
        const data = localStorage.getItem('psylab_flashcards');
        return data ? JSON.parse(data) : [...DEFAULTS.flashcards];
    },
    
    saveFlashcards: function(flashcards) {
        localStorage.setItem('psylab_flashcards', JSON.stringify(flashcards));
        Events.notify('flashcardsChanged', flashcards);
    },
    
    // Quiz
    getQuiz: function() {
        const data = localStorage.getItem('psylab_quiz');
        return data ? JSON.parse(data) : [...DEFAULTS.quiz];
    },
    
    saveQuiz: function(quiz) {
        localStorage.setItem('psylab_quiz', JSON.stringify(quiz));
        Events.notify('quizChanged', quiz);
    },
    
    // Historie kvízů
    getQuizHistory: function() {
        const data = localStorage.getItem('psylab_quiz_history');
        return data ? JSON.parse(data) : [];
    },
    
    saveQuizHistory: function(history) {
        localStorage.setItem('psylab_quiz_history', JSON.stringify(history));
    },
    
    // Kategorie
    getCategories: function() {
        const data = localStorage.getItem('psylab_categories');
        return data ? JSON.parse(data) : [...DEFAULTS.categories];
    },
    
    saveCategories: function(categories) {
        localStorage.setItem('psylab_categories', JSON.stringify(categories));
        Events.notify('categoriesChanged', categories);
    },
    
    // Dark mode
    getDarkMode: function() {
        return localStorage.getItem('psylab_darkMode') === 'true';
    },
    
    saveDarkMode: function(isDark) {
        localStorage.setItem('psylab_darkMode', isDark);
    }
};

// Jednoduchý event systém
const Events = {
    listeners: {},
    
    on: function(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    notify: function(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};