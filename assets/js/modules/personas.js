/**
 * StockFlow - Personas Module
 * Lógica para la gestión de Clientes y Proveedores
 */

const PersonService = {
    STORAGE_KEY: 'stockflow_personas',

    getAll: () => {
        return Storage.get(PersonService.STORAGE_KEY) || [];
    },

    saveAll: (personas) => {
        Storage.set(PersonService.STORAGE_KEY, personas);
    },

    getById: (id) => {
        const personas = PersonService.getAll();
        return personas.find(p => p.id === id);
    },

    create: (data) => {
        const personas = PersonService.getAll();
        const persona = {
            id: 'per_' + Storage.generateId(),
            ...data,
            fechaRegistro: new Date().toISOString()
        };
        personas.push(persona);
        PersonService.saveAll(personas);
        return persona;
    },

    update: (id, data) => {
        const personas = PersonService.getAll();
        const index = personas.findIndex(p => p.id === id);
        if (index !== -1) {
            personas[index] = { ...personas[index], ...data };
            PersonService.saveAll(personas);
            return true;
        }
        return false;
    },

    // Métodos útiles para Ventas y Compras
    getClients: () => {
        return PersonService.getAll().filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos');
    },

    getSuppliers: () => {
        return PersonService.getAll().filter(p => p.tipo === 'Proveedor' || p.tipo === 'Ambos');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // Inyectar datos iniciales si está vacío (Ej: Consumidor Final)
    if (PersonService.getAll().length === 0) {
        PersonService.create({
            nombre: 'Consumidor Final',
            tipo: 'Cliente',
            documento: 'S/N',
            telefono: '',
            email: '',
            direccion: ''
        });
        PersonService.create({
            nombre: 'Proveedor General',
            tipo: 'Proveedor',
            documento: 'S/N',
            telefono: '',
            email: '',
            direccion: ''
        });
    }

    const personasTableBody = document.getElementById('personasTableBody');
    if (personasTableBody) {
        let allPersonas = PersonService.getAll().reverse();
        let filteredPersonas = [...allPersonas];
        let currentPage = 1;
        const itemsPerPage = 10;
        
        let personaModal = null;
        if(document.getElementById('personaModal')){
            personaModal = new bootstrap.Modal(document.getElementById('personaModal'));
        }

        const renderTable = () => {
            personasTableBody.innerHTML = '';
            
            if(filteredPersonas.length === 0) {
                personasTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron personas.</td></tr>`;
                if(Helpers.renderPagination) Helpers.renderPagination('personasPagination', 0, 1, itemsPerPage, () => {});
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filteredPersonas.slice(startIndex, endIndex);

            paginated.forEach(p => {
                let badgeClass = 'bg-secondary';
                if(p.tipo === 'Cliente') badgeClass = 'bg-primary';
                if(p.tipo === 'Proveedor') badgeClass = 'bg-success';
                if(p.tipo === 'Ambos') badgeClass = 'bg-info text-dark';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold">${p.nombre}</td>
                    <td><span class="badge ${badgeClass}">${p.tipo}</span></td>
                    <td>${p.documento || '-'}</td>
                    <td>${p.telefono || '-'}</td>
                    <td>${p.email || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${p.id}" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                `;
                personasTableBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const persona = PersonService.getById(id);
                    if (persona) {
                        document.getElementById('personaId').value = persona.id;
                        document.getElementById('personaNombre').value = persona.nombre;
                        document.getElementById('personaTipo').value = persona.tipo;
                        document.getElementById('personaDoc').value = persona.documento || '';
                        document.getElementById('personaTel').value = persona.telefono || '';
                        document.getElementById('personaEmail').value = persona.email || '';
                        document.getElementById('personaDir').value = persona.direccion || '';
                        
                        document.getElementById('personaModalTitle').textContent = 'Editar Persona';
                        personaModal.show();
                    }
                });
            });

            if(Helpers.renderPagination) {
                Helpers.renderPagination('personasPagination', filteredPersonas.length, currentPage, itemsPerPage, (newPage) => {
                    currentPage = newPage;
                    renderTable();
                });
            }
        };

        const applyFilters = () => {
            const term = (document.getElementById('searchPersona')?.value || '').toLowerCase();
            const tipo = document.getElementById('filterTipo')?.value || '';
            
            filteredPersonas = allPersonas.filter(p => {
                const matchSearch = p.nombre.toLowerCase().includes(term) || (p.documento || '').toLowerCase().includes(term);
                const matchTipo = tipo ? p.tipo === tipo : true;
                return matchSearch && matchTipo;
            });
            currentPage = 1;
            renderTable();
        };

        renderTable();

        const searchInput = document.getElementById('searchPersona');
        if(searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }

        const filterTipo = document.getElementById('filterTipo');
        if(filterTipo) {
            filterTipo.addEventListener('change', applyFilters);
        }

        // Formulario
        const formPersona = document.getElementById('formPersona');
        if(formPersona) {
            formPersona.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('personaId').value;
                const data = {
                    nombre: document.getElementById('personaNombre').value.trim(),
                    tipo: document.getElementById('personaTipo').value,
                    documento: document.getElementById('personaDoc').value.trim(),
                    telefono: document.getElementById('personaTel').value.trim(),
                    email: document.getElementById('personaEmail').value.trim(),
                    direccion: document.getElementById('personaDir').value.trim()
                };

                if (id) {
                    PersonService.update(id, data);
                    Helpers.showNotification('Persona actualizada correctamente');
                } else {
                    PersonService.create(data);
                    Helpers.showNotification('Persona registrada correctamente');
                }

                formPersona.reset();
                document.getElementById('personaId').value = '';
                personaModal.hide();
                
                allPersonas = PersonService.getAll().reverse();
                applyFilters();
            });
        }
        
        // Limpiar form al crear nuevo
        const btnNuevaPersona = document.getElementById('btnNuevaPersona');
        if(btnNuevaPersona) {
            btnNuevaPersona.addEventListener('click', () => {
                formPersona.reset();
                document.getElementById('personaId').value = '';
                document.getElementById('personaModalTitle').textContent = 'Nueva Persona';
            });
        }
    }
});
