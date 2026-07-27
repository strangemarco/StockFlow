/**
 * StockFlow - Compras Module
 * Lógica para la Recepción de Pedidos y el Historial de Compras
 */

const PurchaseService = {
    STORAGE_KEY: 'stockflow_compras',

    getAll: () => {
        return Storage.get(PurchaseService.STORAGE_KEY) || [];
    },

    saveAll: (purchases) => {
        Storage.set(PurchaseService.STORAGE_KEY, purchases);
    },

    getById: (id) => {
        const purchases = PurchaseService.getAll();
        return purchases.find(p => p.id === id);
    },

    generateOrderNumber: () => {
        const purchases = PurchaseService.getAll();
        const count = purchases.length + 1;
        return `ORD-${count.toString().padStart(5, '0')}`;
    },

    processPurchase: (cart, proveedor, totalAmount) => {
        if (!cart || cart.length === 0) return false;

        const purchases = PurchaseService.getAll();
        const orderNumber = PurchaseService.generateOrderNumber();
        const date = new Date().toISOString();

        const purchase = {
            id: 'pur_' + Storage.generateId(),
            orden: orderNumber,
            fecha: date,
            proveedor: proveedor || 'Proveedor General',
            total: totalAmount,
            items: cart
        };

        // Aumentar inventario y registrar movimiento
        cart.forEach(item => {
            // Usamos InventoryService para registrar la entrada
            InventoryService.addMovement(
                item.producto.id, 
                'Entrada', 
                item.cantidad, 
                `Compra ${orderNumber}`
            );
            
            // Opcional: Actualizar el precio de compra del producto si cambió
            // En esta implementación básica lo actualizaremos directamente.
            const product = ProductService.getById(item.producto.id);
            if(product) {
                // Actualizamos el costo de compra
                product.precioCompra = item.costo;
                // Si estaba Agotado, ahora está Activo
                if(product.estado === 'Agotado' || product.estado === 'Stock bajo') {
                    // El estado se recalcula mejor basado en el nuevo stock en product.js, 
                    // pero al hacer addMovement se actualiza el stock, ahora solo validamos el estado:
                    const nuevoStock = product.stock + item.cantidad; // simulación
                    if (nuevoStock > product.stockMinimo) {
                        product.estado = 'Activo';
                    }
                }
                ProductService.update(product.id, product);
            }
        });

        purchases.push(purchase);
        PurchaseService.saveAll(purchases);

        return purchase;
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // LÓGICA PARA NUEVA COMPRA (RECEPCIÓN)
    // ==========================================
    const purProductList = document.getElementById('purProductList');
    if (purProductList) {
        let cart = [];
        let purProducts = ProductService.getAll().filter(p => p.estado !== 'Inactivo');

        const renderPurProducts = (products) => {
            purProductList.innerHTML = '';
            
            if(products.length === 0) {
                purProductList.innerHTML = `<div class="col-12 text-center text-muted py-5">No se encontraron productos.</div>`;
                return;
            }

            products.forEach(p => {
                const stockBadge = p.stock > 0 
                    ? `<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle">Stock: ${p.stock}</span>`
                    : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">Agotado</span>`;
                
                const card = document.createElement('div');
                card.className = 'col-sm-6 col-md-4 col-xl-3';
                card.innerHTML = `
                    <div class="card h-100 product-card border shadow-sm" data-id="${p.id}">
                        <div class="card-body p-3 text-center d-flex flex-column">
                            <h6 class="fw-bold mb-1 text-truncate" title="${p.nombre}">${p.nombre}</h6>
                            <small class="text-muted d-block mb-2">${p.codigo}</small>
                            <div class="mt-auto">
                                <h5 class="text-success fw-bold mb-2">Costo ref: $${parseFloat(p.precioCompra).toFixed(2)}</h5>
                                ${stockBadge}
                            </div>
                        </div>
                    </div>
                `;
                
                card.querySelector('.product-card').addEventListener('click', () => addToCart(p));
                purProductList.appendChild(card);
            });
        };

        const renderCart = () => {
            const cartItemsContainer = document.getElementById('purCartItems');
            cartItemsContainer.innerHTML = '';
            
            let totalItems = 0;
            let totalAmount = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="text-center text-muted mt-5 h-100 d-flex flex-column justify-content-center">
                        <i class="bi bi-bag-x fs-1 opacity-50 mb-2"></i>
                        <p>El pedido está vacío</p>
                    </div>`;
                document.getElementById('btnProcesarCompra').disabled = true;
            } else {
                cart.forEach((item, index) => {
                    totalItems += item.cantidad;
                    const subtotal = item.cantidad * item.costo;
                    totalAmount += subtotal;

                    const row = document.createElement('div');
                    row.className = 'd-flex justify-content-between align-items-center border-bottom pb-2 mb-2';
                    row.innerHTML = `
                        <div class="me-2" style="flex: 1;">
                            <div class="fw-bold text-truncate" title="${item.producto.nombre}">${item.producto.nombre}</div>
                            <div class="d-flex align-items-center mt-1">
                                <span class="text-muted small me-1">$</span>
                                <input type="number" class="form-control cost-input" value="${item.costo}" data-index="${index}" step="0.01" min="0">
                                <span class="text-muted small ms-2">x ${item.cantidad}</span>
                            </div>
                        </div>
                        <div class="fw-bold me-3 text-success">$${subtotal.toFixed(2)}</div>
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
                document.getElementById('btnProcesarCompra').disabled = false;
            }

            document.getElementById('purTotalItems').textContent = totalItems;
            document.getElementById('purTotalAmount').textContent = `$${totalAmount.toFixed(2)}`;

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
                    cart[idx].cantidad++;
                    renderCart();
                });
            });

            document.querySelectorAll('.btn-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    cart.splice(idx, 1);
                    renderCart();
                });
            });

            document.querySelectorAll('.cost-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    const val = parseFloat(e.currentTarget.value);
                    if(!isNaN(val) && val >= 0) {
                        cart[idx].costo = val;
                    } else {
                        e.currentTarget.value = cart[idx].costo; // revertir
                    }
                    renderCart();
                });
            });
        };

        const addToCart = (product) => {
            const existingItem = cart.find(i => i.producto.id === product.id);
            if (existingItem) {
                existingItem.cantidad++;
                renderCart();
            } else {
                cart.push({ producto: product, cantidad: 1, costo: parseFloat(product.precioCompra) });
                renderCart();
            }
        };

        // Buscador de POS
        const searchInput = document.getElementById('purSearch');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = purProducts.filter(p => 
                    p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
                );
                renderPurProducts(filtered);
            });
        }

        // Cargar proveedores en el select
        const purProveedorSelect = document.getElementById('purProveedor');
        if(purProveedorSelect) {
            const proveedores = PersonService.getSuppliers();
            proveedores.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.nombre; // Guardamos el nombre por simplicidad en la orden
                opt.textContent = p.nombre;
                purProveedorSelect.appendChild(opt);
            });
        }

        // Procesar Compra
        const btnProcesar = document.getElementById('btnProcesarCompra');
        if (btnProcesar) {
            btnProcesar.addEventListener('click', () => {
                if (cart.length === 0) return;

                const proveedor = document.getElementById('purProveedor').value;
                const totalText = document.getElementById('purTotalAmount').textContent.replace('$', '');
                const totalAmount = parseFloat(totalText);

                const purchase = PurchaseService.processPurchase(cart, proveedor, totalAmount);
                if (purchase) {
                    Helpers.showNotification(`Compra ${purchase.orden} registrada con éxito!`);
                    cart = [];
                    renderCart();
                    
                    // Refrescar productos (stock actualizado)
                    purProducts = ProductService.getAll().filter(p => p.estado !== 'Inactivo');
                    renderPurProducts(purProducts);
                }
            });
        }

        // Init
        renderPurProducts(purProducts);
        renderCart();
    }


    // ==========================================
    // LÓGICA PARA HISTORIAL DE COMPRAS
    // ==========================================
    const comprasTableBody = document.getElementById('comprasTableBody');
    if (comprasTableBody) {
        let allPurchases = PurchaseService.getAll().reverse(); // Más recientes primero
        let filteredPurchases = [...allPurchases];
        let currentPage = 1;
        const itemsPerPage = 10;
        
        let detalleModal = null;
        if(document.getElementById('compraDetalleModal')){
            detalleModal = new bootstrap.Modal(document.getElementById('compraDetalleModal'));
        }

        const renderTable = () => {
            comprasTableBody.innerHTML = '';
            
            if(filteredPurchases.length === 0) {
                comprasTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron órdenes de compra.</td></tr>`;
                if(Helpers.renderPagination) Helpers.renderPagination('comprasPagination', 0, 1, itemsPerPage, () => {});
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filteredPurchases.slice(startIndex, endIndex);

            paginated.forEach(p => {
                const totalItems = p.items.reduce((sum, item) => sum + item.cantidad, 0);
                const fecha = new Date(p.fecha).toLocaleString();

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold text-success">${p.orden}</td>
                    <td>${fecha}</td>
                    <td>${p.proveedor}</td>
                    <td class="text-center">${totalItems}</td>
                    <td class="text-end fw-bold">$${parseFloat(p.total).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-view" data-id="${p.id}" title="Ver Detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                `;
                comprasTableBody.appendChild(tr);
            });

            // Eventos Ver Detalle
            document.querySelectorAll('.btn-view').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const purchase = PurchaseService.getById(id);
                    if (purchase) {
                        document.getElementById('modalOrdenTitle').textContent = purchase.orden;
                        document.getElementById('modalProveedor').textContent = purchase.proveedor;
                        document.getElementById('modalFecha').textContent = new Date(purchase.fecha).toLocaleString();
                        
                        const tbody = document.getElementById('modalDetalleBody');
                        tbody.innerHTML = '';
                        purchase.items.forEach(item => {
                            const subtotal = item.cantidad * item.costo;
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${item.producto.nombre} <br><small class="text-muted">${item.producto.codigo}</small></td>
                                <td class="text-center">${item.cantidad}</td>
                                <td class="text-end">$${parseFloat(item.costo).toFixed(2)}</td>
                                <td class="text-end fw-bold">$${subtotal.toFixed(2)}</td>
                            `;
                            tbody.appendChild(tr);
                        });

                        document.getElementById('modalTotal').textContent = `$${parseFloat(purchase.total).toFixed(2)}`;
                        detalleModal.show();
                    }
                });
            });

            if(Helpers.renderPagination) {
                Helpers.renderPagination('comprasPagination', filteredPurchases.length, currentPage, itemsPerPage, (newPage) => {
                    currentPage = newPage;
                    renderTable();
                });
            }
        };

        const applyFilters = () => {
            const term = (document.getElementById('searchCompra')?.value || '').toLowerCase();
            filteredPurchases = allPurchases.filter(p => 
                p.orden.toLowerCase().includes(term) || p.proveedor.toLowerCase().includes(term)
            );
            currentPage = 1;
            renderTable();
        };

        renderTable();

        const searchInput = document.getElementById('searchCompra');
        if(searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }
    }

});
