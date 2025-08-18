// Variable global para almacenar los datos del inventario
let inventoryData = [];
let filteredData = [];
let currentPage = 0;
const itemsPerPage = 20;
let isLoading = false;
let hasMoreData = true;
let isSearching = false;
let searchTimeout = null;

// Función para cargar datos de la API
async function loadInventoryData() {
    try {
        showLoadingIndicator();
        
        // Cargar datos de la API de InventarioCombinado
        const response = await fetch('https://healtyapi.bsite.net/api/InventarioCombinado/Excel');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
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
        resetPagination();
        loadNextPage();
        
        // Llamar a la función si existe (para compatibilidad)
        if (typeof window.setOriginalInventoryData === 'function') {
            window.setOriginalInventoryData(inventoryData);
        }
        
        console.log(`✅ Cargados ${inventoryData.length} elementos del inventario`);
        
    } catch (error) {
        console.error('Error cargando datos del inventario:', error);
        showErrorMessage('Error al cargar los datos. Por favor, recarga la página.');
        hideLoadingIndicator();
    }
}

// Función para resetear la paginación
function resetPagination() {
    currentPage = 0;
    hasMoreData = true;
    const tbody = document.getElementById('inventoryTableBody');
    if (tbody) {
        tbody.innerHTML = '';
    }
}

// Función para cargar la siguiente página de datos
function loadNextPage() {
    if (isLoading || !hasMoreData) return;
    
    isLoading = true;
    showLoadingIndicator();
    
    // Determinar qué datos usar (filtrados o completos)
    const dataToUse = isSearching ? filteredData : inventoryData;
    
    // Simular un pequeño delay para mejor UX
    setTimeout(() => {
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = dataToUse.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            hasMoreData = false;
            hideLoadingIndicator();
            isLoading = false;
            
            // Si es la primera página y no hay datos, mostrar mensaje
            if (currentPage === 0) {
                showNoResultsMessage();
            }
            return;
        }
        
        generateTableRows(pageData, startIndex, currentPage > 0);
        
        currentPage++;
        isLoading = false;
        hideLoadingIndicator();
        
        // Verificar si hay más datos
        if (endIndex >= dataToUse.length) {
            hasMoreData = false;
        }
        
    }, 200); // Reducido el delay para mejor responsividad
}

// Función para generar las filas de la tabla (mejorada)
function generateTableRows(data, startIndex = 0, append = false) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    if (!append) {
        tbody.innerHTML = '';
    }

    if (!data || data.length === 0) {
        if (!append) {
            showNoResultsMessage();
        }
        return;
    }

    data.forEach((item, index) => {
        const globalIndex = startIndex + index;
        
        // Fila principal
        const mainRow = document.createElement('tr');
        mainRow.className = 'main-row';
        mainRow.innerHTML = `
            <td><input type="checkbox" aria-label="Seleccionar producto" /></td>
            <td>
                <i class="fas fa-chevron-right expand-icon" data-index="${globalIndex}"></i>
                <strong>${item.numeroItem}</strong>
            </td>
            <td>${item.nombreTaller}</td>
            <td><span class="badge bg-secondary">${item.clase}</span></td>
            <td><strong>${item.nombreEquipo}</strong></td>
            <td><span class="badge bg-primary">${item.cantidadExistencia}</span></td>
            <td>${item.ubicacionEquipo}</td>
        `;

        // Fila expandida con más detalles
        const expandedRow = document.createElement('tr');
        expandedRow.className = 'expanded-content';
        expandedRow.id = `expanded-${globalIndex}`;
        expandedRow.innerHTML = `
            <td colspan="7">
                <div class="expanded-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">📝 Descripción:</div>
                            <div class="detail-value">${item.descripcion}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">🏷️ Marca:</div>
                            <div class="detail-value">${item.marca}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">🏭 Fabricante:</div>
                            <div class="detail-value">${item.fabricante}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">🔧 Modelo:</div>
                            <div class="detail-value">${item.modelo}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">🔢 Número de serie:</div>
                            <div class="detail-value">${item.numeroSerie}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">📋 Código de inventario:</div>
                            <div class="detail-value">${item.codigoInventario}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">⚙️ Especificaciones técnicas:</div>
                            <div class="detail-value">${item.especificacionesTecnicas}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">💬 Observaciones:</div>
                            <div class="detail-value">${item.observaciones}</div>
                        </div>
                    </div>
                    ${item.fotografia ? `
                        <div class="image-container">
                            <img src="${item.fotografia}" alt="${item.nombreEquipo}" class="equipment-image" 
                                 onerror="this.style.display='none'" loading="lazy" />
                        </div>
                    ` : ''}
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
        loadingIndicator = document.createElement('tr');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.className = 'loading-row';
        loadingIndicator.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-spinner fa-spin"></i> Cargando más elementos...
            </td>
        `;
    }
    
    const tbody = document.getElementById('inventoryTableBody');
    if (tbody && !document.getElementById('loadingIndicator')) {
        tbody.appendChild(loadingIndicator);
    }
}

