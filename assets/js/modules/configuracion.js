/**
 * StockFlow - Configuración Module
 * Lógica para cambiar el tema visual
 */

document.addEventListener('DOMContentLoaded', () => {

    const formTheme = document.getElementById('formTheme');
    if (formTheme) {
        // Leer configuración actual y marcar el radio button correcto
        const getStoredTheme = () => {
            try {
                const data = localStorage.getItem('stockflow_theme');
                return data ? JSON.parse(data) : 'system';
            } catch (e) {
                return 'system';
            }
        };

        const currentTheme = getStoredTheme();
        const radios = document.getElementsByName('themeRadio');
        
        radios.forEach(r => {
            if (r.value === currentTheme) {
                r.checked = true;
            }

            // Escuchar cambios
            r.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                localStorage.setItem('stockflow_theme', JSON.stringify(newTheme));
                
                // Aplicar el tema inmediatamente
                if (newTheme === 'system') {
                    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-bs-theme', systemPrefersDark ? 'dark' : 'light');
                } else {
                    document.documentElement.setAttribute('data-bs-theme', newTheme);
                }
                
                Helpers.showNotification(`Tema cambiado a ${newTheme === 'dark' ? 'Oscuro' : (newTheme === 'light' ? 'Claro' : 'Sistema')}.`);
            });
        });
    }

});
