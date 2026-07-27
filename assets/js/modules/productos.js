/**
 * StockFlow - Productos Module
 * Lógica para la gestión de productos
 */

const ProductService = {
    STORAGE_KEY: 'stockflow_productos',

    getAll: () => {
        return Storage.get(ProductService.STORAGE_KEY) || [];
    },

    saveAll: (products) => {
        Storage.set(ProductService.STORAGE_KEY, products);
    },

    getById: (id) => {
        const products = ProductService.getAll();
        return products.find(p => p.id === id);
    },

    add: (product) => {
        const products = ProductService.getAll();
        product.id = 'prod_' + Storage.generateId();
        
        // Evaluar estado inicial basado en stock
        product.estado = ProductService.calculateStatus(product.stock, product.stockMinimo);
        
        products.push(product);
        ProductService.saveAll(products);
        return product;
    },

    update: (id, updatedData) => {
        const products = ProductService.getAll();
        const index = products.findIndex(p => p.id === id);
        
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedData };
            // Re-evaluar estado basado en stock actual
            products[index].estado = ProductService.calculateStatus(products[index].stock, products[index].stockMinimo);
            ProductService.saveAll(products);
            return products[index];
        }
        return null;
    },

    calculateStatus: (stock, stockMinimo) => {
        if (stock <= 0) return 'Agotado';
        if (stock <= stockMinimo) return 'Stock bajo';
        return 'Activo';
    },

    toggleStatus: (id) => {
        const products = ProductService.getAll();
        const index = products.findIndex(p => p.id === id);
        
        if (index !== -1) {
            products[index].estado = products[index].estado === 'Inactivo' ? 'Activo' : 'Inactivo';
            // Recalcular estado real si se activó de nuevo
            if(products[index].estado === 'Activo') {
                 products[index].estado = ProductService.calculateStatus(products[index].stock, products[index].stockMinimo);
            }
            ProductService.saveAll(products);
            return products[index].estado;
        }
        return null;
    }
};

// Controladores de UI
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA PARA LISTADO (productos.html) ---
    const tableBody = document.getElementById('productosTableBody');
    if (tableBody) {
        let currentProducts = ProductService.getAll();
        let filteredProducts = [...currentProducts];
        let currentPage = 1;
        const itemsPerPage = 10;
        
        const renderTable = () => {
            tableBody.innerHTML = '';
            
            if(filteredProducts.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No se encontraron productos.</td></tr>`;
                if(Helpers.renderPagination) Helpers.renderPagination('productosPagination', 0, 1, itemsPerPage, () => {});
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filteredProducts.slice(startIndex, endIndex);

            paginated.forEach(p => {
                let badgeClass = 'bg-success';
                if (p.estado === 'Stock bajo') badgeClass = 'bg-warning text-dark';
                if (p.estado === 'Agotado') badgeClass = 'bg-danger';
                if (p.estado === 'Inactivo') badgeClass = 'bg-secondary';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.codigo}</td>
                    <td class="fw-bold">${p.nombre}</td>
                    <td>${p.categoriaId}</td>
                    <td>$${parseFloat(p.precioVenta).toFixed(2)}</td>
                    <td>${p.stock}</td>
                    <td>${p.stockMinimo}</td>
                    <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                    <td>
                        <a href="crear-producto.html?id=${p.id}" class="btn btn-sm btn-outline-primary" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-secondary toggle-status-btn" data-id="${p.id}" title="${p.estado === 'Inactivo' ? 'Activar' : 'Desactivar'}">
                            <i class="bi bi-power"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Agregar eventos a botones de estado
            document.querySelectorAll('.toggle-status-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const newStatus = ProductService.toggleStatus(id);
                    if(newStatus) {
                        Helpers.showNotification(`Estado cambiado a ${newStatus}`);
                        currentProducts = ProductService.getAll();
                        applyFilters();
                    }
                });
            });

            if(Helpers.renderPagination) {
                Helpers.renderPagination('productosPagination', filteredProducts.length, currentPage, itemsPerPage, (newPage) => {
                    currentPage = newPage;
                    renderTable();
                });
            }
        };

        const applyFilters = () => {
            const term = (document.getElementById('searchProducto')?.value || '').toLowerCase();
            const status = document.getElementById('filterEstado')?.value || '';
            
            filteredProducts = currentProducts.filter(p => {
                const matchSearch = p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term);
                const matchStatus = status ? p.estado === status : true;
                return matchSearch && matchStatus;
            });
            currentPage = 1;
            renderTable();
        };

        renderTable();

        // Búsqueda
        const searchInput = document.getElementById('searchProducto');
        if(searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }
        
        // Filtro por Estado
        const filterEstado = document.getElementById('filterEstado');
        if(filterEstado) {
            filterEstado.addEventListener('change', applyFilters);
        }
    }


    // --- LÓGICA PARA FORMULARIO (crear-producto.html) ---
    const formProduct = document.getElementById('formProduct');
    if (formProduct) {
        const idToEdit = Helpers.getUrlParam('id');
        const formTitle = document.getElementById('formTitle');
        let productToEdit = idToEdit ? ProductService.getById(idToEdit) : null;
        
        // Poblar categorías dinámicamente
        if (typeof populateCategorySelect === 'function') {
            populateCategorySelect('categoriaId', productToEdit ? productToEdit.categoriaId : '');
        }
        
        // Si hay ID, cargar datos para editar
        if (idToEdit) {
            formTitle.textContent = "Editar Producto";
            const p = productToEdit;
            if (p) {
                document.getElementById('codigo').value = p.codigo;
                document.getElementById('codigoBarras').value = p.codigoBarras || '';
                document.getElementById('nombre').value = p.nombre;
                document.getElementById('descripcion').value = p.descripcion || '';
                document.getElementById('categoriaId').value = p.categoriaId;
                document.getElementById('precioCompra').value = p.precioCompra;
                document.getElementById('precioVenta').value = p.precioVenta;
                document.getElementById('stock').value = p.stock;
                document.getElementById('stockMinimo').value = p.stockMinimo;
            } else {
                Helpers.showNotification("Producto no encontrado", "error");
            }
        } else {
            // Generar valores automáticos para un nuevo producto
            const currentCount = ProductService.getAll().length;
            document.getElementById('codigo').value = `PROD-${(currentCount + 1).toString().padStart(3, '0')}`;
            document.getElementById('codigoBarras').value = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
        }

        formProduct.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const productData = {
                codigo: document.getElementById('codigo').value,
                codigoBarras: document.getElementById('codigoBarras').value,
                nombre: document.getElementById('nombre').value,
                descripcion: document.getElementById('descripcion').value,
                categoriaId: document.getElementById('categoriaId').value,
                precioCompra: parseFloat(document.getElementById('precioCompra').value),
                precioVenta: parseFloat(document.getElementById('precioVenta').value),
                stock: parseInt(document.getElementById('stock').value),
                stockMinimo: parseInt(document.getElementById('stockMinimo').value)
            };

            if (idToEdit) {
                ProductService.update(idToEdit, productData);
                Helpers.showNotification("Producto actualizado correctamente");
            } else {
                ProductService.add(productData);
                Helpers.showNotification("Producto creado correctamente");
            }

            // Redirigir al listado
            setTimeout(() => {
                window.location.href = 'productos.html';
            }, 1000);
        });
    }
});
