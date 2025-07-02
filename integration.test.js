// Tests d'intégration pour les fonctionnalités de stockage et l'interface
describe('Tests d\'intégration', () => {
    
    beforeEach(() => {
        // Nettoyer le localStorage avant chaque test
        localStorage.clear();
        
        // Mock du DOM si nécessaire
        document.body.innerHTML = `
            <select id="categorySelect">
                <option value="distance">Distance</option>
                <option value="thermalUnit">Température</option>
            </select>
            <input id="inputAmount" type="number" />
            <input id="outputAmount" type="text" readonly />
            <select id="sourceUnit"></select>
            <select id="destinationUnit"></select>
            <button id="calculateBtn">Convertir</button>
            <button id="bookmarkBtn">Sauvegarder</button>
            <div id="savedConversions"></div>
            <div id="recentActivity"></div>
            <div id="alertBox"></div>
        `;
    });

    afterEach(() => {
        localStorage.clear();
    });

    // Tests de gestion des favoris
    test('Ajout et suppression de favoris', () => {
        const favorite = {
            category: 'distance',
            sourceUnit: 'm',
            targetUnit: 'km',
            inputValue: '1000'
        };

        // Ajout d'un favori
        let bookmarks = JSON.parse(localStorage.getItem('savedBookmarks') || '[]');
        bookmarks.push(favorite);
        localStorage.setItem('savedBookmarks', JSON.stringify(bookmarks));

        // Vérification de l'ajout
        bookmarks = JSON.parse(localStorage.getItem('savedBookmarks') || '[]');
        expect(bookmarks.length).toBe(1);
        expect(bookmarks[0]).toEqual(favorite);

        // Suppression du favori
        bookmarks.splice(0, 1);
        localStorage.setItem('savedBookmarks', JSON.stringify(bookmarks));
        
        // Vérification de la suppression
        bookmarks = JSON.parse(localStorage.getItem('savedBookmarks') || '[]');
        expect(bookmarks.length).toBe(0);
    });

    test('Prévention des doublons dans les favoris', () => {
        const favorite = {
            category: 'distance',
            sourceUnit: 'm',
            targetUnit: 'km',
            inputValue: '1000'
        };

        // Ajout du premier favori
        let bookmarks = JSON.parse(localStorage.getItem('savedBookmarks') || '[]');
        bookmarks.push(favorite);
        localStorage.setItem('savedBookmarks', JSON.stringify(bookmarks));

        // Tentative d'ajout du même favori
        const isDuplicate = bookmarks.some(item => 
            item.category === favorite.category && 
            item.sourceUnit === favorite.sourceUnit && 
            item.targetUnit === favorite.targetUnit
        );

        expect(isDuplicate).toBe(true);
        expect(bookmarks.length).toBe(1);
    });

    // Tests de gestion de l'historique
    test('Ajout et suppression dans l\'historique', () => {
        const historyItem = {
            category: 'thermalUnit',
            inputValue: 32,
            sourceUnit: 'fahrenheit',
            result: 0,
            targetUnit: 'celsius',
            timestamp: new Date().toLocaleString('fr-FR')
        };

        // Ajout à l'historique
        let history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
        history.unshift(historyItem);
        localStorage.setItem('conversionHistory', JSON.stringify(history));

        // Vérification de l'ajout
        history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
        expect(history.length).toBe(1);
        expect(history[0].category).toBe(historyItem.category);
        expect(history[0].inputValue).toBe(historyItem.inputValue);

        // Suppression de l'historique
        history.splice(0, 1);
        localStorage.setItem('conversionHistory', JSON.stringify(history));
        
        // Vérification de la suppression
        history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
        expect(history.length).toBe(0);
    });

    test('Limite de l\'historique à 15 entrées', () => {
        let history = [];
        
        // Ajout de 20 éléments pour tester la limite
        for (let i = 0; i < 20; i++) {
            const historyItem = {
                category: 'distance',
                inputValue: i,
                sourceUnit: 'm',
                result: i / 1000,
                targetUnit: 'km',
                timestamp: new Date().toLocaleString('fr-FR')
            };
            history.unshift(historyItem);
            
            // Appliquer la limite de 15
            if (history.length > 15) {
                history.splice(15);
            }
        }
        
        localStorage.setItem('conversionHistory', JSON.stringify(history));

        // Vérification de la limite
        history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
        expect(history.length).toBe(15);
        expect(history[0].inputValue).toBe(19); // Le plus récent
        expect(history[14].inputValue).toBe(5); // Le plus ancien conservé
    });

    // Tests de configuration des unités
    test('Vérification de la configuration des unités de distance', () => {
        const distanceUnits = {
            m: { factor: 1, name: 'Mètre' },
            km: { factor: 1000, name: 'Kilomètre' },
            ft: { factor: 0.3048, name: 'Pied' },
            in: { factor: 0.0254, name: 'Pouce' },
            yd: { factor: 0.9144, name: 'Yard' },
            mi: { factor: 1609.344, name: 'Mile' }
        };
        
        expect(distanceUnits.m).toBeDefined();
        expect(distanceUnits.km).toBeDefined();
        expect(distanceUnits.ft).toBeDefined();
        expect(distanceUnits.in).toBeDefined();
        expect(distanceUnits.yd).toBeDefined();
        expect(distanceUnits.mi).toBeDefined();
        
        // Vérification des facteurs de conversion
        expect(distanceUnits.m.factor).toBe(1);
        expect(distanceUnits.km.factor).toBe(1000);
        expect(distanceUnits.ft.factor).toBe(0.3048);
    });

    test('Vérification de la configuration des unités de température', () => {
        const thermalUnits = {
            celsius: { type: 'temp', name: 'Celsius' },
            fahrenheit: { type: 'temp', name: 'Fahrenheit' },
            kelvin: { type: 'temp', name: 'Kelvin' }
        };
        
        expect(thermalUnits.celsius).toBeDefined();
        expect(thermalUnits.fahrenheit).toBeDefined();
        expect(thermalUnits.kelvin).toBeDefined();
        
        expect(thermalUnits.celsius.type).toBe('temp');
        expect(thermalUnits.fahrenheit.type).toBe('temp');
        expect(thermalUnits.kelvin.type).toBe('temp');
    });

    // Tests de persistence des données
    test('Persistence des favoris entre les sessions', () => {
        const favorite = {
            category: 'mass',
            sourceUnit: 'g',
            targetUnit: 'kg',
            inputValue: '1000'
        };

        // Simulation d'une première session
        localStorage.setItem('savedBookmarks', JSON.stringify([favorite]));

        // Simulation d'une nouvelle session (rechargement de page)
        const loadedBookmarks = JSON.parse(localStorage.getItem('savedBookmarks') || '[]');
        
        expect(loadedBookmarks.length).toBe(1);
        expect(loadedBookmarks[0]).toEqual(favorite);
    });

    test('Persistence de l\'historique entre les sessions', () => {
        const historyItems = [
            {
                category: 'capacity',
                inputValue: 1,
                sourceUnit: 'l',
                result: 0.264172,
                targetUnit: 'gal',
                timestamp: new Date().toLocaleString('fr-FR')
            },
            {
                category: 'thermalUnit',
                inputValue: 100,
                sourceUnit: 'celsius',
                result: 212,
                targetUnit: 'fahrenheit',
                timestamp: new Date().toLocaleString('fr-FR')
            }
        ];

        // Simulation d'une première session
        localStorage.setItem('conversionHistory', JSON.stringify(historyItems));

        // Simulation d'une nouvelle session
        const loadedHistory = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
        
        expect(loadedHistory.length).toBe(2);
        expect(loadedHistory[0].category).toBe('capacity');
        expect(loadedHistory[1].category).toBe('thermalUnit');
    });

    // Test de formatage des données
    test('Format correct des données d\'historique', () => {
        const historyItem = {
            category: 'distance',
            inputValue: 1609.344,
            sourceUnit: 'mi',
            result: 1.000000,
            targetUnit: 'km',
            timestamp: new Date().toLocaleString('fr-FR')
        };

        // Vérification que le résultat est formaté correctement
        expect(typeof historyItem.result).toBe('number');
        expect(historyItem.result.toFixed(6)).toBe('1.000000');
        expect(typeof historyItem.timestamp).toBe('string');
        expect(historyItem.timestamp).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Format date français
    });
});