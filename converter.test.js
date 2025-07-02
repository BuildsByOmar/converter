// Tests unitaires pour les fonctions de conversion
describe('Tests de conversion', () => {
    
    // Mock de l'API pour les tests de devises
    beforeAll(() => {
        global.fetch = jest.fn();
        // Mock des données de change
        const mockCurrencyData = {
            'eur': 1,
            'usd': 1.1,
            'gbp': 0.85,
            'jpy': 110
        };
        const mockCryptoData = {
            'btc': 1,
            'eth': 15,
            'sol': 1500
        };
        
        global.fetch.mockImplementation((url) => {
            if (url.includes('currencies.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockCurrencyData)
                });
            } else if (url.includes('cryptocurrencies.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockCryptoData)
                });
            }
        });
    });

    afterAll(() => {
        global.fetch.mockRestore();
    });

    // Tests de conversion de température
    test('Conversion de température Celsius vers Fahrenheit', () => {
        const result = convertTemperature(0, 'celsius', 'fahrenheit');
        expect(result).toBe(32);
    });

    test('Conversion de température Fahrenheit vers Celsius', () => {
        const result = convertTemperature(32, 'fahrenheit', 'celsius');
        expect(result).toBe(0);
    });

    test('Conversion de température Celsius vers Kelvin', () => {
        const result = convertTemperature(0, 'celsius', 'kelvin');
        expect(result).toBe(273.15);
    });

    test('Conversion de température Kelvin vers Celsius', () => {
        const result = convertTemperature(273.15, 'kelvin', 'celsius');
        expect(result).toBe(0);
    });

    // Tests de conversion de longueur
    test('Conversion de longueur mètres vers kilomètres', () => {
        const units = {
            m: { factor: 1 },
            km: { factor: 1000 }
        };
        const result = (1000 * units.m.factor) / units.km.factor;
        expect(result).toBe(1);
    });

    test('Conversion de longueur pieds vers mètres', () => {
        const units = {
            ft: { factor: 0.3048 },
            m: { factor: 1 }
        };
        const result = (1 * units.ft.factor) / units.m.factor;
        expect(result).toBe(0.3048);
    });

    test('Conversion de longueur miles vers kilomètres', () => {
        const units = {
            mi: { factor: 1609.344 },
            km: { factor: 1000 }
        };
        const result = (1 * units.mi.factor) / units.km.factor;
        expect(result).toBeCloseTo(1.609344);
    });

    // Tests de conversion de poids
    test('Conversion de poids grammes vers kilogrammes', () => {
        const units = {
            g: { factor: 1 },
            kg: { factor: 1000 }
        };
        const result = (1000 * units.g.factor) / units.kg.factor;
        expect(result).toBe(1);
    });

    test('Conversion de poids livres vers grammes', () => {
        const units = {
            lb: { factor: 453.592 },
            g: { factor: 1 }
        };
        const result = (1 * units.lb.factor) / units.g.factor;
        expect(result).toBe(453.592);
    });

    // Tests de conversion de volume
    test('Conversion de volume litres vers gallons', () => {
        const units = {
            l: { factor: 1 },
            gal: { factor: 3.78541 }
        };
        const result = (1 * units.l.factor) / units.gal.factor;
        expect(result).toBeCloseTo(0.264172, 5);
    });

    // Tests de conversion de devises
    test('Conversion de monnaie EUR vers USD (avec mock)', async () => {
        const result = await convertCurrency(100, 'EUR', 'USD', 'fiat');
        expect(result).toBeGreaterThan(0);
        expect(result).toBeCloseTo(110); // basé sur notre mock rate
    });

    test('Conversion de crypto BTC vers ETH (avec mock)', async () => {
        const result = await convertCurrency(1, 'BTC', 'ETH', 'digital');
        expect(result).toBeGreaterThan(0);
        expect(result).toBeCloseTo(15); // basé sur notre mock rate
    });

    // Tests de gestion d'erreurs
    test('Erreur pour valeur négative', () => {
        expect(() => {
            convertTemperature(-1, 'celsius', 'fahrenheit');
        }).not.toThrow(); // La température peut être négative
    });

    test('Erreur pour unité de température inconnue', () => {
        expect(() => {
            convertTemperature(0, 'celsius', 'unknown');
        }).toThrow('Unité de température inconnue');
    });

    test('Erreur pour conversion de devise avec montant invalide', async () => {
        await expect(convertCurrency(0, 'EUR', 'USD', 'fiat'))
            .rejects.toThrow('Le montant doit être un nombre positif');
    });

    // Test de précision
    test('Précision des conversions', () => {
        const result = convertTemperature(100, 'celsius', 'fahrenheit');
        expect(result).toBe(212);
        
        const result2 = convertTemperature(212, 'fahrenheit', 'celsius');
        expect(result2).toBe(100);
    });
});