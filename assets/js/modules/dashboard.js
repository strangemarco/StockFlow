/**
 * StockFlow - Dashboard Module
 * Lógica para calcular y mostrar los KPIs en la pantalla principal
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Solo ejecutamos si estamos en el dashboard (verificando si existe un KPI)
    const kpiTotalProductos = document.getElementById('kpiTotalProductos');
    if (kpiTotalProductos) {
        
        // 1. Total Productos Activos
        const todosProductos = ProductService.getAll();
        const activos = todosProductos.filter(p => p.estado !== 'Inactivo');
        kpiTotalProductos.textContent = activos.length;

        // 2. Stock Bajo o Agotado
        const kpiStockBajo = document.getElementById('kpiStockBajo');
        const stockCritico = activos.filter(p => p.estado === 'Stock bajo' || p.estado === 'Agotado' || p.stock <= p.stockMinimo);
        kpiStockBajo.textContent = stockCritico.length;

        // 3. Ventas Acumuladas
        const kpiVentas = document.getElementById('kpiVentas');
        const todasVentas = SaleService.getAll();
        const totalVendido = todasVentas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
        kpiVentas.textContent = `$${totalVendido.toFixed(2)}`;

        // 4. Compras Acumuladas
        const kpiCompras = document.getElementById('kpiCompras');
        const todasCompras = PurchaseService.getAll();
        const totalComprado = todasCompras.reduce((sum, compra) => sum + parseFloat(compra.total), 0);
        kpiCompras.textContent = `$${totalComprado.toFixed(2)}`;
    }
});
