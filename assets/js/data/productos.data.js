/**
 * StockFlow - Datos Mock para Productos
 */

const mockProducts = [
    {
        id: "prod_1",
        codigo: "PROD-001",
        codigoBarras: "7501234567890",
        nombre: "Coca Cola 2L",
        descripcion: "Refresco de cola botella de plástico",
        categoriaId: "Bebidas",
        precioCompra: 1.50,
        precioVenta: 2.20,
        stock: 45,
        stockMinimo: 10,
        estado: "Activo"
    },
    {
        id: "prod_2",
        codigo: "PROD-002",
        codigoBarras: "7501234567891",
        nombre: "Galletas Oreo",
        descripcion: "Galletas de chocolate con crema",
        categoriaId: "Alimentos",
        precioCompra: 0.80,
        precioVenta: 1.50,
        stock: 12,
        stockMinimo: 15,
        estado: "Stock bajo"
    },
    {
        id: "prod_3",
        codigo: "PROD-003",
        codigoBarras: "7501234567892",
        nombre: "Jabón Zote",
        descripcion: "Jabón en barra para lavar",
        categoriaId: "Limpieza",
        precioCompra: 0.50,
        precioVenta: 1.00,
        stock: 0,
        stockMinimo: 5,
        estado: "Agotado"
    },
    {
        id: "prod_4",
        codigo: "PROD-004",
        codigoBarras: "7501234567893",
        nombre: "Audífonos Bluetooth",
        descripcion: "Audífonos inalámbricos genéricos",
        categoriaId: "Electrónica",
        precioCompra: 12.00,
        precioVenta: 25.00,
        stock: 8,
        stockMinimo: 5,
        estado: "Activo"
    },
    {
        id: "prod_5",
        codigo: "PROD-005",
        codigoBarras: "7501234567894",
        nombre: "Cable USB-C",
        descripcion: "Cable de carga rápida 1m",
        categoriaId: "Accesorios",
        precioCompra: 2.00,
        precioVenta: 5.00,
        stock: 30,
        stockMinimo: 10,
        estado: "Activo"
    }
];

// Función para inicializar datos si no existen
const initMockData = () => {
    const existingProducts = Storage.get('stockflow_productos');
    if (!existingProducts || existingProducts.length === 0) {
        Storage.set('stockflow_productos', mockProducts);
        console.log("Datos de prueba de productos inicializados.");
    }
};

// Exponer inicializador al cargar script
document.addEventListener('DOMContentLoaded', () => {
    // Si estamos usando Storage (verificamos si existe)
    if (typeof Storage !== 'undefined') {
        initMockData();
    }
});
