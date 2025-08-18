// Variable global para almacenar los datos del inventario
let inventoryData = [];
let currentPage = 0;
const itemsPerPage = 20;
let isLoading = false;
let hasMoreData = true;

// Función para cargar datos de la API
async function loadInventoryData() {
    try {
        // Cargar datos de la API de InventarioCombinado
        const response = await fetch('https://healtyapi.bsite.net/api/InventarioCombinado/Excel');
        const data = await response.json();
        
        // Mapear los datos de la API (InventarioCombinado)
        inventoryData = data.map(item => ({
            numeroItem: item.NumeroDeItem || 'N/A',
            nombreTaller: item.NombreDeTallerOLaboratorio || 'N/A',
            clase: item.MaterialHerramientaOInsumo || 'N/A',
            nombreEquipo: item.Nombre || 'Sin nombre',
            cantidadExistencia: item.CantidadEnExistencia || 0,
            ubicacionEquipo: item.Ubicacion || 'N/A',
            descripcion: item.Descripcion || 'Sin descripción',
            marca: item.Marca || 'N/A',
            fabricante: item.Fabricante || 'N/A',
            modelo: item.Modelo || 'N/A',
            numeroSerie: item.NumeroSerie || 'N/A',
            codigoInventario: item.CodigoDeInventario || 'N/A',
            especificacionesTecnicas: item.EspecificacionesTecnicas || 'No especificadas',
            fotografia: item.Fotografia || null,
            observaciones: item.Observaciones || 'Sin observaciones'
        }));

        // Inicializar la carga de la primera página
        currentPage = 0;
        hasMoreData = true;
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = '';
        
        loadNextPage();
        
        // ✅ LÍNEA AGREGADA AQUÍ: Al final de loadInventoryData()
        window.setOriginalInventoryData?.(inventoryData);
    } catch (error) {
        console.error('Error cargando datos del inventario:', error);
        hideLoadingIndicator();
    }
}

// Función para cargar la siguiente página de datos
function loadNextPage() {
    if (isLoading || !hasMoreData) return;
    
    isLoading = true;
    showLoadingIndicator();
    
    // Simular un pequeño delay para mostrar el indicador de carga
    setTimeout(() => {
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = inventoryData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            hasMoreData = false;
            hideLoadingIndicator();
            isLoading = false;
            return;
        }
        
        generateTableRows(pageData, startIndex);
        
        currentPage++;
        isLoading = false;
        hideLoadingIndicator();
        
        // Verificar si hay más datos
        if (endIndex >= inventoryData.length) {
            hasMoreData = false;
        }
    }, 300); // 300ms de delay para mejor UX
}

// Función para generar las filas de la tabla (modificada para lazy loading)
function generateTableRows(data = null, startIndex = 0) {
    const tbody = document.getElementById('inventoryTableBody');
    
    // Si no se proporciona data, usar toda la data (para búsquedas)
    if (data === null) {
        tbody.innerHTML = '';
        data = inventoryData;
        startIndex = 0;
    }

    data.forEach((item, index) => {
        const globalIndex = startIndex + index;
        
        // Fila principal
        const mainRow = document.createElement('tr');
        mainRow.className = 'main-row';
        mainRow.innerHTML = `
            <td><input type="checkbox" /></td>
            <td>
                <i class="fas fa-chevron-right expand-icon" data-index="${globalIndex}"></i>
                ${item.numeroItem}
            </td>
            <td>${item.nombreTaller}</td>
            <td>${item.clase}</td>
            <td>${item.nombreEquipo}</td>
            <td>${item.cantidadExistencia}</td>
            <td>${item.ubicacionEquipo}</td>
        `;

        // Fila expandida
        const expandedRow = document.createElement('tr');
        expandedRow.className = 'expanded-content';
        expandedRow.id = `expanded-${globalIndex}`;
        expandedRow.innerHTML = `
            <td colspan="7">
                <div class="expanded-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Descripción:</div>
                            <div class="detail-value">${item.descripcion}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Marca:</div>
                            <div class="detail-value">${item.marca}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Fabricante:</div>
                            <div class="detail-value">${item.fabricante}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Modelo:</div>
                            <div class="detail-value">${item.modelo}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Número de serie:</div>
                            <div class="detail-value">${item.numeroSerie}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Código de inventario:</div>
                            <div class="detail-value">${item.codigoInventario}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Especificaciones técnicas:</div>
                            <div class="detail-value">${item.especificacionesTecnicas}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Observaciones:</div>
                            <div class="detail-value">${item.observaciones}</div>
                        </div>
                    </div>
                    <div class="image-container">
                        ${item.fotografia ? `<img src="${item.fotografia}" alt="${item.nombreEquipo}" class="equipment-image" />` : ''}
                    </div>
                </div>
            </td>
        `;

        tbody.appendChild(mainRow);
        tbody.appendChild(expandedRow);
    });
}

