/**
 * StockFlow - Auth Guard
 * Este script debe incluirse en el <head> de TODAS las páginas protegidas.
 * Se encarga de verificar si el token existe ANTES de renderizar el cuerpo,
 * redirigiendo al login si no está autorizado.
 */

(function() {
    // 1. Obtener token del localStorage (solo guardamos un booleano o string simple por ahora)
    const token = localStorage.getItem('stockflow_auth_token');
    
    // 2. Si no hay token, calcular la ruta correcta al index.html y redirigir
    if (!token) {
        // Obtenemos la ruta actual para saber cuántos niveles subir.
        // Ej: /pages/dashboard.html -> subimos 1 nivel (../index.html)
        // Ej: /pages/productos/productos.html -> subimos 2 niveles (../../index.html)
        
        const path = window.location.pathname;
        let prefix = '../';
        
        // Si la URL contiene más niveles, ajustamos (ej: /pages/ventas/nueva-venta.html)
        const parts = path.split('/');
        // parts.length - 1 es el archivo. 
        // Normalmente desde un archivo dentro de pages/module/ estamos a 2 niveles.
        if(path.includes('/pages/')) {
            const afterPages = path.split('/pages/')[1]; // ej: ventas/nueva-venta.html
            const dirs = afterPages.split('/');
            prefix = '../'.repeat(dirs.length);
        }
        
        // Redirigir al login
        window.location.replace(prefix + 'index.html');
    }
})();
