/**
 * StockFlow - Auth Logic
 * Maneja el inicio de sesión en index.html
 */

document.addEventListener('DOMContentLoaded', () => {

    // Redirigir al dashboard si ya hay sesión
    if (localStorage.getItem('stockflow_auth_token')) {
        window.location.replace('pages/dashboard.html');
        return;
    }

    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const user = document.getElementById('loginUsername').value;
            const pass = document.getElementById('loginPassword').value;
            const errorMsg = document.getElementById('loginError');

            // Hardcoded credentials for Demo
            if (user === 'admin' && pass === 'admin123') {
                errorMsg.classList.add('d-none');
                
                // Guardar token de sesión
                localStorage.setItem('stockflow_auth_token', 'true');
                
                // Redirigir
                window.location.replace('pages/dashboard.html');
            } else {
                errorMsg.classList.remove('d-none');
            }
        });
    }
});
