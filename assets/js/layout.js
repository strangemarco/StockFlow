/**
 * StockFlow - Layout.js
 * Lógica para el comportamiento del Layout (Sidebar, Navbar, etc.)
 */

document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (sidebarToggleBtn && sidebar && mainContent) {
        sidebarToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Si es pantalla pequeña, alternar la clase 'show' en lugar de 'collapsed'
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('show');
            } else {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('collapsed');
            }
        });
    }

    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('collapsed');
        } else {
            sidebar.classList.remove('show');
        }
    });

    // Manejar el botón de Salir (Logout)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            // Eliminar token de sesión
            localStorage.removeItem('stockflow_auth_token');
            
            // Calcular ruta al index
            const path = window.location.pathname;
            let prefix = '../';
            if(path.includes('/pages/')) {
                const afterPages = path.split('/pages/')[1]; 
                const dirs = afterPages.split('/');
                prefix = '../'.repeat(dirs.length);
            }
            
            // Redirigir al login
            window.location.replace(prefix + 'index.html');
        });
    }
});
