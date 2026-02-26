// Výchozí data pro aplikaci
const DEFAULTS = {
    categories: ['Obecná', 'Vývojová', 'Klinická', 'Sociální'],
    
    flashcards: [
        { id: 1, otazka: "Kdo byl Sigmund Freud?", odpoved: "Zakladatel psychoanalýzy", kategorie: "Obecná", vaha: 0, hodnoceni: [] },
        { id: 2, otazka: "Co je behaviorismus?", odpoved: "Směr zaměřený na chování", kategorie: "Obecná", vaha: 0, hodnoceni: [] }
    ],
    
    quiz: [
        { 
            id: 101, 
            otazka: "Kdo je autorem teorie kognitivního vývoje?", 
            odpoved: "Jean Piaget", 
            kategorie: "Vývojová",
            moznosti: ["Jean Piaget", "Sigmund Freud", "Lev Vygotsky", "Erik Erikson"],
            spravna: 0
        },
        { 
            id: 102, 
            otazka: "Který typ paměti uchovává informace nejdéle?", 
            odpoved: "Dlouhodobá paměť", 
            kategorie: "Obecná",
            moznosti: ["Dlouhodobá paměť", "Krátkodobá paměť", "Senzorická paměť", "Pracovní paměť"],
            spravna: 0
        }
    ]
};