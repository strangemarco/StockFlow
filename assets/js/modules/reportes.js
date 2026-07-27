/**
 * StockFlow - Reportes Module
 * Lógica para la generación de gráficos y resumen de caja
 */

document.addEventListener('DOMContentLoaded', () => {

    const topProductosTableBody = document.getElementById('topProductosTableBody');
    if (topProductosTableBody) {
        
        // 1. Calcular Flujo de Caja
        const repIngresos = document.getElementById('repIngresos');
        const repEgresos = document.getElementById('repEgresos');
        const repBalance = document.getElementById('repBalance');

        const todasVentas = SaleService.getAll();
        const totalVendido = todasVentas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
        
        const todasCompras = PurchaseService.getAll();
        const totalComprado = todasCompras.reduce((sum, compra) => sum + parseFloat(compra.total), 0);
        
        const balanceNeto = totalVendido - totalComprado;

        repIngresos.textContent = `$${totalVendido.toFixed(2)}`;
        repEgresos.textContent = `$${totalComprado.toFixed(2)}`;
        repBalance.textContent = `$${balanceNeto.toFixed(2)}`;
        
        if(balanceNeto < 0) {
            repBalance.classList.replace('text-primary', 'text-danger');
        }

        // 2. Procesar Productos Vendidos
        // Agrupar ventas por producto
        const productStats = {};
        
        todasVentas.forEach(venta => {
            venta.items.forEach(item => {
                const pId = item.producto.id;
                if (!productStats[pId]) {
                    productStats[pId] = {
                        nombre: item.producto.nombre,
                        codigo: item.producto.codigo,
                        cantidadVendida: 0,
                        ingresoGenerado: 0
                    };
                }
                productStats[pId].cantidadVendida += item.cantidad;
                productStats[pId].ingresoGenerado += (item.cantidad * item.precio);
            });
        });

        // Convertir a array y ordenar de mayor a menor cantidad
        const sortedProducts = Object.values(productStats).sort((a, b) => b.cantidadVendida - a.cantidadVendida);

        // 3. Renderizar Tabla
        if (sortedProducts.length === 0) {
            topProductosTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No hay datos de ventas registrados aún.</td></tr>`;
        } else {
            sortedProducts.forEach((p, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold text-muted">${index + 1}</td>
                    <td class="fw-bold">${p.nombre}</td>
                    <td>${p.codigo}</td>
                    <td class="text-center"><span class="badge bg-primary rounded-pill">${p.cantidadVendida}</span></td>
                    <td class="text-end fw-bold text-success">$${p.ingresoGenerado.toFixed(2)}</td>
                `;
                topProductosTableBody.appendChild(tr);
            });
        }

        // 4. Renderizar Gráfico con Chart.js (Top 5)
        const ctx = document.getElementById('topProductsChart');
        if (ctx) {
            const top5 = sortedProducts.slice(0, 5);
            
            const labels = top5.map(p => p.nombre);
            const data = top5.map(p => p.cantidadVendida);

            if (labels.length === 0) {
                // Mock data para que el gráfico no esté vacío si no hay ventas
                labels.push('Sin Datos');
                data.push(0);
            }

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Unidades Vendidas',
                        data: data,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)', // primary blue
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }
});
