/**
 * StockFlow - App.js
 * Archivo principal de inicialización de la aplicación.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('StockFlow inicializado.');
    
    // Inicializar tooltips de Bootstrap si existen
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (typeof bootstrap !== 'undefined' && tooltipTriggerList.length > 0) {
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
});