// Función para mostrar el indicador de carga
function showLoadingIndicator() {
    let loadingIndicator = document.getElementById('loadingIndicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-spinner fa-spin"></i> Cargando más elementos...
            </div>
        `;
        document.getElementById('inventoryTableBody').appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'block';
}

// Función para ocultar el indicador de carga
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Función para detectar scroll y cargar más datos
function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.offsetHeight;
    
    // Cargar más datos cuando esté cerca del final (200px antes)
    if (scrollTop + windowHeight >= documentHeight - 200) {
        loadNextPage();
    }
}

// Función para manejar la expansión/contracción
function toggleExpansion(index) {
    const expandedRow = document.getElementById(`expanded-${index}`);
    const icon = document.querySelector(`[data-index="${index}"]`);
    
    if (expandedRow && icon) {
        if (expandedRow.classList.contains('show')) {
            expandedRow.classList.remove('show');
            icon.classList.remove('expanded');
        } else {
            expandedRow.classList.add('show');
            icon.classList.add('expanded');
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos al inicializar la página
    loadInventoryData();
    
    // Agregar event listener para scroll
    window.addEventListener('scroll', handleScroll);
    
    // Agregar event listeners para expandir al hacer clic en toda la fila
    document.addEventListener('click', function(e) {
        // Verificar si se hizo clic en un checkbox
        if (e.target.type === 'checkbox') {
            return; // No expandir si se hace clic en checkbox
        }
        
        // Buscar la fila principal más cercana
        const row = e.target.closest('.main-row');
        if (row) {
            // Buscar el ícono de expansión en esta fila
            const expandIcon = row.querySelector('.expand-icon');
            if (expandIcon) {
                const index = parseInt(expandIcon.dataset.index);
                toggleExpansion(index);
            }
        }
    });
    
    // Botón para cargar más manualmente (opcional)
    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', loadNextPage);
    }
});

// Función para limpiar búsqueda
function limpiarBusqueda() {
    document.getElementById('busquedaInput').value = '';
    
    // Reiniciar la carga lazy
    currentPage = 0;
    hasMoreData = true;
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    loadNextPage();
}

// Función para restablecer filtros
function resetFilters() {
    console.log('Restableciendo filtros...');
    limpiarBusqueda();
}

// Función para editar productos seleccionados
function editSelectedProducts() {
    console.log('Editando productos seleccionados...');
}

// Funcionalidad de búsqueda (modificada para lazy loading)
document.getElementById('busquedaInput')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        // Si la búsqueda está vacía, reiniciar lazy loading
        limpiarBusqueda();
        return;
    }
    
    // Filtrar todos los datos y mostrar resultados
    const filteredData = inventoryData.filter(item => {
        const searchableText = `
            ${item.numeroItem} 
            ${item.nombreTaller} 
            ${item.clase} 
            ${item.nombreEquipo} 
            ${item.ubicacionEquipo}
            ${item.descripcion}
            ${item.marca}
            ${item.fabricante}
            ${item.modelo}
        `.toLowerCase();
        
        return searchableText.includes(searchTerm);
    });
    
    // Mostrar resultados filtrados (sin lazy loading durante búsqueda)
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    generateTableRows(filteredData, 0);
    hideLoadingIndicator();
});

// Función para obtener el estado actual de carga
function getLoadingStatus() {
    return {
        currentPage,
        itemsPerPage,
        totalItems: inventoryData.length,
        loadedItems: Math.min(currentPage * itemsPerPage, inventoryData.length),
        hasMoreData,
        isLoading
    };
}