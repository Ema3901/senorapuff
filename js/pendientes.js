// Sistema de Revisión Semestral - CON PANTALLA DE CARGA Y LAZY LOADING
document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.querySelector('#pendientesTable tbody');
    const API_BASE_URL = "https://inventariolabsapi.uttn.app/api/product_units";
    
    let todosLosPendientes = [];
    let pendientesMostrados = [];
    let currentPage = 0;
    const PRODUCTOS_POR_PAGINA = 20;

    // Crear pantalla de carga
    function createLoadingScreen() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-content">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <h3 class="loading-title">Cargando Inventario</h3>
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

        const loadingStyles = document.createElement('style');
        loadingStyles.textContent = `
            #loadingOverlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: #f8f9fa; display: flex; justify-content: center; align-items: center;
                z-index: 9999; opacity: 1; transition: opacity 0.4s ease-out;
            }
            .loading-container {
                text-align: center; color: #495057; max-width: 400px; padding: 2rem;
                background-color: white; border-radius: 12px; box-shadow: 0 0 30px rgba(0,0,0,0.1);
            }
            .loading-spinner { margin: 0 auto 1.5rem; width: 60px; height: 60px; }
            .spinner {
                width: 60px; height: 60px; border: 4px solid #e9ecef; border-top: 4px solid #28a745;
                border-radius: 50%; animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .loading-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; color: #343a40; }
            .loading-text { font-size: 1rem; color: #6c757d; margin-bottom: 1.5rem; min-height: 24px; }
            .loading-progress {
                width: 100%; height: 6px; background-color: #e9ecef; border-radius: 3px;
                overflow: hidden; margin-bottom: 1rem;
            }
            .progress-bar {
                height: 100%; background: linear-gradient(90deg, #28a745, #1e7e34); border-radius: 3px;
                width: 0%; transition: width 0.3s ease;
            }
            .loading-stats { font-size: 0.9rem; color: #6c757d; min-height: 20px; }
            .fade-out { opacity: 0 !important; }
        `;
        document.head.appendChild(loadingStyles);
        document.body.appendChild(loadingOverlay);
        return loadingOverlay;
    }

    function updateLoadingProgress(progress, text, stats) {
        const loadingText = document.getElementById('loadingText');
        const progressBar = document.getElementById('progressBar');
        const loadingStats = document.getElementById('loadingStats');
        if (loadingText) loadingText.textContent = text;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (loadingStats && stats) loadingStats.textContent = stats;
    }

    function removeLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 400);
        }
    }

    function getCurrentUser() {
        return localStorage.getItem('currentUser') || 'Sistema';
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        notification.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(notification);
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 5000);
    }

    // Obtener productos con pantalla de carga
    async function obtenerProductosPendientes() {
        createLoadingScreen();
        try {
            updateLoadingProgress(10, 'Conectando con el servidor...', 'Estableciendo conexión...');
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            updateLoadingProgress(30, 'Descargando datos...', 'Obteniendo información de productos...');
            const data = await response.json();
            
            updateLoadingProgress(60, 'Procesando productos...', `Se descargaron ${data.length} productos`);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            todosLosPendientes = data.filter(item => {
                const isPendiente = item.PendingStatus === "Pendiente";
                const isActive = item.Status !== "Deshabilitado" && item.Status !== "Inactivo";
                return isPendiente && isActive;
            });

            updateLoadingProgress(100, 'Completado', `${todosLosPendientes.length} productos pendientes`);
            await new Promise(resolve => setTimeout(resolve, 500));
            return todosLosPendientes;
        } catch (error) {
            showNotification('Error al cargar los productos. Verifica tu conexión.', 'danger');
            return [];
        } finally {
            removeLoadingScreen();
        }
    }

    // Lazy loading
    function cargarProductosPorPagina(pageNumber = 0) {
        const inicio = pageNumber * PRODUCTOS_POR_PAGINA;
        const fin = inicio + PRODUCTOS_POR_PAGINA;
        const productosNuevos = todosLosPendientes.slice(inicio, fin);
        pendientesMostrados = [...pendientesMostrados, ...productosNuevos];
        return productosNuevos;
    }

    function renderTabla(esCargarMas = false) {
        if (!esCargarMas) {
            tbody.innerHTML = '';
            pendientesMostrados = [];
            currentPage = 0;
        }

        const productosNuevos = cargarProductosPorPagina(currentPage);
        
        if (productosNuevos.length === 0 && currentPage === 0) {
            mostrarMensajeFinal();
            return;
        }

        // Remover controles existentes
        ['pendientes-counter', 'load-more-row', 'aprobar-todos-row'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        productosNuevos.forEach((item) => {
            const index = pendientesMostrados.indexOf(item);
            const tr = document.createElement('tr');
            tr.setAttribute('data-index', index);
            tr.setAttribute('data-id', item.id_unit);

            const selectLabel = createLabelSelect(item.LabelStatus, index);
            const textareaObs = createObservationsTextarea(item.observations || "", index);

            tr.innerHTML = `
                <td class="fw-bold text-primary">${item.id_unit}</td>
                <td>${item.ProductInfo?.name || 'N/A'}</td>
                <td><span class="badge bg-secondary">${item.ProductInfo?.model || 'N/A'}</span></td>
                <td><i class="fas fa-map-marker-alt text-muted me-1"></i>${item.LocationInfo?.location_name || 'N/A'}</td>
                <td><i class="fas fa-flask text-info me-1"></i>${item.LabInfo?.lab_name || 'N/A'}</td>
                <td><span class="badge bg-warning text-dark"><i class="fas fa-clock me-1"></i>PENDIENTE</span></td>
                <td class="label-column">
                    <div class="mb-2">${selectLabel}</div>
                    ${textareaObs}
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-success shadow-sm" onclick="aprobarUno(${index})" title="Aprobar revisión">
                        <i class="fas fa-check me-1"></i> Aprobar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        agregarContadorPendientes();
        
        // Mostrar botón "Cargar más" si hay más productos
        const hayMasProductos = (currentPage + 1) * PRODUCTOS_POR_PAGINA < todosLosPendientes.length;
        if (hayMasProductos) {
            agregarBotonCargarMas();
        }
        
        agregarBotonAprobarTodos();
        currentPage++;
    }

    function agregarBotonCargarMas() {
        const productosRestantes = todosLosPendientes.length - pendientesMostrados.length;
        const proximaCarga = Math.min(PRODUCTOS_POR_PAGINA, productosRestantes);
        
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.id = 'load-more-row';
        loadMoreRow.innerHTML = `
            <td colspan="8" class="text-center py-3">
                <button class="btn btn-primary" onclick="cargarMasProductos()" id="loadMoreBtn">
                    <i class="fas fa-chevron-down me-2"></i>
                    Cargar ${proximaCarga} productos más
                </button>
                <div class="mt-2">
                    <small class="text-muted">
                        Mostrando ${pendientesMostrados.length} de ${todosLosPendientes.length} productos
                    </small>
                </div>
            </td>
        `;
        tbody.appendChild(loadMoreRow);
    }

    async function cargarMasProductos() {
        const loadBtn = document.getElementById('loadMoreBtn');
        if (loadBtn) {
            loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cargando...';
            loadBtn.disabled = true;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        renderTabla(true);
        showNotification(`Se cargaron más productos. Total: ${pendientesMostrados.length}`, 'success');
    }

    function createLabelSelect(currentLabelStatus, index) {
        let selectedValue = currentLabelStatus;
        if (typeof currentLabelStatus === 'string') {
            switch(currentLabelStatus.toLowerCase()) {
                case 'bien': selectedValue = 1; break;
                case 'no': selectedValue = 2; break;
                case 'dañada': selectedValue = 3; break;
                default: selectedValue = parseInt(currentLabelStatus) || 1;
            }
        }
        
        return `
            <select class="form-select form-select-sm label-select" id="label-${index}">
                <option value="1" ${selectedValue == 1 ? "selected" : ""}>✅ BIEN</option>
                <option value="2" ${selectedValue == 2 ? "selected" : ""}>❌ NO</option>
                <option value="3" ${selectedValue == 3 ? "selected" : ""}>🔧 DAÑADA</option>
            </select>
        `;
    }

    function createObservationsTextarea(observations, index) {
        return `
            <textarea class="form-control form-control-sm mt-2" 
                      id="obs-${index}" 
                      rows="2" 
                      placeholder="Escribe observaciones aquí..."
                      maxlength="500">${observations}</textarea>
            <small class="text-muted">Máx. 500 caracteres</small>
        `;
    }

    async function aprobarUno(index) {
        try {
            const row = document.querySelector(`tr[data-index="${index}"]`);
            const selectLabel = document.getElementById(`label-${index}`);
            const textareaObs = document.getElementById(`obs-${index}`);

            if (!selectLabel.value) {
                showNotification('Por favor completa el estado de la etiqueta', 'warning');
                return;
            }

            const approveButton = row.querySelector('button');
            approveButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Aprobando...';
            approveButton.disabled = true;

            const producto = pendientesMostrados[index];
            const productId = producto.id_unit;

            const statusResponse = await fetch(`${API_BASE_URL}/set-pending-to-done/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            });

            if (!statusResponse.ok) throw new Error(`Error al cambiar estado: ${statusResponse.status}`);

            const updatedProduct = {
                ...producto,
                PendingStatus: "Realizado",
                LabelStatus: parseInt(selectLabel.value),
                observations: textareaObs.value.trim() || null,
                last_review_date: new Date().toISOString(),
                reviewed_by: getCurrentUser()
            };

            const updateResponse = await fetch(`${API_BASE_URL}/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedProduct)
            });

            if (!updateResponse.ok) {
                await fetch(`${API_BASE_URL}/set-done-to-pending/${productId}`, { method: "PUT" });
                throw new Error(`Error al actualizar campos: ${updateResponse.status}`);
            }

            todosLosPendientes.splice(todosLosPendientes.findIndex(p => p.id_unit === productId), 1);
            pendientesMostrados.splice(index, 1);
            
            showNotification(`Producto ${productId} aprobado exitosamente`, 'success');
            reindexarTabla();

        } catch (error) {
            showNotification('Error al aprobar el producto. Intenta nuevamente.', 'danger');
            const row = document.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                const approveButton = row.querySelector('button');
                approveButton.innerHTML = '<i class="fas fa-check me-1"></i> Aprobar';
                approveButton.disabled = false;
            }
        }
    }

    function reindexarTabla() {
        const rows = tbody.querySelectorAll('tr[data-index]');
        rows.forEach((row, newIndex) => {
            row.setAttribute('data-index', newIndex);
            const selectLabel = row.querySelector('.label-select');
            const textarea = row.querySelector('textarea');
            const button = row.querySelector('button[onclick]');
            
            if (selectLabel) selectLabel.id = `label-${newIndex}`;
            if (textarea) textarea.id = `obs-${newIndex}`;
            if (button) button.setAttribute('onclick', `aprobarUno(${newIndex})`);
        });
        
        agregarContadorPendientes();
        const hayMasProductos = currentPage * PRODUCTOS_POR_PAGINA < todosLosPendientes.length;
        if (hayMasProductos) agregarBotonCargarMas();
        agregarBotonAprobarTodos();
    }

    function agregarContadorPendientes() {
        const existingCounter = document.getElementById('pendientes-counter');
        if (existingCounter) existingCounter.remove();
        
        const counter = document.createElement('tr');
        counter.id = 'pendientes-counter';
        counter.innerHTML = `
            <td colspan="8" class="bg-light text-center py-2">
                <strong><i class="fas fa-tasks me-1"></i>Total pendientes: ${todosLosPendientes.length} | Mostrando: ${pendientesMostrados.length}</strong>
            </td>
        `;
        tbody.insertBefore(counter, tbody.firstChild);
    }

    function agregarBotonAprobarTodos() {
        const existingButton = document.getElementById('aprobar-todos-row');
        if (existingButton) existingButton.remove();
        
        if (pendientesMostrados.length > 0) {
            const buttonRow = document.createElement('tr');
            buttonRow.id = 'aprobar-todos-row';
            buttonRow.innerHTML = `
                <td colspan="8" class="bg-light text-center py-3 border-top">
                    <button class="btn btn-success btn-lg shadow" onclick="aprobarTodos()">
                        <i class="fas fa-check-double me-2"></i>
                        Aprobar Productos Mostrados (${pendientesMostrados.length})
                    </button>
                </td>
            `;
            tbody.appendChild(buttonRow);
        }
    }

    async function aprobarTodos() {
        if (pendientesMostrados.length === 0) return;

        const productosIncompletos = [];
        pendientesMostrados.forEach((producto, index) => {
            const selectLabel = document.getElementById(`label-${index}`);
            if (!selectLabel?.value) productosIncompletos.push(producto.id_unit);
        });

        if (productosIncompletos.length > 0) {
            alert(`Productos con campos incompletos: ${productosIncompletos.join(', ')}`);
            return;
        }

        if (!confirm(`¿Aprobar ${pendientesMostrados.length} productos mostrados?`)) return;

        try {
            const productosParaAprobar = [...pendientesMostrados];
            for (let i = 0; i < productosParaAprobar.length; i++) {
                await aprobarUno(0);
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            showNotification('Productos aprobados exitosamente', 'success');
        } catch (error) {
            showNotification('Error al aprobar productos', 'danger');
        }
    }

    function mostrarMensajeFinal() {
        const trMensaje = document.createElement('tr');
        trMensaje.innerHTML = `
            <td colspan="8" class="text-center py-5">
                <i class="fas fa-check-circle mb-3 text-success" style="font-size: 4rem;"></i>
                <h3 class="text-success">¡Revisión Completada!</h3>
                <p class="text-muted">Todos los productos han sido revisados.</p>
            </td>
        `;
        tbody.appendChild(trMensaje);
    }

    // Inicializar
    async function inicializar() {
        await obtenerProductosPendientes();
        renderTabla(false);
    }

    // Hacer funciones globales
    window.aprobarUno = aprobarUno;
    window.aprobarTodos = aprobarTodos;
    window.cargarMasProductos = cargarMasProductos;

    inicializar();
});