// Función para ocultar el indicador de carga
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Función para mostrar mensaje de "sin resultados"
function showNoResultsMessage() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="no-results">
                <i class="fas fa-search"></i>
                <h5>No se encontraron resultados</h5>
                <p>Intenta con otros términos de búsqueda</p>
            </td>
        </tr>
    `;
}

// Función para mostrar mensaje de error
function showErrorMessage(message) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px 20px; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
                <h5>Error al cargar datos</h5>
                <p>${message}</p>
                <button class="btn btn-primary btn-sm" onclick="loadInventoryData()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </td>
        </tr>
    `;
}

// Función para detectar scroll y cargar más datos
function handleScroll() {
    if (isSearching) return; // No cargar más durante búsqueda
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.offsetHeight;
    
    // Cargar más datos cuando esté cerca del final (300px antes)
    if (scrollTop + windowHeight >= documentHeight - 300) {
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
            // Cerrar otras filas expandidas (opcional)
            document.querySelectorAll('.expanded-content.show').forEach(row => {
                row.classList.remove('show');
            });
            document.querySelectorAll('.expand-icon.expanded').forEach(ic => {
                ic.classList.remove('expanded');
            });
            
            // Abrir la fila actual
            expandedRow.classList.add('show');
            icon.classList.add('expanded');
        }
    }
}

// Función de búsqueda mejorada con debounce
function performSearch(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Limpiar búsqueda
        isSearching = false;
        filteredData = [];
        resetPagination();
        loadNextPage();
        updateSearchStatus('');
        return;
    }
    
    console.log(`🔍 Buscando: "${searchTerm}"`);
    
    isSearching = true;
    
    // Filtrar datos por Número de Item y Nombre del equipo
    filteredData = inventoryData.filter(item => {
        const numeroItem = item.numeroItem.toString().toLowerCase();
        const nombreEquipo = item.nombreEquipo.toLowerCase();
        
        return numeroItem.includes(searchTerm) || nombreEquipo.includes(searchTerm);
    });
    
    console.log(`📊 Resultados encontrados: ${filteredData.length}`);
    
    // Resetear paginación y mostrar resultados
    resetPagination();
    loadNextPage();
    updateSearchStatus(searchTerm);
}

