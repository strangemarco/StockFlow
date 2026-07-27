/**
 * StockFlow - Theme Manager
 * Se ejecuta lo antes posible para evitar el destello blanco (FOUC).
 */
(function() {
    const getStoredTheme = () => {
        try {
            const data = localStorage.getItem('stockflow_theme');
            return data ? JSON.parse(data) : 'system';
        } catch (e) {
            return 'system';
        }
    };

    const applyTheme = (theme) => {
        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-bs-theme', systemPrefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme);
        }
    };

    // Aplicar inmediatamente
    applyTheme(getStoredTheme());

    // Escuchar cambios del sistema si está en 'system'
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = getStoredTheme();
        if (storedTheme === 'system') {
            applyTheme('system');
        }
    });
})();
