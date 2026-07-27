/**
 * StockFlow - Usuarios Module
 * Lógica para la gestión de Accesos (Usuarios)
 */

const UserService = {
    STORAGE_KEY: 'stockflow_usuarios',

    getAll: () => {
        return Storage.get(UserService.STORAGE_KEY) || [];
    },

    saveAll: (users) => {
        Storage.set(UserService.STORAGE_KEY, users);
    },

    getById: (id) => {
        const users = UserService.getAll();
        return users.find(u => u.id === id);
    },

    create: (data) => {
        const users = UserService.getAll();
        const user = {
            id: 'usr_' + Storage.generateId(),
            ...data,
            fechaRegistro: new Date().toISOString()
        };
        users.push(user);
        UserService.saveAll(users);
        return user;
    },

    update: (id, data) => {
        const users = UserService.getAll();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...data };
            UserService.saveAll(users);
            return true;
        }
        return false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // Inyectar datos iniciales si está vacío (Ej: Admin)
    if (UserService.getAll().length === 0) {
        UserService.create({
            nombre: 'Administrador del Sistema',
            username: 'admin',
            rol: 'Administrador',
            estado: 'Activo'
        });
    }

    const usuariosTableBody = document.getElementById('usuariosTableBody');
    if (usuariosTableBody) {
        let allUsers = UserService.getAll().reverse();
        
        let usuarioModal = null;
        if(document.getElementById('usuarioModal')){
            usuarioModal = new bootstrap.Modal(document.getElementById('usuarioModal'));
        }

        const renderTable = () => {
            usuariosTableBody.innerHTML = '';
            
            if(allUsers.length === 0) {
                usuariosTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron usuarios.</td></tr>`;
                return;
            }

            allUsers.forEach(u => {
                let roleClass = 'bg-secondary';
                if(u.rol === 'Administrador') roleClass = 'bg-danger';
                if(u.rol === 'Cajero') roleClass = 'bg-primary';
                if(u.rol === 'Visor') roleClass = 'bg-info text-dark';

                const stateBadge = u.estado === 'Activo' 
                    ? `<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle">Activo</span>`
                    : `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">Inactivo</span>`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold">${u.nombre}</td>
                    <td>@${u.username}</td>
                    <td><span class="badge ${roleClass}">${u.rol}</span></td>
                    <td>${stateBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${u.id}" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                `;
                usuariosTableBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const user = UserService.getById(id);
                    if (user) {
                        document.getElementById('userId').value = user.id;
                        document.getElementById('userNombre').value = user.nombre;
                        document.getElementById('userUsername').value = user.username;
                        document.getElementById('userRol').value = user.rol;
                        document.getElementById('userEstado').value = user.estado;
                        document.getElementById('userPassword').value = '';
                        
                        document.getElementById('usuarioModalTitle').textContent = 'Editar Usuario';
                        usuarioModal.show();
                    }
                });
            });
        };

        renderTable();

        // Formulario
        const formUsuario = document.getElementById('formUsuario');
        if(formUsuario) {
            formUsuario.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('userId').value;
                const data = {
                    nombre: document.getElementById('userNombre').value.trim(),
                    username: document.getElementById('userUsername').value.trim(),
                    rol: document.getElementById('userRol').value,
                    estado: document.getElementById('userEstado').value
                };

                if (id) {
                    UserService.update(id, data);
                    Helpers.showNotification('Usuario actualizado correctamente');
                } else {
                    UserService.create(data);
                    Helpers.showNotification('Usuario creado correctamente');
                }

                formUsuario.reset();
                document.getElementById('userId').value = '';
                usuarioModal.hide();
                
                allUsers = UserService.getAll().reverse();
                renderTable();
            });
        }
        
        // Limpiar form al crear nuevo
        const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
        if(btnNuevoUsuario) {
            btnNuevoUsuario.addEventListener('click', () => {
                formUsuario.reset();
                document.getElementById('userId').value = '';
                document.getElementById('usuarioModalTitle').textContent = 'Nuevo Usuario';
            });
        }
    }
});