// Función para actualizar el estado de búsqueda
function updateSearchStatus(searchTerm) {
    let statusElement = document.getElementById('searchStatus');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'searchStatus';
        statusElement.className = 'search-status';
        
        const controlsDiv = document.querySelector('.controls');
        if (controlsDiv) {
            controlsDiv.appendChild(statusElement);
        }
    }
    
    if (searchTerm === '') {
        statusElement.style.display = 'none';
        return;
    }
    
    statusElement.style.display = 'block';
    statusElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>
                🔍 Mostrando resultados para: <strong>"${searchTerm}"</strong> 
                (${filteredData.length} elemento${filteredData.length !== 1 ? 's' : ''} encontrado${filteredData.length !== 1 ? 's' : ''})
            </span>
            <button class="clear-search-btn" onclick="limpiarBusqueda()">
                <i class="fas fa-times"></i> Limpiar búsqueda
            </button>
        </div>
    `;
}

// Función para limpiar búsqueda
function limpiarBusqueda() {
    const searchInput = document.getElementById('busquedaInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Limpiar el indicador de búsqueda en el contenedor
    const searchContainer = document.querySelector('.search-input-container') || 
                          document.querySelector('.search-wrapper');
    if (searchContainer) {
        searchContainer.classList.remove('searching');
    }
    
    // Reiniciar la carga
    isSearching = false;
    filteredData = [];
    resetPagination();
    loadNextPage();
    updateSearchStatus('');
    
    console.log('🧹 Búsqueda limpiada');
}

// Función para restablecer filtros
function resetFilters() {
    console.log('🔄 Restableciendo filtros...');
    limpiarBusqueda();
}

// Función para editar productos seleccionados
function editSelectedProducts() {
    const selectedCheckboxes = document.querySelectorAll('#inventoryTableBody input[type="checkbox"]:checked');
    console.log(`✏️ Editando ${selectedCheckboxes.length} productos seleccionados`);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de inventario...');
    
    // Cargar datos al inicializar la página
    loadInventoryData();
    
    // Agregar event listener para scroll (lazy loading)
    window.addEventListener('scroll', handleScroll);
    
    // Configurar búsqueda con debounce
    const searchInput = document.getElementById('busquedaInput');
    if (searchInput) {
        // Agregar indicador visual de búsqueda
        const searchContainer = searchInput.closest('.search-wrapper') || searchInput.parentNode;
        if (searchContainer) {
            searchContainer.classList.add('search-input-container');
        }
        
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value;
            
            // Limpiar timeout anterior
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Mostrar indicador de búsqueda
            if (searchContainer) {
                searchContainer.classList.add('searching');
            }
            
            // Ejecutar búsqueda con delay (debounce)
            searchTimeout = setTimeout(() => {
                performSearch(searchTerm);
                
                // Quitar indicador de búsqueda
                if (searchContainer) {
                    searchContainer.classList.remove('searching');
                }
            }, 300); // 300ms de delay
        });
        
        console.log('🔍 Buscador configurado');
    } else {
        console.warn('⚠️ No se encontró el input de búsqueda con ID "busquedaInput"');
    }
    
    // Configurar el ícono de limpiar búsqueda
    const clearIcon = document.querySelector('.clear-icon');
    if (clearIcon) {
        clearIcon.addEventListener('click', limpiarBusqueda);
    }
    
    // Event listener para expandir filas al hacer clic
    document.addEventListener('click', function(e) {
        // No expandir si se hace clic en checkbox
        if (e.target.type === 'checkbox') {
            return;
        }
        
        // Buscar la fila principal más cercana
        const row = e.target.closest('.main-row');
        if (row) {
            const expandIcon = row.querySelector('.expand-icon');
            if (expandIcon) {
                const index = parseInt(expandIcon.dataset.index);
                toggleExpansion(index);
            }
        }
    });
    
    // Botón para cargar más manualmente (si existe)
    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', loadNextPage);
    }
    
    console.log('✅ Sistema inicializado correctamente');
});

// Función para obtener el estado actual de carga (para debugging)
function getLoadingStatus() {
    return {
        currentPage,
        itemsPerPage,
        totalItems: inventoryData.length,
        filteredItems: filteredData.length,
        loadedItems: Math.min(currentPage * itemsPerPage, (isSearching ? filteredData : inventoryData).length),
        hasMoreData,
        isLoading,
        isSearching
    };
}

// Función de utilidad para debugging
function debugInventory() {
    console.log('📊 Estado del inventario:', getLoadingStatus());
    console.log('📦 Datos cargados:', inventoryData.length);
    console.log('🔍 Datos filtrados:', filteredData.length);
}