
        // Variable global para almacenar los datos del inventario
        let inventoryData = [];

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

                generateTableRows();
                // ✅ LÍNEA AGREGADA AQUÍ: Al final de loadInventoryData(), después de generateTableRows():
                window.setOriginalInventoryData(inventoryData);
            } catch (error) {
                console.error('Error cargando datos del inventario:', error);
            }
        }

        // Función para generar las filas de la tabla
        function generateTableRows() {
            const tbody = document.getElementById('inventoryTableBody');
            tbody.innerHTML = '';

            inventoryData.forEach((item, index) => {
                // Fila principal
                const mainRow = document.createElement('tr');
                mainRow.className = 'main-row';
                mainRow.innerHTML = `
                    <td><input type="checkbox" /></td>
                    <td>
                        <i class="fas fa-chevron-right expand-icon" data-index="${index}"></i>
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
                expandedRow.id = `expanded-${index}`;
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

        // Función para manejar la expansión/contracción
        function toggleExpansion(index) {
            const expandedRow = document.getElementById(`expanded-${index}`);
            const icon = document.querySelector(`[data-index="${index}"]`);
            
            if (expandedRow.classList.contains('show')) {
                expandedRow.classList.remove('show');
                icon.classList.remove('expanded');
            } else {
                expandedRow.classList.add('show');
                icon.classList.add('expanded');
            }
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Cargar datos al inicializar la página
            loadInventoryData();
            
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
        });

        // Función para limpiar búsqueda
        function limpiarBusqueda() {
            document.getElementById('busquedaInput').value = '';
            // Mostrar todas las filas
            const rows = document.querySelectorAll('.main-row');
            rows.forEach(row => {
                row.style.display = '';
                const nextRow = row.nextElementSibling;
                if (nextRow && nextRow.classList.contains('expanded-content') && nextRow.classList.contains('show')) {
                    nextRow.style.display = '';
                }
            });
        }

        // Función para restablecer filtros
        function resetFilters() {
            console.log('Restableciendo filtros...');
        }

        // Función para editar productos seleccionados
        function editSelectedProducts() {
            console.log('Editando productos seleccionados...');
        }

        // Funcionalidad de búsqueda
        document.getElementById('busquedaInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.main-row');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                    const nextRow = row.nextElementSibling;
                    if (nextRow && nextRow.classList.contains('expanded-content') && nextRow.classList.contains('show')) {
                        nextRow.style.display = '';
                    }
                } else {
                    row.style.display = 'none';
                    const nextRow = row.nextElementSibling;
                    if (nextRow && nextRow.classList.contains('expanded-content')) {
                        nextRow.style.display = 'none';
                    }
                }
            });
        });