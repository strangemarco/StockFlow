/**
 * StockFlow - Inventario Module
 * Lógica para la gestión de existencias y movimientos
 */

const InventoryService = {
    STORAGE_KEY: 'stockflow_movimientos',

    getAllMovements: () => {
        return Storage.get(InventoryService.STORAGE_KEY) || [];
    },

    saveAllMovements: (movements) => {
        Storage.set(InventoryService.STORAGE_KEY, movements);
    },

    addMovement: (productoId, tipoMovimiento, cantidad, motivo) => {
        // Obtenemos el producto para saber su stock actual
        const product = ProductService.getById(productoId);
        if(!product) return false;

        const stockAnterior = product.stock;
        let stockNuevo = stockAnterior;

        cantidad = parseInt(cantidad);

        if (tipoMovimiento === 'Entrada') {
            stockNuevo += cantidad;
        } else if (tipoMovimiento === 'Salida') {
            if (stockAnterior < cantidad) {
                // No se puede sacar más de lo que hay
                return false; 
            }
            stockNuevo -= cantidad;
        } else if (tipoMovimiento === 'Ajuste') {
            // En ajuste, la cantidad recibida es el nuevo stock real
            stockNuevo = cantidad;
            cantidad = Math.abs(stockNuevo - stockAnterior); // para registro de diferencia
        }

        // Actualizamos el producto
        ProductService.update(productoId, { stock: stockNuevo });

        // Registramos el movimiento
        const movements = InventoryService.getAllMovements();
        const newMovement = {
            id: 'mov_' + Storage.generateId(),
            productoId: productoId,
            productoNombre: product.nombre,
            tipoMovimiento: tipoMovimiento, // Entrada, Salida, Ajuste
            cantidad: cantidad,
            stockAnterior: stockAnterior,
            stockNuevo: stockNuevo,
            motivo: motivo || '',
            fecha: new Date().toISOString()
        };

        movements.push(newMovement);
        InventoryService.saveAllMovements(movements);

        return true;
    }
};

