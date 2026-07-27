/**
 * StockFlow - Storage.js
 * Utilidades para el manejo de LocalStorage
 */

const Storage = {
    // Obtener datos
    get: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Guardar datos
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Eliminar un elemento
    remove: (key) => {
        localStorage.removeItem(key);
    },

    // Generar un ID único basado en timestamp
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
