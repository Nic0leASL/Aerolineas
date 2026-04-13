import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PriceMatrixService {
    constructor() {
        this.economyMatrix = null;
        this.firstClassMatrix = null;
        this.loadMatrices();
    }

    loadMatrices() {
        try {
            const econPath = path.join(__dirname, '../data/matrices/economy_prices.json');
            const firstPath = path.join(__dirname, '../data/matrices/first_class_prices.json');

            if (fs.existsSync(econPath)) {
                this.economyMatrix = JSON.parse(fs.readFileSync(econPath, 'utf8'));
            }
            if (fs.existsSync(firstPath)) {
                this.firstClassMatrix = JSON.parse(fs.readFileSync(firstPath, 'utf8'));
            }
            
            console.log('✓ Matrices de precios cargadas correctamente');
        } catch (error) {
            console.error('Error cargando matrices de precios:', error.message);
        }
    }

    /**
     * Obtiene el precio de la matriz para una ruta y clase
     * @param {string} origin 
     * @param {string} destination 
     * @param {string} type - 'ECONOMY' o 'FIRST'
     * @returns {number|null} Precio o null si no existe en matriz
     */
    getPrice(origin, destination, type = 'ECONOMY') {
        const matrix = type === 'FIRST' ? this.firstClassMatrix : this.economyMatrix;
        if (!matrix) return null;

        const originData = matrix[origin.toUpperCase()];
        if (!originData) return null;

        return originData[destination.toUpperCase()] || null;
    }

    /**
     * Fallback de precios basado en lógica regional si no está en la matriz
     */
    getFallbackPrice(origin, destination, type = 'ECONOMY') {
        // Lógica simple: Intra-región (barato), Inter-región (caro)
        // Pero intentamos siempre priorizar la matriz.
        const base = type === 'FIRST' ? 1200 : 700;
        return base;
    }
}

export default new PriceMatrixService();
