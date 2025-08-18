document.addEventListener('DOMContentLoaded', () => {
    const inventoryTableBody = document.getElementById('inventoryTableBody');

    // Crear pantalla de carga overlay mejorada
    function createLoadingScreen() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-content">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <h3 class="loading-title">Cargando Productos Deshabilitados</h3>
                    <p class="loading-text" id="loadingText">Conectando con el servidor...</p>
                    <div class="loading-progress">
                        <div class="progress-bar" id="progressBar"></div>
                    </div>
                    <div class="loading-stats" id="loadingStats">
                        <span>Preparando datos...</span>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos de la pantalla de carga mejorada
        const loadingStyles = document.createElement('style');
        loadingStyles.textContent = `
            #loadingOverlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #f8f9fa;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.4s ease-out;
            }

            .loading-container {
                text-align: center;
                color: #495057;
                max-width: 400px;
                padding: 2rem;
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 0 30px rgba(0,0,0,0.1);
            }

            .loading-spinner {
                margin: 0 auto 1.5rem;
                width: 60px;
                height: 60px;
            }

            .spinner {
                width: 60px;
                height: 60px;
                border: 4px solid #e9ecef;
                border-top: 4px solid var(--primary-green);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.75rem;
                color: #343a40;
            }

            .loading-text {
                font-size: 1rem;
                color: #6c757d;
                margin-bottom: 1.5rem;
                min-height: 24px;
            }

            .loading-progress {
                width: 100%;
                height: 6px;
                background-color: #e9ecef;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 1rem;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-green), var(--primary-green-dark));
                border-radius: 3px;
                width: 0%;
                transition: width 0.3s ease;
                position: relative;
            }

            .progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 1.5s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .loading-stats {
                font-size: 0.9rem;
                color: #6c757d;
                min-height: 20px;
            }

            .fade-out {
                opacity: 0 !important;
            }

            .no-products-message {
                text-align: center;
                padding: 3rem;
                color: #6c757d;
                font-size: 1.2rem;
                font-weight: 500;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .loading-container {
                    max-width: 300px;
                    padding: 1.5rem;
                }
                
                .loading-title {
                    font-size: 1.3rem;
                }
                
                .spinner {
                    width: 50px;
                    height: 50px;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                }
            }
        `;
        document.head.appendChild(loadingStyles);

        document.body.appendChild(loadingOverlay);
        return loadingOverlay;
    }

    // Actualizar progreso de carga
    function updateLoadingProgress(progress, text, stats) {
        const loadingText = document.getElementById('loadingText');
        const progressBar = document.getElementById('progressBar');
        const loadingStats = document.getElementById('loadingStats');

        if (loadingText) loadingText.textContent = text;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (loadingStats && stats) loadingStats.textContent = stats;
    }

    // Remover pantalla de carga
    function removeLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.remove();
            }, 400);
        }
    }

    // Crear pantalla de carga
    createLoadingScreen();
    
    // Simular progreso de carga
    updateLoadingProgress(20, 'Obteniendo productos...', 'Conectando a la API...');

    // Hacer una solicitud GET a la API para obtener los productos deshabilitados
    fetch('https://inventariolabsapi.uttn.app/api/product_units')
        .then(response => {
            updateLoadingProgress(50, 'Procesando respuesta...', 'Verificando datos...');
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            updateLoadingProgress(75, 'Filtrando productos...', 'Organizando información...');
            console.log("Datos obtenidos de la API:", data);
            
            if (Array.isArray(data)) {
                // Filtrar solo los que tienen status "deshabilitado"
                const deshabilitados = data.filter(item => 
                    item.Status && item.Status.toLowerCase() === 'deshabilitado'
                );

                updateLoadingProgress(90, 'Finalizando...', `${deshabilitados.length} productos encontrados`);

                // Ordenar los productos por id_product
                deshabilitados.sort((a, b) => {
                    return a.ProductInfo.id_product - b.ProductInfo.id_product;
                });

                setTimeout(() => {
                    updateLoadingProgress(100, 'Completado', 'Carga finalizada');
                    setTimeout(() => {
                        removeLoadingScreen();
                        if (deshabilitados.length === 0) {
                            showNoProductsMessage();
                        } else {
                            renderTable(deshabilitados);
                        }
                    }, 500);
                }, 300);
            } else {
                console.error("La respuesta no es un array", data);
                removeLoadingScreen();
            }
        })
        .catch(error => {
            console.error("Error al obtener los datos:", error);
            removeLoadingScreen();
        });

    function showNoProductsMessage() {
        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="no-products-message">
                    No existen productos deshabilitados
                </td>
            </tr>
        `;
    }

    function createAttributeDiv(label, value) {
        if (!value || value.trim() === '') value = 'No tiene';
        return `<div><strong>${label}:</strong> <span>${value}</span></div>`;
    }

    function renderTable(data) {
        inventoryTableBody.innerHTML = ''; // Limpiar filas existentes

        data.forEach(item => {
            const row = document.createElement('tr');
            row.classList.add('item-row');
            row.setAttribute('data-id', item.id_unit);

            // Asignamos las clases de estado
            const statusLower = item.Status.toLowerCase();
            const statusClass = statusLower === 'activo' ? 'status-good' : 'status-pending';
            const checkLower = item.PendingStatus.toLowerCase();
            const checkClass = checkLower === 'pendiente' ? 'status-pending' : 'status-good';

            row.innerHTML = `
                <td><input type="checkbox" class="checkbox-select"></td>
                <td class="col-id">${item.internal_code}</td>
                <td class="col-articulo">${item.ProductInfo.name}</td>
                <td>${item.ProductInfo.model}</td>
                <td>${item.LocationInfo.location_name}</td>
                <td>${item.LabInfo.lab_name}</td>
                <td><span class="badge-status ${statusClass}">${item.Status}</span></td>
                <td><span class="badge-status ${checkClass}">${item.PendingStatus}</span></td>
                <td><button class="btn btn-success reactivateBtn" data-id="${item.id_unit}">Reactivar</button></td>
            `;

            inventoryTableBody.appendChild(row);

            // Fila expandible con más detalles
            const expandableRow = document.createElement('tr');
            expandableRow.classList.add('expandable-row');
            expandableRow.style.display = 'none';
            expandableRow.innerHTML = `
                <td colspan="9">
                    <div class="expandable-content">
                      <div class="expandable-attributes">
                        ${createAttributeDiv('Etiquetado', item.LabelStatus)}
                        ${createAttributeDiv('Tipo', item.ProductInfo.Category)}
                        ${createAttributeDiv('Resguardante', item.GuardianInfo.name)}
                        ${createAttributeDiv('Email', item.GuardianInfo.email)}
                      </div>
                    </div>
                </td>
            `;
            inventoryTableBody.appendChild(expandableRow);

            // Evento para desplegar/colapsar fila expandible al hacer clic en la fila
            row.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    expandableRow.style.display = expandableRow.style.display === 'none' ? 'table-row' : 'none';
                }
            });

            // Evento para reactivar el producto
            const reactivateBtn = row.querySelector('.reactivateBtn');
            reactivateBtn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                reactivarProducto(productId);
            });
        });
    }

    // Función para reactivar un producto
    async function reactivarProducto(id) {
        try {
            const response = await fetch(`https://inventariolabsapi.uttn.app/api/product_units/enable/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                Swal.fire({
                    title: 'Éxito',
                    text: `El producto con ID ${id} ha sido reactivado.`,
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });

                // Actualizar la tabla eliminando el producto reactivado
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    const nextRow = row.nextElementSibling;
                    row.remove();
                    if (nextRow && nextRow.classList.contains('expandable-row')) {
                        nextRow.remove();
                    }
                    
                    // Verificar si ya no hay más productos deshabilitados
                    const remainingRows = inventoryTableBody.querySelectorAll('.item-row');
                    if (remainingRows.length === 0) {
                        showNoProductsMessage();
                    }
                }
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al reactivar el producto. Intenta nuevamente.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        } catch (error) {
            console.error('Error al reactivar el producto:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al conectarse con la API. Intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }

    // Búsqueda de la tabla
    document.getElementById('searchInput').addEventListener('keyup', searchTable);

    function searchTable() {
        let input = document.getElementById('searchInput');
        let filter = input.value.toUpperCase();
        let filteredData = inventoryData.filter(item => item.ID.toString().includes(filter));
        renderTable(filteredData);
    }
});