// Controladores de UI
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA INVENTARIO (inventario.html) ---
    const inventarioTableBody = document.getElementById('inventarioTableBody');
    if (inventarioTableBody) {
        let currentProducts = ProductService.getAll().filter(p => p.estado !== 'Inactivo'); // Solo ver activos
        let filteredProducts = [...currentProducts];
        let invCurrentPage = 1;
        const invItemsPerPage = 10;

        let movementModal = null;
        if(document.getElementById('movementModal')){
            movementModal = new bootstrap.Modal(document.getElementById('movementModal'));
        }

        const renderTable = () => {
            inventarioTableBody.innerHTML = '';
            
            if(filteredProducts.length === 0) {
                inventarioTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron productos.</td></tr>`;
                if(Helpers.renderPagination) Helpers.renderPagination('inventarioPagination', 0, 1, invItemsPerPage, () => {});
                return;
            }

            const startIndex = (invCurrentPage - 1) * invItemsPerPage;
            const endIndex = startIndex + invItemsPerPage;
            const paginated = filteredProducts.slice(startIndex, endIndex);

            paginated.forEach(p => {
                let badgeClass = 'bg-success';
                if (p.estado === 'Stock bajo') badgeClass = 'bg-warning text-dark';
                if (p.estado === 'Agotado') badgeClass = 'bg-danger';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.codigo}</td>
                    <td class="fw-bold">${p.nombre}</td>
                    <td>${p.categoriaId}</td>
                    <td>$${parseFloat(p.precioCompra).toFixed(2)}</td>
                    <td class="fw-bold text-center">${p.stock}</td>
                    <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-mov" data-id="${p.id}" data-tipo="Entrada" title="Entrada rápida">
                            <i class="bi bi-box-arrow-in-right"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-mov" data-id="${p.id}" data-tipo="Salida" title="Salida rápida">
                            <i class="bi bi-box-arrow-right"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary btn-mov" data-id="${p.id}" data-tipo="Ajuste" title="Ajuste manual">
                            <i class="bi bi-sliders"></i>
                        </button>
                    </td>
                `;
                inventarioTableBody.appendChild(tr);
            });

            // Eventos para abrir el modal
            document.querySelectorAll('.btn-mov').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnTarget = e.currentTarget;
                    const id = btnTarget.getAttribute('data-id');
                    const tipo = btnTarget.getAttribute('data-tipo');
                    const product = ProductService.getById(id);

                    if(product) {
                        document.getElementById('movProductoId').value = product.id;
                        document.getElementById('movProductoNombre').value = product.nombre;
                        document.getElementById('movTipo').value = tipo;
                        document.getElementById('movCantidad').value = '';
                        document.getElementById('movMotivo').value = '';

                        // Si es ajuste, cambiar label
                        const lblCantidad = document.getElementById('lblCantidad');
                        if (tipo === 'Ajuste') {
                            lblCantidad.textContent = 'Nuevo Stock Real';
                            document.getElementById('movCantidad').value = product.stock;
                        } else {
                            lblCantidad.textContent = `Cantidad de ${tipo}`;
                        }

                        document.getElementById('movModalTitle').textContent = `Registrar ${tipo} - ${product.nombre}`;
                        movementModal.show();
                    }
                });
            });

            if(Helpers.renderPagination) {
                Helpers.renderPagination('inventarioPagination', filteredProducts.length, invCurrentPage, invItemsPerPage, (newPage) => {
                    invCurrentPage = newPage;
                    renderTable();
                });
            }
        };
        
        const applyInvFilters = () => {
            const term = (document.getElementById('searchInventario')?.value || '').toLowerCase();
            const status = document.getElementById('filterInvEstado')?.value || '';
            
            filteredProducts = currentProducts.filter(p => {
                const matchSearch = p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term);
                const matchStatus = status ? p.estado === status : true;
                return matchSearch && matchStatus;
            });
            invCurrentPage = 1;
            renderTable();
        };

        renderTable();

        // Búsqueda y Filtros
        const searchInput = document.getElementById('searchInventario');
        if(searchInput) {
            searchInput.addEventListener('input', applyInvFilters);
        }

        const filterEstado = document.getElementById('filterInvEstado');
        if(filterEstado) {
            filterEstado.addEventListener('change', applyInvFilters);
        }

        // Formulario de Movimiento
        const movForm = document.getElementById('movementForm');
        if (movForm) {
            movForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const id = document.getElementById('movProductoId').value;
                const tipo = document.getElementById('movTipo').value;
                const cantidad = document.getElementById('movCantidad').value;
                const motivo = document.getElementById('movMotivo').value;

                const success = InventoryService.addMovement(id, tipo, cantidad, motivo);

                if (success) {
                    Helpers.showNotification('Movimiento registrado correctamente');
                    movementModal.hide();
                    // Volver a renderizar la tabla con datos frescos
                    currentProducts = ProductService.getAll().filter(p => p.estado !== 'Inactivo');
                    applyInvFilters();
                } else {
                    Helpers.showNotification('Error al registrar movimiento (¿Stock insuficiente para salida?)', 'error');
                }
            });
        }
    }

    // --- LÓGICA PARA BITÁCORA DE MOVIMIENTOS (movimientos.html) ---
    const movimientosTableBody = document.getElementById('movimientosTableBody');
    if (movimientosTableBody) {
        let movCurrentPage = 1;
        const movItemsPerPage = 10;
        let allMovements = InventoryService.getAllMovements().reverse();

        const renderMovTable = () => {
            movimientosTableBody.innerHTML = '';
            
            if(allMovements.length === 0) {
                movimientosTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay movimientos registrados.</td></tr>`;
                if(Helpers.renderPagination) Helpers.renderPagination('movimientosPagination', 0, 1, movItemsPerPage, () => {});
                return;
            }

            const startIndex = (movCurrentPage - 1) * movItemsPerPage;
            const endIndex = startIndex + movItemsPerPage;
            const paginated = allMovements.slice(startIndex, endIndex);

            paginated.forEach(m => {
                let textClass = 'text-success';
                let icon = 'bi-arrow-up-right';
                
                if (m.tipoMovimiento === 'Salida') {
                    textClass = 'text-danger';
                    icon = 'bi-arrow-down-right';
                } else if (m.tipoMovimiento === 'Ajuste') {
                    textClass = 'text-warning text-dark';
                    icon = 'bi-sliders';
                }

                const fecha = new Date(m.fecha).toLocaleString();

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${fecha}</td>
                    <td class="fw-bold">${m.productoNombre}</td>
                    <td><span class="${textClass}"><i class="bi ${icon} me-1"></i>${m.tipoMovimiento}</span></td>
                    <td>${m.cantidad}</td>
                    <td>${m.stockAnterior}</td>
                    <td class="fw-bold">${m.stockNuevo}</td>
                    <td>${m.motivo || '-'}</td>
                `;
                movimientosTableBody.appendChild(tr);
            });

            if(Helpers.renderPagination) {
                Helpers.renderPagination('movimientosPagination', allMovements.length, movCurrentPage, movItemsPerPage, (newPage) => {
                    movCurrentPage = newPage;
                    renderMovTable();
                });
            }
        };

        renderMovTable();
    }
});
