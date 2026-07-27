/**
 * StockFlow - Categorías Module
 * Lógica para la gestión de categorías
 */

const CategoryService = {
    STORAGE_KEY: 'stockflow_categorias',

    getAll: () => {
        return Storage.get(CategoryService.STORAGE_KEY) || [];
    },

    saveAll: (categories) => {
        Storage.set(CategoryService.STORAGE_KEY, categories);
    },

    getById: (id) => {
        const categories = CategoryService.getAll();
        return categories.find(c => c.id === id);
    },

    add: (category) => {
        const categories = CategoryService.getAll();
        category.id = 'cat_' + Storage.generateId();
        category.estado = 'Activo';
        categories.push(category);
        CategoryService.saveAll(categories);
        return category;
    },

    update: (id, updatedData) => {
        const categories = CategoryService.getAll();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = { ...categories[index], ...updatedData };
            CategoryService.saveAll(categories);
            return categories[index];
        }
        return null;
    },

    toggleStatus: (id) => {
        const categories = CategoryService.getAll();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index].estado = categories[index].estado === 'Inactivo' ? 'Activo' : 'Inactivo';
            CategoryService.saveAll(categories);
            return categories[index].estado;
        }
        return null;
    }
};

// Controladores de UI (para categorias.html)
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('categoriasTableBody');
    const categoryForm = document.getElementById('categoryForm');
    
    if (tableBody) {
        let categoryModal = null;
        if(document.getElementById('categoryModal')){
            categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
        }

        let currentPage = 1;
        const itemsPerPage = 10;
        let allCategories = CategoryService.getAll();

        const renderTable = () => {
            tableBody.innerHTML = '';
            
            if(allCategories.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron categorías.</td></tr>`;
                if(Helpers.renderPagination) Helpers.renderPagination('categoriasPagination', 0, 1, itemsPerPage, () => {});
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = allCategories.slice(startIndex, endIndex);

            paginated.forEach(c => {
                let badgeClass = c.estado === 'Activo' ? 'bg-success' : 'bg-secondary';
                
                // Contar productos asociados (opcional, si quisieramos mostrarlo)
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold">${c.nombre}</td>
                    <td>${c.descripcion || '-'}</td>
                    <td><span class="badge ${badgeClass}">${c.estado}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-cat-btn" data-id="${c.id}" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary toggle-status-btn" data-id="${c.id}" title="${c.estado === 'Inactivo' ? 'Activar' : 'Desactivar'}">
                            <i class="bi bi-power"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Eventos botones
            document.querySelectorAll('.edit-cat-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const cat = CategoryService.getById(id);
                    if(cat) {
                        document.getElementById('catId').value = cat.id;
                        document.getElementById('nombreCategoria').value = cat.nombre;
                        document.getElementById('descCategoria').value = cat.descripcion || '';
                        document.getElementById('modalTitle').textContent = 'Editar Categoría';
                        categoryModal.show();
                    }
                });
            });

            document.querySelectorAll('.toggle-status-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const newStatus = CategoryService.toggleStatus(id);
                    if(newStatus) {
                        Helpers.showNotification(`Estado cambiado a ${newStatus}`);
                        allCategories = CategoryService.getAll();
                        renderTable();
                    }
                });
            });

            if(Helpers.renderPagination) {
                Helpers.renderPagination('categoriasPagination', allCategories.length, currentPage, itemsPerPage, (newPage) => {
                    currentPage = newPage;
                    renderTable();
                });
            }
        };

        renderTable();

        // Evento botón "Nueva Categoría"
        const btnNew = document.getElementById('btnNewCategory');
        if(btnNew) {
            btnNew.addEventListener('click', () => {
                categoryForm.reset();
                document.getElementById('catId').value = '';
                document.getElementById('modalTitle').textContent = 'Nueva Categoría';
                categoryModal.show();
            });
        }

        // Formulario Guardar
        if(categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('catId').value;
                const data = {
                    nombre: document.getElementById('nombreCategoria').value,
                    descripcion: document.getElementById('descCategoria').value
                };

                if(id) {
                    CategoryService.update(id, data);
                    Helpers.showNotification('Categoría actualizada');
                } else {
                    CategoryService.add(data);
                    Helpers.showNotification('Categoría creada');
                }

                categoryModal.hide();
                allCategories = CategoryService.getAll();
                renderTable();
            });
        }
    }
});

// Helper para poblar selects de categorías (usado en crear-producto.html)
const populateCategorySelect = (selectElementId, selectedValue = '') => {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    // Limpiar opciones, mantener la primera (placeholder)
    const firstOption = select.options[0];
    select.innerHTML = '';
    if (firstOption) select.appendChild(firstOption);
    else select.innerHTML = '<option value="">Seleccione una categoría</option>';

    const activeCategories = CategoryService.getAll().filter(c => c.estado === 'Activo');
    
    activeCategories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.nombre; // En un modelo real guardaríamos el ID, pero mockeamos con nombre para mantener compatibilidad actual
        option.textContent = c.nombre;
        if (selectedValue === c.nombre) option.selected = true;
        select.appendChild(option);
    });
};
