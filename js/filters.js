
        // ========================================
        // FILTERS.JS - Sistema de filtros avanzado
        // ========================================

        // Variables globales para el sistema de filtros
        let originalInventoryData = [];
        let filteredData = [];
        let activeFilters = {
            nombreTaller: '',
            clase: '',
            marca: '',
            fabricante: ''
        };

        // Función para establecer los datos originales del inventario
        window.setOriginalInventoryData = function(data) {
            originalInventoryData = [...data];
            filteredData = [...data];
            populateFilterOptions();
        };

        // Función para poblar las opciones de los filtros
        function populateFilterOptions() {
            if (!originalInventoryData.length) return;

            // Obtener valores únicos para cada filtro
            const talleres = [...new Set(originalInventoryData.map(item => item.nombreTaller))].filter(val => val && val !== 'N/A').sort();
            const clases = [...new Set(originalInventoryData.map(item => item.clase))].filter(val => val && val !== 'N/A').sort();
            const marcas = [...new Set(originalInventoryData.map(item => item.marca))].filter(val => val && val !== 'N/A').sort();
            const fabricantes = [...new Set(originalInventoryData.map(item => item.fabricante))].filter(val => val && val !== 'N/A').sort();

            // Poblar select de talleres
            const filterNombreTaller = document.getElementById('filterNombreTaller');
            filterNombreTaller.innerHTML = '<option value="">Todos los Talleres/Laboratorios</option>';
            talleres.forEach(taller => {
                filterNombreTaller.innerHTML += `<option value="${taller}">${taller}</option>`;
            });

            // Poblar select de clases
            const filterClase = document.getElementById('filterClase');
            filterClase.innerHTML = '<option value="">Todas las Clases</option>';
            clases.forEach(clase => {
                filterClase.innerHTML += `<option value="${clase}">${clase}</option>`;
            });

            // Poblar select de marcas
            const filterMarca = document.getElementById('filterMarca');
            filterMarca.innerHTML = '<option value="">Todas las Marcas</option>';
            marcas.forEach(marca => {
                filterMarca.innerHTML += `<option value="${marca}">${marca}</option>`;
            });

            // Poblar select de fabricantes
            const filterFabricante = document.getElementById('filterFabricante');
            filterFabricante.innerHTML = '<option value="">Todos los Fabricantes</option>';
            fabricantes.forEach(fabricante => {
                filterFabricante.innerHTML += `<option value="${fabricante}">${fabricante}</option>`;
            });
        }

        // Función para aplicar filtros
        function applyFilters() {
            // Obtener valores actuales de los filtros
            activeFilters.nombreTaller = document.getElementById('filterNombreTaller').value;
            activeFilters.clase = document.getElementById('filterClase').value;
            activeFilters.marca = document.getElementById('filterMarca').value;
            activeFilters.fabricante = document.getElementById('filterFabricante').value;

            // Filtrar datos
            filteredData = originalInventoryData.filter(item => {
                let passesFilter = true;

                // Filtro por taller
                if (activeFilters.nombreTaller && item.nombreTaller !== activeFilters.nombreTaller) {
                    passesFilter = false;
                }

                // Filtro por clase
                if (activeFilters.clase && item.clase !== activeFilters.clase) {
                    passesFilter = false;
                }

                // Filtro por marca
                if (activeFilters.marca && item.marca !== activeFilters.marca) {
                    passesFilter = false;
                }

                // Filtro por fabricante
                if (activeFilters.fabricante && item.fabricante !== activeFilters.fabricante) {
                    passesFilter = false;
                }

                return passesFilter;
            });

            // Actualizar inventoryData con los datos filtrados
            inventoryData = [...filteredData];

            // Regenerar tabla con datos filtrados
            generateTableRows();

            // Cerrar modal
            const filterModal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
            if (filterModal) {
                filterModal.hide();
            }

            // Mostrar información de filtros aplicados
            updateFilterStatus();
        }

        // Función para mostrar el estado de los filtros
        function updateFilterStatus() {
            const activeFilterCount = Object.values(activeFilters).filter(value => value !== '').length;
            
            if (activeFilterCount > 0) {
                console.log(`Filtros activos: ${activeFilterCount}. Mostrando ${filteredData.length} de ${originalInventoryData.length} elementos.`);
            }
        }

        // Función mejorada para restablecer filtros
        function resetFilters() {
            // Limpiar valores de los filtros
            document.getElementById('filterNombreTaller').value = '';
            document.getElementById('filterClase').value = '';
            document.getElementById('filterMarca').value = '';
            document.getElementById('filterFabricante').value = '';

            // Resetear filtros activos
            activeFilters = {
                nombreTaller: '',
                clase: '',
                marca: '',
                fabricante: ''
            };

            // Restaurar datos originales
            inventoryData = [...originalInventoryData];
            filteredData = [...originalInventoryData];

            // Regenerar tabla
            generateTableRows();

            // Limpiar búsqueda también
            limpiarBusqueda();

            console.log('Filtros restablecidos. Mostrando todos los elementos.');
        }

        // Event Listeners para el sistema de filtros
        document.addEventListener('DOMContentLoaded', function() {
            // Event listener para el botón "Aplicar Filtros"
            const applyFiltersBtn = document.getElementById('applyFilters');
            if (applyFiltersBtn) {
                applyFiltersBtn.addEventListener('click', applyFilters);
            }

            // Event listeners para cambios en tiempo real (opcional)
            const filterSelects = [
                'filterNombreTaller',
                'filterClase', 
                'filterMarca',
                'filterFabricante'
            ];

            filterSelects.forEach(selectId => {
                const selectElement = document.getElementById(selectId);
                if (selectElement) {
                    selectElement.addEventListener('change', function() {
                        // Aquí puedes decidir si aplicar filtros en tiempo real o solo al hacer clic en "Aplicar"
                        // Para tiempo real, descomenta la siguiente línea:
                        // applyFilters();
                    });
                }
            });
        });

        // Función auxiliar para obtener estadísticas de filtros
        function getFilterStats() {
            return {
                total: originalInventoryData.length,
                filtered: filteredData.length,
                activeFilters: Object.keys(activeFilters).filter(key => activeFilters[key] !== '').length
            };
        }

        // Exponer funciones globalmente para uso en otros scripts
        window.applyFilters = applyFilters;
        window.resetFilters = resetFilters;
        window.getFilterStats = getFilterStats;