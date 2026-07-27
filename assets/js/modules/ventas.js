/**
 * StockFlow - Ventas Module
 * Lógica para el Punto de Venta (POS) y el Historial de Ventas
 */

const SaleService = {
    STORAGE_KEY: 'stockflow_ventas',

    getAll: () => {
        return Storage.get(SaleService.STORAGE_KEY) || [];
    },

    saveAll: (sales) => {
        Storage.set(SaleService.STORAGE_KEY, sales);
    },

    getById: (id) => {
        const sales = SaleService.getAll();
        return sales.find(s => s.id === id);
    },

    generateTicketNumber: () => {
        const sales = SaleService.getAll();
        const count = sales.length + 1;
        return `TICKET-${count.toString().padStart(5, '0')}`;
    },

    processSale: (cart, cliente, totalAmount) => {
        if (!cart || cart.length === 0) return false;

        const sales = SaleService.getAll();
        const ticketNumber = SaleService.generateTicketNumber();
        const date = new Date().toISOString();

        const sale = {
            id: 'sale_' + Storage.generateId(),
            ticket: ticketNumber,
            fecha: date,
            cliente: cliente || 'Cliente Final',
            total: totalAmount,
            items: cart
        };

        // Descontar inventario y registrar movimiento
        let stockError = false;
        cart.forEach(item => {
            // Usamos InventoryService para registrar la salida
            const success = InventoryService.addMovement(
                item.producto.id, 
                'Salida', 
                item.cantidad, 
                `Venta ${ticketNumber}`
            );
            if (!success) stockError = true;
        });

        if (stockError) {
            // En un sistema real haríamos rollback. Aquí permitimos que siga pero notificamos si algo falló.
            console.warn("Algunos productos no tenían stock suficiente o falló el descuento.");
        }

        sales.push(sale);
        SaleService.saveAll(sales);

        return sale;
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // LÓGICA PARA NUEVA VENTA (POS)
    // ==========================================
    const posProductList = document.getElementById('posProductList');
    if (posProductList) {
        let cart = [];
        let posProducts = ProductService.getAll().filter(p => p.estado !== 'Inactivo');

        const renderPosProducts = (products) => {
            posProductList.innerHTML = '';
            
            if(products.length === 0) {
                posProductList.innerHTML = `<div class="col-12 text-center text-muted py-5">No se encontraron productos.</div>`;
                return;
            }

            products.forEach(p => {
                const stockBadge = p.stock > 0 
                    ? `<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle">Stock: ${p.stock}</span>`
                    : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">Agotado</span>`;
                
                const card = document.createElement('div');
                card.className = 'col-sm-6 col-md-4 col-xl-3';
                card.innerHTML = `
                    <div class="card h-100 product-card border shadow-sm ${p.stock <= 0 ? 'opacity-50' : ''}" data-id="${p.id}">
                        <div class="card-body p-3 text-center d-flex flex-column">
                            <h6 class="fw-bold mb-1 text-truncate" title="${p.nombre}">${p.nombre}</h6>
                            <small class="text-muted d-block mb-2">${p.codigo}</small>
                            <div class="mt-auto">
                                <h5 class="text-primary fw-bold mb-2">$${parseFloat(p.precioVenta).toFixed(2)}</h5>
                                ${stockBadge}
                            </div>
                        </div>
                    </div>
                `;
                
                if (p.stock > 0) {
                    card.querySelector('.product-card').addEventListener('click', () => addToCart(p));
                }
                posProductList.appendChild(card);
            });
        };

        const renderCart = () => {
            const cartItemsContainer = document.getElementById('posCartItems');
            cartItemsContainer.innerHTML = '';
            
            let totalItems = 0;
            let totalAmount = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="text-center text-muted mt-5 h-100 d-flex flex-column justify-content-center">
                        <i class="bi bi-cart-x fs-1 opacity-50 mb-2"></i>
                        <p>El carrito está vacío</p>
                    </div>`;
                document.getElementById('btnProcesarVenta').disabled = true;
            } else {
                cart.forEach((item, index) => {
                    totalItems += item.cantidad;
                    const subtotal = item.cantidad * item.producto.precioVenta;
                    totalAmount += subtotal;

                    const row = document.createElement('div');
                    row.className = 'd-flex justify-content-between align-items-center border-bottom pb-2 mb-2';
                    row.innerHTML = `
                        <div class="me-2 text-truncate" style="flex: 1;">
                            <div class="fw-bold text-truncate" title="${item.producto.nombre}">${item.producto.nombre}</div>
                            <div class="text-muted small">$${parseFloat(item.producto.precioVenta).toFixed(2)} x ${item.cantidad}</div>
                        </div>
                        <div class="fw-bold me-3">$${subtotal.toFixed(2)}</div>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-light border px-2 py-0 btn-minus" data-index="${index}">-</button>
                            <span class="mx-2 fw-bold">${item.cantidad}</span>
                            <button class="btn btn-sm btn-light border px-2 py-0 btn-plus" data-index="${index}">+</button>
                            <button class="btn btn-sm btn-outline-danger border-0 ms-2 btn-remove" data-index="${index}">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>
                    `;
                    cartItemsContainer.appendChild(row);
                });
                document.getElementById('btnProcesarVenta').disabled = false;
            }

            document.getElementById('posTotalItems').textContent = totalItems;
            document.getElementById('posTotalAmount').textContent = `$${totalAmount.toFixed(2)}`;

            // Eventos del carrito
            document.querySelectorAll('.btn-minus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    if (cart[idx].cantidad > 1) {
                        cart[idx].cantidad--;
                        renderCart();
                    } else {
                        cart.splice(idx, 1);
                        renderCart();
                    }
                });
            });

            document.querySelectorAll('.btn-plus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    const p = cart[idx].producto;
                    if (cart[idx].cantidad < p.stock) {
                        cart[idx].cantidad++;
                        renderCart();
                    } else {
                        Helpers.showNotification('No hay más stock disponible', 'warning');
                    }
                });
            });

            document.querySelectorAll('.btn-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    cart.splice(idx, 1);
                    renderCart();
                });
            });
        };

        const addToCart = (product) => {
            const existingItem = cart.find(i => i.producto.id === product.id);
            if (existingItem) {
                if (existingItem.cantidad < product.stock) {
                    existingItem.cantidad++;
                    renderCart();
                } else {
                    Helpers.showNotification('Stock máximo alcanzado', 'warning');
                }
            } else {
                cart.push({ producto: product, cantidad: 1 });
                renderCart();
            }
        };

        // Buscador de POS
        const searchInput = document.getElementById('posSearch');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = posProducts.filter(p => 
                    p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
                );
                renderPosProducts(filtered);
            });
        }

        // Cargar clientes en el select
        const posClienteSelect = document.getElementById('posCliente');
        if(posClienteSelect) {
            const clientes = PersonService.getClients();
            clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.nombre; // Guardamos el nombre por simplicidad en el ticket
                opt.textContent = c.nombre;
                posClienteSelect.appendChild(opt);
            });
        }

        // Procesar Venta
        const btnProcesar = document.getElementById('btnProcesarVenta');
        if (btnProcesar) {
            btnProcesar.addEventListener('click', () => {
                if (cart.length === 0) return;

                const cliente = document.getElementById('posCliente').value;
                const totalText = document.getElementById('posTotalAmount').textContent.replace('$', '');
                const totalAmount = parseFloat(totalText);

                const sale = SaleService.processSale(cart, cliente, totalAmount);
                if (sale) {
                    Helpers.showNotification(`Venta ${sale.ticket} procesada con éxito!`);
                    cart = [];
                    renderCart();
                    
                    // Refrescar productos (stock actualizado)
                    posProducts = ProductService.getAll().filter(p => p.estado !== 'Inactivo');
                    renderPosProducts(posProducts);
                }
            });
        }

        // Init
        renderPosProducts(posProducts);
        renderCart();
    }


    // ==========================================
    // LÓGICA PARA HISTORIAL DE VENTAS
    // ==========================================
    const ventasTableBody = document.getElementById('ventasTableBody');
    if (ventasTableBody) {
        let allSales = SaleService.getAll().reverse(); // Más recientes primero
        let filteredSales = [...allSales];
        let currentPage = 1;
        const itemsPerPage = 10;
        
        let detalleModal = null;
        if(document.getElementById('ventaDetalleModal')){
            detalleModal = new bootstrap.Modal(document.getElementById('ventaDetalleModal'));
        }

        const renderTable = () => {
            ventasTableBody.innerHTML = '';
            
            if(filteredSales.length === 0) {
                ventasTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron ventas.</td></tr>`;
                if(Helpers.renderPagination) Helpers.renderPagination('ventasPagination', 0, 1, itemsPerPage, () => {});
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filteredSales.slice(startIndex, endIndex);

            paginated.forEach(s => {
                const totalItems = s.items.reduce((sum, item) => sum + item.cantidad, 0);
                const fecha = new Date(s.fecha).toLocaleString();

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold text-primary">${s.ticket}</td>
                    <td>${fecha}</td>
                    <td>${s.cliente}</td>
                    <td class="text-center">${totalItems}</td>
                    <td class="text-end fw-bold">$${parseFloat(s.total).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-view" data-id="${s.id}" title="Ver Detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                `;
                ventasTableBody.appendChild(tr);
            });

            // Eventos Ver Detalle
            document.querySelectorAll('.btn-view').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const sale = SaleService.getById(id);
                    if (sale) {
                        document.getElementById('modalTicketTitle').textContent = sale.ticket;
                        document.getElementById('modalCliente').textContent = sale.cliente;
                        document.getElementById('modalFecha').textContent = new Date(sale.fecha).toLocaleString();
                        
                        const tbody = document.getElementById('modalDetalleBody');
                        tbody.innerHTML = '';
                        sale.items.forEach(item => {
                            const subtotal = item.cantidad * item.producto.precioVenta;
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${item.producto.nombre} <br><small class="text-muted">${item.producto.codigo}</small></td>
                                <td class="text-center">${item.cantidad}</td>
                                <td class="text-end">$${parseFloat(item.producto.precioVenta).toFixed(2)}</td>
                                <td class="text-end fw-bold">$${subtotal.toFixed(2)}</td>
                            `;
                            tbody.appendChild(tr);
                        });

                        document.getElementById('modalTotal').textContent = `$${parseFloat(sale.total).toFixed(2)}`;
                        detalleModal.show();
                    }
                });
            });

            if(Helpers.renderPagination) {
                Helpers.renderPagination('ventasPagination', filteredSales.length, currentPage, itemsPerPage, (newPage) => {
                    currentPage = newPage;
                    renderTable();
                });
            }
        };

        const applyFilters = () => {
            const term = (document.getElementById('searchVenta')?.value || '').toLowerCase();
            filteredSales = allSales.filter(s => 
                s.ticket.toLowerCase().includes(term) || s.cliente.toLowerCase().includes(term)
            );
            currentPage = 1;
            renderTable();
        };

        renderTable();

        const searchInput = document.getElementById('searchVenta');
        if(searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }
    }

});
