// Configuration des unités de mesure
const UNITS_CONFIG = {
    distance: {
        m: { factor: 1, name: 'Mètre' },
        km: { factor: 1000, name: 'Kilomètre' },
        ft: { factor: 0.3048, name: 'Pied' },
        in: { factor: 0.0254, name: 'Pouce' },
        yd: { factor: 0.9144, name: 'Yard' },
        mi: { factor: 1609.344, name: 'Mile' }
    },
    thermalUnit: {
        celsius: { type: 'temp', name: 'Celsius' },
        fahrenheit: { type: 'temp', name: 'Fahrenheit' },
        kelvin: { type: 'temp', name: 'Kelvin' }
    },
    mass: {
        g: { factor: 1, name: 'Gramme' },
        kg: { factor: 1000, name: 'Kilogramme' },
        lb: { factor: 453.592, name: 'Livre' }
    },
    capacity: {
        l: { factor: 1, name: 'Litre' },
        gal: { factor: 3.78541, name: 'Gallon' }
    },
    fiat: {
        EUR: { code: 'EUR', name: 'Euro' },
        USD: { code: 'USD', name: 'Dollar US' },
        GBP: { code: 'GBP', name: 'Livre Sterling' },
        JPY: { code: 'JPY', name: 'Yen' }
    },
    digital: {
        BTC: { code: 'BTC', name: 'Bitcoin' },
        ETH: { code: 'ETH', name: 'Ethereum' },
        SOL: { code: 'SOL', name: 'Solana' }
    }
};

// Variables globales pour les éléments DOM
let elements = {};

// Fonction d'initialisation
function initializeApp() {
    // Récupération des éléments DOM
    elements = {
        categorySelect: document.getElementById('categorySelect'),
        inputAmount: document.getElementById('inputAmount'),
        outputAmount: document.getElementById('outputAmount'),
        sourceUnit: document.getElementById('sourceUnit'),
        destinationUnit: document.getElementById('destinationUnit'),
        calculateBtn: document.getElementById('calculateBtn'),
        bookmarkBtn: document.getElementById('bookmarkBtn'),
        savedConversions: document.getElementById('savedConversions'),
        recentActivity: document.getElementById('recentActivity'),
        alertBox: document.getElementById('alertBox')
    };

    // Configuration des événements
    elements.categorySelect.addEventListener('change', populateUnitSelectors);
    elements.calculateBtn.addEventListener('click', performConversion);
    elements.bookmarkBtn.addEventListener('click', saveToBookmarks);

    // Initialisation
    populateUnitSelectors();
    loadStoredData();
}

// Fonction pour remplir les sélecteurs d'unités
function populateUnitSelectors() {
    const selectedCategory = elements.categorySelect.value;
    const units = UNITS_CONFIG[selectedCategory];

    // Vider les sélecteurs
    elements.sourceUnit.innerHTML = '';
    elements.destinationUnit.innerHTML = '';

    // Remplir avec les nouvelles options
    Object.entries(units).forEach(([key, config]) => {
        // Option pour le sélecteur source
        const sourceOption = document.createElement('option');
        sourceOption.value = key;
        sourceOption.textContent = config.name;
        elements.sourceUnit.appendChild(sourceOption);

        // Option pour le sélecteur destination
        const destOption = document.createElement('option');
        destOption.value = key;
        destOption.textContent = config.name;
        elements.destinationUnit.appendChild(destOption);
    });
}

// Fonction de conversion de température
function convertTemperature(value, fromUnit, toUnit) {
    let celsius;
    
    // Conversion vers Celsius
    switch(fromUnit) {
        case 'celsius': celsius = value; break;
        case 'fahrenheit': celsius = (value - 32) * 5/9; break;
        case 'kelvin': celsius = value - 273.15; break;
        default: throw new Error('Unité de température inconnue');
    }
    
    // Conversion depuis Celsius
    switch(toUnit) {
        case 'celsius': return celsius;
        case 'fahrenheit': return (celsius * 9/5) + 32;
        case 'kelvin': return celsius + 273.15;
        default: throw new Error('Unité de température inconnue');
    }
}

