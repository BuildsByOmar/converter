// Configuration de l'API pour les devises
const API_CONFIG = {
    baseURL: 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest',
    cacheDuration: 1800000 // 30 minutes
};

// Cache pour les taux de change
let exchangeCache = {
    fiat: {},
    digital: {},
    lastUpdate: 0
};

// Fonction pour récupérer les taux de change
async function fetchExchangeRates() {
    const now = Date.now();
    
    // Vérifier si le cache est encore valide
    if (now - exchangeCache.lastUpdate < API_CONFIG.cacheDuration && 
        Object.keys(exchangeCache.fiat).length > 0) {
        return exchangeCache;
    }

    try {
        // Récupérer les données en parallèle
        const [currencyResponse, cryptoResponse] = await Promise.all([
            fetch(`${API_CONFIG.baseURL}/currencies.json`),
            fetch(`${API_CONFIG.baseURL}/cryptocurrencies.json`)
        ]);

        if (!currencyResponse.ok || !cryptoResponse.ok) {
            throw new Error('Erreur lors de la récupération des taux de change');
        }

        const currencyData = await currencyResponse.json();
        const cryptoData = await cryptoResponse.json();

        // Mettre à jour le cache
        exchangeCache = {
            fiat: currencyData,
            digital: cryptoData,
            lastUpdate: now
        };

        return exchangeCache;
    } catch (error) {
        console.error('Erreur API:', error);
        throw new Error('Impossible de récupérer les taux de change. Veuillez réessayer.');
    }
}

// Fonction de conversion de devises
async function convertCurrency(amount, fromCurrency, toCurrency, type) {
    if (!amount || amount <= 0) {
        throw new Error('Le montant doit être un nombre positif');
    }

    const rates = await fetchExchangeRates();
    const typeRates = rates[type];

    if (!typeRates) {
        throw new Error('Type de devise non supporté');
    }

    const fromKey = fromCurrency.toLowerCase();
    const toKey = toCurrency.toLowerCase();

    if (!typeRates[fromKey] || !typeRates[toKey]) {
        throw new Error('Paire de devises non supportée');
    }

    const fromRate = typeRates[fromKey];
    const toRate = typeRates[toKey];

    return (amount * toRate) / fromRate;
}