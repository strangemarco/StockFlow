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

    processSale: (cart, cliente, totalAmount, paymentMethod = 'QR', amountPaid = 0) => {
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
            metodoPago: paymentMethod,
            montoPagado: amountPaid,
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

            if (typeof updateCalculateChange === 'function') {
                updateCalculateChange();
            }

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
                opt.value = c.id; // Guardamos el ID para obtener más datos
                opt.textContent = c.nombre;
                posClienteSelect.appendChild(opt);
            });
        }

        // Procesar Venta
        const btnProcesar = document.getElementById('btnProcesarVenta');
        if (btnProcesar) {
            btnProcesar.addEventListener('click', () => {
                if (cart.length === 0) return;

                const clienteId = document.getElementById('posCliente').value;
                const clienteObj = PersonService.getById(clienteId) || { nombre: 'Consumidor Final' };
                const totalText = document.getElementById('posTotalAmount').textContent.replace('$', '');
                const totalAmount = parseFloat(totalText);

                const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'QR';
                const receivedInput = document.getElementById('montoRecibido');
                const received = method === 'Efectivo' ? parseFloat(receivedInput.value) || 0 : totalAmount;

                if (method === 'Efectivo' && received < totalAmount) {
                    Helpers.showNotification('El monto recibido es menor al total.', 'warning');
                    return;
                }

                const sale = SaleService.processSale(cart, clienteObj, totalAmount, method, received);
                if (sale) {
                    const c = sale.cliente;
                    
                    if (typeof c === 'object' && c.email) {
                        // ==== CONFIGURACIÓN DE EMAILJS ====
                        // Para que esto funcione, debes registrarte en https://www.emailjs.com/
                        // 1. Conecta tu cuenta de Gmail (Service ID).
                        // 2. Crea un Email Template (Template ID).
                        // 3. Obtén tu Public Key en Account -> API Keys.
                        
                        const EMAILJS_PUBLIC_KEY = "-1XRrarDo-uN8nYve"; // Llave pública del usuario
                        const EMAILJS_SERVICE_ID = "service_stockflow"; // Service ID del usuario
                        const EMAILJS_TEMPLATE_ID = "template_by85mf8"; // Template ID del usuario
                        
                        if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== "TU_PUBLIC_KEY") {
                            emailjs.init(EMAILJS_PUBLIC_KEY);
                            
                            // Parámetros que tu template en EmailJS debe recibir
                            const templateParams = {
                                to_name: c.nombre,
                                to_email: c.email,
                                ticket_number: sale.ticket,
                                total_amount: `$${parseFloat(sale.total).toFixed(2)}`
                            };
                            
                            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
                                .then(() => console.log('Factura enviada automáticamente a:', c.email))
                                .catch(err => console.error('Error al enviar la factura:', err));
                        } else {
                            console.warn("EmailJS no está configurado. Reemplaza las llaves en ventas.js para activar el envío automático.");
                        }
                    }

                    Helpers.showNotification(`Venta ${sale.ticket} procesada con éxito!`);

                    cart = [];
                    if (receivedInput) receivedInput.value = '';
                    renderCart();
                    
                    // Refrescar productos (stock actualizado)
                    posProducts = ProductService.getAll().filter(p => p.estado !== 'Inactivo');
                    renderPosProducts(posProducts);
                }
            });
        }

        // Init y Lógica de Métodos de Pago
        const qrContainer = document.getElementById('qrContainer');
        const cashContainer = document.getElementById('cashContainer');
        const payQR = document.getElementById('payQR');
        const payCash = document.getElementById('payCash');
        const montoRecibido = document.getElementById('montoRecibido');
        const montoCambio = document.getElementById('montoCambio');

        window.updateCalculateChange = () => {
            if(!payCash || !payCash.checked) return;
            const totalText = document.getElementById('posTotalAmount').textContent.replace('$', '');
            const total = parseFloat(totalText) || 0;
            const received = parseFloat(montoRecibido.value) || 0;
            const change = received - total;
            
            montoCambio.value = change >= 0 ? change.toFixed(2) : "0.00";
            
            if (btnProcesar && cart.length > 0) {
                btnProcesar.disabled = received < total && total > 0;
            }
        };

        const updatePaymentUI = () => {
            if(payQR && payQR.checked) {
                qrContainer.classList.remove('d-none');
                cashContainer.classList.add('d-none');
                if (btnProcesar && cart.length > 0) btnProcesar.disabled = false;
            } else if (payCash && payCash.checked) {
                qrContainer.classList.add('d-none');
                cashContainer.classList.remove('d-none');
                window.updateCalculateChange();
            }
        };

        if (payQR && payCash) {
            payQR.addEventListener('change', updatePaymentUI);
            payCash.addEventListener('change', updatePaymentUI);
        }

        if (montoRecibido) {
            montoRecibido.addEventListener('input', window.updateCalculateChange);
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
                const clienteName = typeof s.cliente === 'object' ? s.cliente.nombre : s.cliente;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold text-primary">${s.ticket}</td>
                    <td>${fecha}</td>
                    <td>${clienteName}</td>
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
                        const cName = typeof sale.cliente === 'object' ? sale.cliente.nombre : sale.cliente;
                        document.getElementById('modalCliente').textContent = cName;
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
            filteredSales = allSales.filter(s => {
                const clienteName = typeof s.cliente === 'object' ? s.cliente.nombre : s.cliente;
                return s.ticket.toLowerCase().includes(term) || clienteName.toLowerCase().includes(term);
            });
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
