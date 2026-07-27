/**
 * StockFlow - Datos Mock para Categorías
 */

const mockCategories = [
    {
        id: "cat_1",
        nombre: "Bebidas",
        descripcion: "Refrescos, jugos, aguas y bebidas alcohólicas",
        estado: "Activo"
    },
    {
        id: "cat_2",
        nombre: "Alimentos",
        descripcion: "Comestibles en general, abarrotes",
        estado: "Activo"
    },
    {
        id: "cat_3",
        nombre: "Limpieza",
        descripcion: "Artículos para el aseo del hogar y personal",
        estado: "Activo"
    },
    {
        id: "cat_4",
        nombre: "Electrónica",
        descripcion: "Dispositivos electrónicos y accesorios",
        estado: "Activo"
    },
    {
        id: "cat_5",
        nombre: "Accesorios",
        descripcion: "Complementos y extras",
        estado: "Activo"
    }
];

const initMockCategories = () => {
    const existingCategories = Storage.get('stockflow_categorias');
    if (!existingCategories || existingCategories.length === 0) {
        Storage.set('stockflow_categorias', mockCategories);
        console.log("Datos de prueba de categorías inicializados.");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Storage !== 'undefined') {
        initMockCategories();
    }
});