// Fonction principale de conversion
async function performConversion() {
    try {
        const category = elements.categorySelect.value;
        const inputValue = parseFloat(elements.inputAmount.value);
        const sourceUnit = elements.sourceUnit.value;
        const targetUnit = elements.destinationUnit.value;

        if (!inputValue || isNaN(inputValue) || inputValue <= 0) {
            throw new Error('Veuillez entrer une valeur numérique positive');
        }

        let result;

        // Traitement selon le type de conversion
        if (category === 'thermalUnit') {
            result = convertTemperature(inputValue, sourceUnit, targetUnit);
        } else if (category === 'fiat' || category === 'digital') {
            result = await convertCurrency(inputValue, sourceUnit, targetUnit, category);
        } else {
            // Conversion d'unités standard
            const units = UNITS_CONFIG[category];
            const sourceFactor = units[sourceUnit].factor;
            const targetFactor = units[targetUnit].factor;
            result = (inputValue * sourceFactor) / targetFactor;
        }

        // Affichage du résultat
        elements.outputAmount.value = result.toFixed(6);

        // Sauvegarde dans l'historique
        saveToHistory(category, inputValue, sourceUnit, result, targetUnit);
        updateHistoryDisplay();

        // Masquer les alertes d'erreur
        hideAlert();

    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Fonction pour sauvegarder dans les favoris
function saveToBookmarks() {
    try {
        const category = elements.categorySelect.value;
        const sourceUnit = elements.sourceUnit.value;
        const targetUnit = elements.destinationUnit.value;
        const inputValue = elements.inputAmount.value;

        if (!inputValue) {
            throw new Error('Veuillez effectuer une conversion avant de sauvegarder');
        }

        const bookmark = { category, sourceUnit, targetUnit, inputValue };
        let bookmarks = getStorageData('savedBookmarks');

        // Vérifier les doublons
        const duplicate = bookmarks.some(item => 
            item.category === category && 
            item.sourceUnit === sourceUnit && 
            item.targetUnit === targetUnit
        );

        if (duplicate) {
            throw new Error('Cette conversion est déjà sauvegardée');
        }

        bookmarks.push(bookmark);
        setStorageData('savedBookmarks', bookmarks);
        updateBookmarksDisplay();
        hideAlert();

    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Fonction pour sauvegarder dans l'historique
function saveToHistory(category, inputValue, sourceUnit, result, targetUnit) {
    const historyItem = {
        category,
        inputValue,
        sourceUnit,
        result: parseFloat(result.toFixed(6)),
        targetUnit,
        timestamp: new Date().toLocaleString('fr-FR')
    };

    let history = getStorageData('conversionHistory');
    history.unshift(historyItem);

    // Limiter à 15 éléments
    if (history.length > 15) history.splice(15);

    setStorageData('conversionHistory', history);
}

// Fonctions utilitaires pour le stockage
function getStorageData(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function setStorageData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Fonction pour charger les données stockées
function loadStoredData() {
    updateBookmarksDisplay();
    updateHistoryDisplay();
}

// Fonction pour mettre à jour l'affichage des favoris
function updateBookmarksDisplay() {
    const bookmarks = getStorageData('savedBookmarks');
    const container = elements.savedConversions;

    if (bookmarks.length === 0) {
        container.innerHTML = '<div class="placeholder-text">Aucune conversion sauvegardée</div>';
        return;
    }

    container.innerHTML = bookmarks.map((bookmark, index) => {
        const sourceConfig = UNITS_CONFIG[bookmark.category][bookmark.sourceUnit];
        const targetConfig = UNITS_CONFIG[bookmark.category][bookmark.targetUnit];

        return `
            <div class="bookmark-item">
                <span>${bookmark.inputValue} ${sourceConfig.name} → ${targetConfig.name}</span>
                <button onclick="removeBookmark(${index})" class="delete-btn">Supprimer</button>
            </div>
        `;
    }).join('');
}

// Fonction pour mettre à jour l'affichage de l'historique
function updateHistoryDisplay() {
    const history = getStorageData('conversionHistory');
    const container = elements.recentActivity;

    if (history.length === 0) {
        container.innerHTML = '<div class="placeholder-text">Aucun historique disponible</div>';
        return;
    }

    container.innerHTML = history.map((record, index) => {
        const sourceConfig = UNITS_CONFIG[record.category][record.sourceUnit];
        const targetConfig = UNITS_CONFIG[record.category][record.targetUnit];

        return `
            <div class="history-item">
                <span>${record.inputValue} ${sourceConfig.name} → ${record.result} ${targetConfig.name}</span>
                <small>(${record.timestamp})</small>
                <button onclick="removeHistoryItem(${index})" class="delete-btn">Supprimer</button>
            </div>
        `;
    }).join('');
}

// Fonctions pour supprimer des éléments
function removeBookmark(index) {
    let bookmarks = getStorageData('savedBookmarks');
    bookmarks.splice(index, 1);
    setStorageData('savedBookmarks', bookmarks);
    updateBookmarksDisplay();
}

function removeHistoryItem(index) {
    let history = getStorageData('conversionHistory');
    history.splice(index, 1);
    setStorageData('conversionHistory', history);
    updateHistoryDisplay();
}

// Fonctions pour les alertes
function showAlert(message, type = 'error') {
    elements.alertBox.textContent = message;
    elements.alertBox.className = `alert ${type}`;
    elements.alertBox.style.display = 'block';

    setTimeout(() => {
        hideAlert();
    }, 4000);
}

function hideAlert() {
    elements.alertBox.style.display = 'none';
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeApp);