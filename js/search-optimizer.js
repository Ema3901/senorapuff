// simple-search.js - Buscador simple y eficiente

(function() {
    'use strict';
    
    let searchTimeout = null;
    let originalTableContent = null;
    let isSearchActive = false;
    
    // Configuración
    const SEARCH_DELAY = 800; // 800ms de espera
    const MIN_SEARCH_LENGTH = 3; // Mínimo 3 caracteres
    
    // Inicializar cuando el DOM esté listo
    function initSearch() {
        const searchInput = document.getElementById('busquedaInput');
        if (!searchInput) {
            console.log('Input de búsqueda no encontrado');
            return;
        }
        
        // Guardar contenido original de la tabla
        saveOriginalContent();
        
        // Remover cualquier event listener existente
        searchInput.removeEventListener('input', handleSearchInput);
        searchInput.removeEventListener('keyup', handleSearchInput);
        
        // Agregar nuevo event listener
        searchInput.addEventListener('input', handleSearchInput);
        
        console.log('Buscador inicializado correctamente');
    }
    
    function saveOriginalContent() {
        const tableBody = document.getElementById('inventoryTableBody');
        if (tableBody) {
            originalTableContent = tableBody.innerHTML;
        }
    }
    
    function handleSearchInput(event) {
        const searchTerm = event.target.value.trim();
        
        // Limpiar timeout anterior
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
        }
        
        // Si está vacío, restaurar tabla original
        if (searchTerm === '') {
            restoreOriginalContent();
            return;
        }
        
        // Si es muy corto, no hacer nada
        if (searchTerm.length < MIN_SEARCH_LENGTH) {
            return;
        }
        
        // Mostrar indicador de búsqueda
        showSearchIndicator(true);
        
        // Configurar nueva búsqueda
        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
        }, SEARCH_DELAY);
    }
    
    function performSearch(searchTerm) {
        console.log('Buscando:', searchTerm);
        
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;
        
        // Obtener todas las filas
        const allRows = tableBody.querySelectorAll('tr');
        let visibleCount = 0;
        let processedCount = 0;
        
        // Procesar filas una por una con pequeños delays
        function processNextBatch() {
            const batchSize = 20; // Procesar 20 filas a la vez
            const endIndex = Math.min(processedCount + batchSize, allRows.length);
            
            for (let i = processedCount; i < endIndex; i++) {
                const row = allRows[i];
                const isVisible = rowMatchesSearch(row, searchTerm);
                
                if (isVisible) {
                    row.style.display = '';
                    highlightSearchTerms(row, searchTerm);
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            }
            
            processedCount = endIndex;
            
            // Si hay más filas que procesar, continuar en el siguiente frame
            if (processedCount < allRows.length) {
                requestAnimationFrame(processNextBatch);
            } else {
                // Búsqueda completada
                finishSearch(visibleCount, searchTerm);
            }
        }
        
        // Comenzar procesamiento
        isSearchActive = true;
        processNextBatch();
    }
    
    function rowMatchesSearch(row, searchTerm) {
        // Obtener texto de todas las celdas (excepto la primera que es el checkbox)
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return false;
        
        let rowText = '';
        for (let i = 1; i < cells.length; i++) { // Empezar desde 1 para saltar checkbox
            rowText += cells[i].textContent + ' ';
        }
        
        rowText = rowText.toLowerCase();
        const searchWords = searchTerm.toLowerCase().split(' ');
        
        // Verificar que todas las palabras estén presentes
        return searchWords.every(word => rowText.includes(word));
    }
    
    function highlightSearchTerms(row, searchTerm) {
        const cells = row.querySelectorAll('td');
        const searchWords = searchTerm.split(' ').filter(word => word.length > 0);
        
        for (let i = 1; i < cells.length; i++) {
            const cell = cells[i];
            let cellText = cell.textContent;
            
            searchWords.forEach(word => {
                const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
                cellText = cellText.replace(regex, '<mark>$1</mark>');
            });
            
            cell.innerHTML = cellText;
        }
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function finishSearch(visibleCount, searchTerm) {
        showSearchIndicator(false);
        isSearchActive = false;
        
        console.log(`Búsqueda completada: ${visibleCount} resultados para "${searchTerm}"`);
        
        // Mostrar mensaje si no hay resultados
        if (visibleCount === 0) {
            showNoResultsMessage(searchTerm);
        } else {
            removeNoResultsMessage();
        }
        
        // Actualizar contador
        updateResultsCounter(visibleCount, searchTerm);
    }
    
    function showNoResultsMessage(searchTerm) {
        removeNoResultsMessage();
        
        const tableBody = document.getElementById('inventoryTableBody');
        const noResultsRow = document.createElement('tr');
        noResultsRow.id = 'no-results-message';
        noResultsRow.innerHTML = `
            <td colspan="7" class="text-center py-4">
                <div style="padding: 2rem;">
                    <i class="fas fa-search fa-2x mb-3" style="color: #6c757d;"></i>
                    <h5 style="color: #6c757d;">No se encontraron resultados</h5>
                    <p class="mb-0" style="color: #6c757d;">
                        No hay productos que coincidan con "<strong>${searchTerm}</strong>"
                    </p>
                    <small style="color: #adb5bd;">Intenta con otros términos de búsqueda</small>
                </div>
            </td>
        `;
        
        tableBody.appendChild(noResultsRow);
    }
    
    function removeNoResultsMessage() {
        const message = document.getElementById('no-results-message');
        if (message) {
            message.remove();
        }
    }
    
    function updateResultsCounter(count, searchTerm) {
        let counter = document.getElementById('search-results-counter');
        
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'search-results-counter';
            counter.style.cssText = `
                margin-top: 0.5rem;
                font-size: 0.875rem;
                color: #6c757d;
            `;
            
            const searchBox = document.querySelector('.search-box');
            if (searchBox) {
                searchBox.appendChild(counter);
            }
        }
        
        if (count > 0) {
            counter.textContent = `${count} producto(s) encontrado(s) para "${searchTerm}"`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }
    }
    
    function showSearchIndicator(show) {
        const searchInput = document.getElementById('busquedaInput');
        if (!searchInput) return;
        
        if (show) {
            searchInput.style.backgroundColor = '#f8f9fa';
            searchInput.placeholder = 'Buscando...';
        } else {
            searchInput.style.backgroundColor = '';
            searchInput.placeholder = 'Buscar por nombre o ID';
        }
    }
    
    function restoreOriginalContent() {
        const tableBody = document.getElementById('inventoryTableBody');
        if (tableBody && originalTableContent) {
            tableBody.innerHTML = originalTableContent;
        }
        
        removeNoResultsMessage();
        hideResultsCounter();
        showSearchIndicator(false);
        isSearchActive = false;
    }
    
    function hideResultsCounter() {
        const counter = document.getElementById('search-results-counter');
        if (counter) {
            counter.style.display = 'none';
        }
    }
    
    // Función global para limpiar búsqueda
    window.limpiarBusqueda = function() {
        const searchInput = document.getElementById('busquedaInput');
        if (searchInput) {
            searchInput.value = '';
            restoreOriginalContent();
            searchInput.focus();
        }
    };
    
    // CSS para el highlighting
    const searchStyles = document.createElement('style');
    searchStyles.textContent = `
        mark {
            background-color: #fff3cd;
            color: #856404;
            padding: 0.1em 0.2em;
            border-radius: 0.25rem;
            font-weight: 500;
        }
        
        #inventoryTable tbody tr {
            transition: opacity 0.2s ease;
        }
        
        #busquedaInput:focus {
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
    `;
    document.head.appendChild(searchStyles);
    
    // Inicializar cuando el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
    
    // Reinicializar si se recarga el contenido de la tabla
    window.reinitializeSearch = function() {
        setTimeout(() => {
            saveOriginalContent();
            console.log('Búsqueda reinicializada');
        }, 100);
    };
    
})();