// Configuración de endpoints
const API_BASE = `https://inventariolabsapi.uttn.app/api`;
const selectors = {
  marca: { url: `${API_BASE}/brands`, id: 'id_brand', name: 'brand_name' },
  area: { url: `${API_BASE}/areas`, id: 'id_area', name: 'area_name' },
  ubicacion: { url: `${API_BASE}/location_`, id: 'id_location', name: 'location_name' },
  laboratorio: { url: `${API_BASE}/laboratories`, id: 'id_lab', name: 'lab_name' },
  condicion: { url: `${API_BASE}/status_l`, id: 'id_status_label', name: 'status_label' },
};

// Variables globales
let selectedUnitIds = [];
let currentUnitIndex = 0;
let unitsData = [];
let allProductUnits = []; // Cache para todas las unidades

// Funciones de utilidad
async function fetchJSON(url) {
  console.log(`🌐 Haciendo petición a: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`📡 Respuesta recibida de ${url}:`, res.status, res.statusText);
    if (!res.ok) throw new Error(`Error ${res.status} al pedir ${url}`);
    const data = await res.json();
    console.log(`✅ Datos obtenidos de ${url}:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Error en fetchJSON para ${url}:`, error);
    throw error;
  }
}

async function fillSelect(selectEl, endpointInfo, placeholder = '--Selecciona--') {
  console.log(`🔄 Llenando select para:`, endpointInfo.url);
  if (!selectEl) {
    console.error('❌ Select element no encontrado');
    return;
  }
  
  try {
    const data = await fetchJSON(endpointInfo.url);
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    if (Array.isArray(data) && data.length > 0) {
      console.log(`📋 Agregando ${data.length} opciones al select`);
      data.forEach(item => {
        const id = item[endpointInfo.id];
        const name = item[endpointInfo.name];
        if (id !== undefined && name !== undefined) {
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = name;
          selectEl.appendChild(opt);
        }
      });
      console.log(`✅ Select llenado exitosamente para ${endpointInfo.url}`);
    } else {
      console.warn(`⚠️ No hay datos para ${endpointInfo.url}`);
    }
  } catch (e) {
    console.error(`❌ Error llenando select de ${endpointInfo.url}:`, e);
    selectEl.innerHTML = `<option value="">Error cargando</option>`;
    showMessage(`No se pudieron cargar datos de ${endpointInfo.url}: ${e.message}`, 'error');
  }
}

async function fillGuardians(selectEl) {
  console.log('🔄 Cargando guardianes...');
  if (!selectEl) {
    console.error('❌ Guardian select element no encontrado');
    return;
  }
  
  try {
    const data = await fetchJSON(`${API_BASE}/users`);
    selectEl.innerHTML = `<option value="">--Selecciona--</option>`;
    if (Array.isArray(data) && data.length > 0) {
      let guardianCount = 0;
      data.forEach(u => {
        const rol = u?.RoleInfo?.rol || '';
        if (rol.toLowerCase() === 'alumno') return;
        const id = u.id_user;
        const name = u.name;
        if (id !== undefined && name !== undefined) {
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = name;
          selectEl.appendChild(opt);
          guardianCount++;
        }
      });
      console.log(`✅ ${guardianCount} guardianes agregados`);
    }
  } catch (e) {
    console.error('❌ Error cargando guardianes:', e);
    selectEl.innerHTML = `<option value="">Error cargando guardianes</option>`;
    showMessage(`Error cargando guardianes: ${e.message}`, 'error');
  }
}

function showMessage(msg, type = 'info') {
  console.log(`📢 Mensaje mostrado (${type}): ${msg}`);
  const messagesContainer = document.getElementById('messages');
  if (!messagesContainer) {
    console.error('❌ Messages container no encontrado');
    return;
  }
  
  const div = document.createElement('div');
  
  setTimeout(() => {
    if (div.parentNode) {
      div.parentNode.removeChild(div);
    }
  }, 5000);
  
  div.textContent = msg;
  
  if (type === 'error') {
    div.className = 'alert alert-danger alert-dismissible fade show';
    div.innerHTML = `
      <i class="fas fa-exclamation-triangle me-2"></i>${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  } else if (type === 'success') {
    div.className = 'alert alert-success alert-dismissible fade show';
    div.innerHTML = `
      <i class="fas fa-check-circle me-2"></i>${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  } else {
    div.className = 'alert alert-info alert-dismissible fade show';
    div.innerHTML = `
      <i class="fas fa-info-circle me-2"></i>${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  }
  
  messagesContainer.appendChild(div);
}

// Cargar todas las unidades de producto
async function loadAllProductUnits() {
  console.log('🔄 Cargando todas las unidades de producto...');
  try {
    if (allProductUnits.length === 0) {
      console.log('📋 Obteniendo todas las product_units desde la API...');
      allProductUnits = await fetchJSON(`${API_BASE}/product_units`);
      console.log(`✅ ${allProductUnits.length} unidades obtenidas del servidor`);
    }
    return allProductUnits;
  } catch (error) {
    console.error('❌ Error cargando todas las unidades:', error);
    throw error;
  }
}

// Cargar datos de una unidad específica - CORREGIDO
async function loadUnitData(unitId) {
  console.log(`🔄 Cargando datos de la unidad ID: ${unitId}`);
  try {
    let unitData;
    
    // Primero intentar desde cache (más eficiente)
    console.log('🔍 Buscando en cache primero...');
    const allUnits = await loadAllProductUnits();
    unitData = allUnits.find(unit => unit.id_unit === parseInt(unitId));
    
    if (unitData) {
      console.log(`✅ Unidad encontrada en cache:`, unitData);
      return unitData;
    }
    
    // Si no está en cache, intentar API directa
    console.log('🌐 No encontrada en cache, intentando API directa...');
    try {
      unitData = await fetchJSON(`${API_BASE}/product_units/${unitId}`);
      console.log(`✅ Unidad obtenida directamente desde la API:`, unitData);
      
      // Agregar al cache para próximas consultas
      allProductUnits.push(unitData);
      
      return unitData;
    } catch (directError) {
      console.warn(`⚠️ Error obteniendo de API directa:`, directError.message);
      throw new Error(`No se encontró la unidad con ID ${unitId} en cache ni en API: ${directError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Error cargando unidad ${unitId}:`, error);
    throw error;
  }
}

// Cargar todas las unidades seleccionadas
async function loadAllUnits() {
  console.log('🚀 Iniciando carga de todas las unidades...');
  try {
    const loadingContainer = document.getElementById('loadingContainer');
    const noProductsDiv = document.getElementById('noProductsSelected');
    
    if (!loadingContainer || !noProductsDiv) {
      console.error('❌ Contenedores de carga no encontrados');
      return;
    }

    // Obtener IDs desde localStorage
    const storedIds = localStorage.getItem('selectedProducts');
    console.log('🗄️ Datos en localStorage:', storedIds);
    
    if (!storedIds) {
      console.warn('⚠️ No hay unidades seleccionadas en localStorage');
      loadingContainer.classList.add('d-none');
      noProductsDiv.classList.remove('d-none');
      return;
    }
    
    try {
      selectedUnitIds = JSON.parse(storedIds);
      console.log('✅ IDs parseados exitosamente:', selectedUnitIds);
    } catch (error) {
      console.error('❌ Error parseando IDs almacenados:', error);
      selectedUnitIds = [];
    }
    
    if (!Array.isArray(selectedUnitIds) || selectedUnitIds.length === 0) {
      console.warn('⚠️ Array de IDs vacío o inválido');
      loadingContainer.classList.add('d-none');
      noProductsDiv.classList.remove('d-none');
      return;
    }

    console.log(`📊 Cargando ${selectedUnitIds.length} unidades...`);
    
    // Cargar datos de todas las unidades
    unitsData = [];
    for (let i = 0; i < selectedUnitIds.length; i++) {
      const unitId = selectedUnitIds[i];
      console.log(`🔄 Cargando unidad ${i + 1}/${selectedUnitIds.length}: ID ${unitId}`);
      try {
        const unitData = await loadUnitData(unitId);
        unitsData.push({
          id: unitId,
          unit: unitData
        });
        console.log(`✅ Unidad ${unitId} agregada a unitsData`);
      } catch (error) {
        console.error(`❌ Error cargando unidad ${unitId}:`, error);
        showMessage(`Error cargando unidad ${unitId}: ${error.message}`, 'error');
      }
    }

    console.log(`📊 Total unidades cargadas: ${unitsData.length}`);

    if (unitsData.length === 0) {
      console.warn('⚠️ No se pudo cargar ninguna unidad');
      loadingContainer.classList.add('d-none');
      noProductsDiv.classList.remove('d-none');
      return;
    }

    // Mostrar interfaz de edición
    console.log('🎨 Mostrando interfaz de edición...');
    loadingContainer.classList.add('d-none');
    const navigator = document.getElementById('productNavigator');
    const editForm = document.getElementById('editForm');
    
    if (navigator) navigator.classList.remove('d-none');
    if (editForm) editForm.classList.remove('d-none');
    
    // Actualizar navegador
    updateNavigator();
    
    // Mostrar primera unidad
    await showUnit(0);
    console.log('✅ Carga completa de unidades finalizada');
    
  } catch (error) {
    console.error('❌ Error general cargando unidades:', error);
    showMessage(`Error general cargando unidades: ${error.message}`, 'error');
  }
}

// Actualizar el navegador de unidades
function updateNavigator() {
  console.log('🔄 Actualizando navegador...');
  const totalElement = document.getElementById('totalProducts');
  const currentElement = document.getElementById('currentProductIndex');
  const prevBtn = document.getElementById('prevProduct');
  const nextBtn = document.getElementById('nextProduct');
  
  if (totalElement) totalElement.textContent = unitsData.length;
  if (currentElement) currentElement.textContent = currentUnitIndex + 1;
  
  // Actualizar botones de navegación
  if (prevBtn) prevBtn.disabled = currentUnitIndex === 0;
  if (nextBtn) nextBtn.disabled = currentUnitIndex === unitsData.length - 1;
  
  // Actualizar info de la unidad actual
  if (unitsData[currentUnitIndex]) {
    const currentUnit = unitsData[currentUnitIndex];
    const idElement = document.getElementById('currentProductId');
    const nameElement = document.getElementById('currentProductName');
    
    if (idElement) idElement.textContent = currentUnit.id;
    if (nameElement) {
      const displayName = currentUnit.unit?.ProductInfo?.name || 
                         currentUnit.unit?.serial_number || 
                         `Unidad ${currentUnit.id}`;
      nameElement.textContent = displayName;
    }
    
    // Actualizar título principal
    const mainTitle = document.querySelector('h1') || document.querySelector('.card-header h5');
    if (mainTitle) {
      mainTitle.innerHTML = `<i class="fas fa-edit me-2"></i>Editando unidad ${currentUnitIndex + 1} de ${unitsData.length}`;
    }
  }
  console.log('✅ Navegador actualizado');
}

// Mostrar una unidad específica
async function showUnit(index) {
  console.log(`🔄 Mostrando unidad en índice: ${index}`);
  if (index < 0 || index >= unitsData.length) {
    console.error(`❌ Índice ${index} fuera de rango (0-${unitsData.length - 1})`);
    return;
  }
  
  currentUnitIndex = index;
  const unitData = unitsData[index];
  const unit = unitData.unit;
  
  console.log('🔍 Datos de unidad a mostrar:', unit);
  
  // Limpiar mensajes
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) messagesContainer.innerHTML = '';
  
  // Mostrar información del producto (solo lectura desde ProductInfo)
  if (unit.ProductInfo) {
    console.log('📋 Mostrando datos del producto desde ProductInfo');
    const productFields = [
      { id: 'productName', value: unit.ProductInfo.name || 'N/A' },
      { id: 'productModel', value: unit.ProductInfo.model || 'N/A' },
      { id: 'productDescription', value: unit.ProductInfo.description || 'N/A' },
      { id: 'productBrand', value: unit.ProductInfo.CategoryInfo?.brand_name || 'N/A' }
    ];
    
    productFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element) {
        if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
          element.value = field.value;
          element.readOnly = true; // Hacer campos de solo lectura
        } else {
          element.textContent = field.value;
        }
        console.log(`✅ Campo ${field.id} establecido: ${field.value}`);
      }
    });
  }
  
  // Llenar campos editables de la unidad
  console.log('📋 Llenando campos editables...');
  const editableFields = [
    { id: 'serial_number', value: unit.serial_number || '' },
    { id: 'internal_code', value: unit.internal_code || '' },
    { id: 'observations', value: unit.observations || '' },
    { id: 'notes', value: unit.notes || '' }
  ];
  
  editableFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      element.value = field.value;
      element.readOnly = false; // Asegurar que son editables
      console.log(`✅ Campo ${field.id} establecido: ${field.value}`);
    } else {
      console.warn(`⚠️ No se encontró elemento: ${field.id}`);
    }
  });
  
  // Cargar y establecer valores de los selects
  console.log('🔄 Cargando selects...');
  await loadUnitSelects(unit);
  
  // Actualizar navegador
  updateNavigator();
  
  console.log(`✅ Unidad ${unitData.id} mostrada correctamente`);
}

// Cargar selects para la unidad actual
async function loadUnitSelects(unit) {
  console.log('🔄 Cargando selects para la unidad...');
  
  const selectElements = {
    guardian: document.getElementById('fk_guardian'),
    area: document.getElementById('fk_area'),
    location: document.getElementById('fk_location'),
    lab: document.getElementById('fk_laboratory'),
    status: document.getElementById('fk_status_label')
  };
  
  try {
    // Cargar todos los selects en paralelo
    await Promise.all([
      selectElements.guardian ? fillGuardians(selectElements.guardian) : Promise.resolve(),
      selectElements.area ? fillSelect(selectElements.area, selectors.area) : Promise.resolve(),
      selectElements.location ? fillSelect(selectElements.location, selectors.ubicacion) : Promise.resolve(),
      selectElements.lab ? fillSelect(selectElements.lab, selectors.laboratorio) : Promise.resolve(),
      selectElements.status ? fillSelect(selectElements.status, selectors.condicion) : Promise.resolve()
    ]);
    
    console.log('✅ Todos los selects cargados, estableciendo valores...');
    
    // Extraer valores usando solo los IDs de las relaciones
    const unitValues = {
      fk_guardian: unit.GuardianInfo?.id_user || unit.fk_guardian || null,
      fk_area: unit.AreaInfo?.id_area || unit.fk_area || null,
      fk_location: unit.LocationInfo?.id_location || unit.fk_location || null,
      fk_laboratory: unit.LabInfo?.id_lab || unit.fk_laboratory || null,
      fk_status_label: unit.StatusLabelInfo?.id_status_label || unit.fk_status_label || null
    };
    
    console.log('🔍 Estructura de unit para debugging:', {
      GuardianInfo: unit.GuardianInfo,
      AreaInfo: unit.AreaInfo,
      LocationInfo: unit.LocationInfo,
      LabInfo: unit.LabInfo,
      StatusLabelInfo: unit.StatusLabelInfo,
      fk_fields: {
        fk_guardian: unit.fk_guardian,
        fk_area: unit.fk_area,
        fk_location: unit.fk_location,
        fk_laboratory: unit.fk_laboratory,
        fk_status_label: unit.fk_status_label
      }
    });
    
    // Establecer valores después de un pequeño delay
    setTimeout(() => {
      console.log('🔄 Estableciendo valores en selects...');
      console.log('🔍 Valores extraídos para selects:', unitValues);
      
      // Mapeo correcto de elementos a valores
      const selectMapping = {
        guardian: unitValues.fk_guardian,
        area: unitValues.fk_area,
        location: unitValues.fk_location,
        lab: unitValues.fk_laboratory,
        status: unitValues.fk_status_label
      };
      
      Object.entries(selectElements).forEach(([key, element]) => {
        if (element) {
          const value = selectMapping[key];
          if (value) {
            element.value = value;
            console.log(`✅ ${key} select establecido: ${value}`);
          } else {
            console.warn(`⚠️ No hay valor para ${key}, valor disponible:`, value);
          }
        } else {
          console.warn(`⚠️ Elemento ${key} no encontrado en DOM`);
        }
      });
      
      console.log('✅ Valores establecidos en selects');
    }, 500);
    
  } catch (error) {
    console.error('❌ Error cargando selects:', error);
  }
}

// Función CORREGIDA para guardar unidad actual - basada en la captura que funciona
async function saveCurrentUnit() {
  console.log('💾 Guardando unidad actual...');
  try {
    if (!unitsData[currentUnitIndex]) {
      showMessage('No hay unidad actual para guardar.', 'error');
      return false;
    }
    
    const currentUnit = unitsData[currentUnitIndex];
    const unitId = currentUnit.unit.id_unit;
    
    console.log('🔍 Guardando unidad ID:', unitId);
    
    if (!unitId) {
      showMessage('Error: No se pudo obtener el ID de la unidad', 'error');
      return false;
    }
    
    // Función helper para limpiar valores
    function cleanValue(value, isNumber = false) {
      if (value === null || value === undefined || value === 'N/A' || value === '') {
        return null;
      }
      
      if (isNumber) {
        const num = parseInt(value);
        return isNaN(num) ? null : num;
      }
      
      return typeof value === 'string' ? value.trim() : value;
    }
    
    // Obtener TODOS los valores del DOM
    const serialNumber = document.getElementById('serial_number')?.value;
    const internalCode = document.getElementById('internal_code')?.value;
    const observations = document.getElementById('observations')?.value;
    const notes = document.getElementById('notes')?.value;
    const statusLabel = document.getElementById('fk_status_label')?.value;
    const guardian = document.getElementById('fk_guardian')?.value;
    const area = document.getElementById('fk_area')?.value;
    const location = document.getElementById('fk_location')?.value;
    const laboratory = document.getElementById('fk_laboratory')?.value;
    
    console.log('🔍 Valores obtenidos del DOM:', {
      serialNumber, internalCode, observations, notes,
      statusLabel, guardian, area, location, laboratory
    });
    
    // Estructura EXACTAMENTE como la captura que funciona
    const unitData = {
      "id_unit": parseInt(unitId),
      "serial_number": cleanValue(serialNumber),
      "internal_code": cleanValue(internalCode),
      "observations": cleanValue(observations),
      "notes": cleanValue(notes)
    };
    
    // Solo agregar foreign keys si tienen valores válidos
    if (cleanValue(statusLabel, true)) {
      unitData.fk_status_label = cleanValue(statusLabel, true);
    }
    if (cleanValue(guardian, true)) {
      unitData.fk_guardian = cleanValue(guardian, true);
    }
    if (cleanValue(area, true)) {
      unitData.fk_area = cleanValue(area, true);
    }
    if (cleanValue(location, true)) {
      unitData.fk_location = cleanValue(location, true);
    }
    if (cleanValue(laboratory, true)) {
      unitData.fk_laboratory = cleanValue(laboratory, true);
    }
    
    console.log('🔍 Datos a enviar (estructura simplificada):', unitData);
    console.log('🔍 URL del PUT:', `${API_BASE}/product_units/${unitId}`);
    
    // Validar campos obligatorios según el HTML
    if (!unitData.serial_number) {
      showMessage('El número de serie es obligatorio', 'error');
      document.getElementById('serial_number')?.focus();
      return false;
    }
    
    if (!unitData.internal_code) {
      showMessage('El código de etiqueta es obligatorio', 'error');
      document.getElementById('internal_code')?.focus();
      return false;
    }
    
    // Mostrar indicador de carga
    showMessage('Guardando unidad...', 'info');
    
    // Enviar PUT request con la estructura simplificada
    console.log('📤 Enviando PUT request...');
    const response = await fetch(`${API_BASE}/product_units/${unitId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(unitData)
    });
    
    console.log('📡 Status de respuesta:', response.status);
    
    // Obtener respuesta
    const responseText = await response.text();
    console.log('📄 Respuesta completa:', responseText);
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        if (responseText) {
          const errorData = JSON.parse(responseText);
          console.log('❌ Error response:', errorData);
          
          if (errorData.ModelState) {
            const modelErrors = [];
            Object.entries(errorData.ModelState).forEach(([field, errors]) => {
              if (Array.isArray(errors)) {
                modelErrors.push(`${field}: ${errors.join(', ')}`);
              } else {
                modelErrors.push(`${field}: ${errors}`);
              }
            });
            errorMessage = `Errores de validación: ${modelErrors.join('; ')}`;
          } else if (errorData.message || errorData.Message) {
            errorMessage = errorData.message || errorData.Message;
          }
        }
      } catch (parseError) {
        console.log('❌ Error parsing response:', parseError);
        errorMessage = responseText || errorMessage;
      }
      
      showMessage(`Error guardando: ${errorMessage}`, 'error');
      return false;
    }
    
    // Manejo de respuesta exitosa
    let responseData = null;
    
    if (responseText.trim()) {
      try {
        responseData = JSON.parse(responseText);
        console.log('✅ Respuesta exitosa:', responseData);
      } catch (parseError) {
        console.log('⚠️ Respuesta exitosa pero no JSON válido');
        responseData = { success: true };
      }
    } else {
      responseData = { success: true };
    }
    
    // Actualizar datos locales con los valores enviados
    const updatedFields = {
      serial_number: unitData.serial_number,
      internal_code: unitData.internal_code,
      observations: unitData.observations,
      notes: unitData.notes,
      fk_status_label: unitData.fk_status_label,
      fk_guardian: unitData.fk_guardian,
      fk_area: unitData.fk_area,
      fk_location: unitData.fk_location,
      fk_laboratory: unitData.fk_laboratory
    };
    
    // Actualizar unidad actual
    Object.assign(unitsData[currentUnitIndex].unit, updatedFields);
    
    // Actualizar cache si existe
    if (allProductUnits.length > 0) {
      const unitIndex = allProductUnits.findIndex(u => u.id_unit === parseInt(unitId));
      if (unitIndex !== -1) {
        Object.assign(allProductUnits[unitIndex], updatedFields);
      }
    }
    
    console.log('✅ Datos locales actualizados:', updatedFields);
    
    showMessage(`✅ Unidad ${unitId} guardada exitosamente.`, 'success');
    markAsSaved();
    return true;
    
  } catch (error) {
    console.error('❌ Error guardando unidad:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showMessage('Error de conexión. Verifique su conexión a internet y que la API esté disponible.', 'error');
    } else {
      showMessage(`Error guardando unidad: ${error.message}`, 'error');
    }
    return false;
  }
}

// Guardar todas las unidades
async function saveAllUnits() {
  console.log('💾 Guardando todas las unidades...');
  let successCount = 0;
  let errorCount = 0;
  
  // Guardar índice actual
  const originalIndex = currentUnitIndex;
  
  for (let i = 0; i < unitsData.length; i++) {
    console.log(`💾 Guardando unidad ${i + 1}/${unitsData.length}...`);
    
    // Cambiar temporalmente a la unidad que vamos a guardar
    await showUnit(i);
    
    // Pequeña pausa para que se actualice la interfaz
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const success = await saveCurrentUnit();
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error guardando unidad ${i + 1}:`, error);
      errorCount++;
    }
    
    // Pequeña pausa entre guardados
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Restaurar unidad original
  await showUnit(originalIndex);
  
  // Mostrar resumen
  if (successCount > 0) {
    showMessage(`✅ ${successCount} unidades guardadas exitosamente.`, 'success');
  }
  if (errorCount > 0) {
    showMessage(`❌ ${errorCount} unidades tuvieron errores al guardar.`, 'error');
  }
  
  console.log(`✅ Proceso completado: ${successCount} éxitos, ${errorCount} errores`);
}

// Navegación entre unidades
function navigateToUnit(direction) {
  console.log(`🔄 Navegando ${direction}...`);
  const newIndex = direction === 'prev' ? currentUnitIndex - 1 : currentUnitIndex + 1;
  if (newIndex >= 0 && newIndex < unitsData.length) {
    showUnit(newIndex);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Configurando event listeners...');
  
  const prevBtn = document.getElementById('prevProduct');
  const nextBtn = document.getElementById('nextProduct');
  const saveBtn = document.getElementById('saveCurrentUnit');
  const saveAllBtn = document.getElementById('saveAllUnits');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateToUnit('prev'));
    console.log('✅ Event listener prevBtn configurado');
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateToUnit('next'));
    console.log('✅ Event listener nextBtn configurado');
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('🔄 Botón guardar clickeado');
      
      // Deshabilitar botón durante el guardado
      saveBtn.disabled = true;
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      try {
        await saveCurrentUnit();
      } finally {
        // Rehabilitar botón
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    });
    console.log('✅ Event listener saveBtn configurado');
  }
  
  if (saveAllBtn) {
    saveAllBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('🔄 Botón guardar todo clickeado');
      
      // Confirmar acción
      if (!confirm(`¿Está seguro de guardar todas las ${unitsData.length} unidades?`)) {
        return;
      }
      
      // Deshabilitar botón durante el guardado
      saveAllBtn.disabled = true;
      const originalText = saveAllBtn.innerHTML;
      saveAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando todo...';
      
      try {
        await saveAllUnits();
      } finally {
        // Rehabilitar botón
        saveAllBtn.disabled = false;
        saveAllBtn.innerHTML = originalText;
      }
    });
    console.log('✅ Event listener saveAllBtn configurado');
  }
  
  // Event listener para detectar cambios en los campos del formulario
  const formFields = [
    'serial_number', 'internal_code', 'observations', 'notes',
    'fk_guardian', 'fk_area', 'fk_location', 'fk_laboratory', 'fk_status_label'
  ];
  
  formFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('change', () => {
        console.log(`🔄 Campo ${fieldId} modificado:`, field.value);
        // Marcar que hay cambios sin guardar (opcional)
        markAsModified();
      });
    }
  });
});

// Función para marcar formulario como modificado
function markAsModified() {
  const saveBtn = document.getElementById('saveCurrentUnit');
  if (saveBtn && !saveBtn.classList.contains('btn-warning')) {
    saveBtn.classList.remove('btn-primary');
    saveBtn.classList.add('btn-warning');
    saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios *';
  }
}

// Función para marcar formulario como guardado
function markAsSaved() {
  const saveBtn = document.getElementById('saveCurrentUnit');
  if (saveBtn) {
    saveBtn.classList.remove('btn-warning');
    saveBtn.classList.add('btn-success');
    saveBtn.innerHTML = '<i class="fas fa-check me-2"></i>Guardado';
    
    // Volver a estado normal después de 2 segundos
    setTimeout(() => {
      saveBtn.classList.remove('btn-success');
      saveBtn.classList.add('btn-primary');
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }, 2000);
  }
}

// Función mejorada para manejar errores de red
function handleNetworkError(error) {
  console.error('❌ Error de red:', error);
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    showMessage('Error de conexión. Verifique su conexión a internet.', 'error');
  } else if (error.message.includes('404')) {
    showMessage('Recurso no encontrado. Verifique la URL de la API.', 'error');
  } else if (error.message.includes('500')) {
    showMessage('Error interno del servidor. Intente más tarde.', 'error');
  } else {
    showMessage(`Error: ${error.message}`, 'error');
  }
}

// Función para debugging - mostrar estado actual
function debugCurrentState() {
  console.log('🔍 ESTADO ACTUAL DEL SISTEMA:');
  console.log('📊 Unidades cargadas:', unitsData.length);
  console.log('📍 Índice actual:', currentUnitIndex);
  
  if (unitsData[currentUnitIndex]) {
    const current = unitsData[currentUnitIndex];
    console.log('🔍 Unidad actual:', {
      id: current.id,
      id_unit: current.unit?.id_unit,
      serial_number: current.unit?.serial_number,
      internal_code: current.unit?.internal_code
    });
    
    // Estado de los campos del formulario
    const formValues = {};
    const fields = ['serial_number', 'internal_code', 'observations', 'notes', 
                   'fk_guardian', 'fk_area', 'fk_location', 'fk_laboratory', 'fk_status_label'];
    
    fields.forEach(field => {
      const element = document.getElementById(field);
      if (element) {
        formValues[field] = element.value;
      }
    });
    
    console.log('🔍 Valores del formulario:', formValues);
  }
  
  console.log('🔍 localStorage selectedProducts:', localStorage.getItem('selectedProducts'));
}

// Añadir función de debugging al objeto window para acceso desde consola
window.debugProductEditor = debugCurrentState;

// Inicialización principal
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 INICIANDO EDITOR DE PRODUCT UNITS...');
  console.log('📍 DOMContentLoaded disparado');
  console.log('🔍 localStorage selectedProducts:', localStorage.getItem('selectedProducts'));
  
  try {
    console.log('🔄 Cargando unidades seleccionadas...');
    await loadAllUnits();
    console.log('✅ INICIALIZACIÓN COMPLETADA EXITOSAMENTE');
    
    // Agregar botón de debug en modo desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🛠️ Modo desarrollo detectado, agregando controles de debug');
      addDebugControls();
    }
    
  } catch (error) {
    console.error('❌ ERROR EN LA INICIALIZACIÓN:', error);
    handleNetworkError(error);
    showMessage(`Error inicializando la página: ${error.message}`, 'error');
  }
});

// Función para agregar controles de debug (solo en desarrollo)
function addDebugControls() {
  const debugContainer = document.createElement('div');
  debugContainer.className = 'alert alert-info mt-3';
  debugContainer.innerHTML = `
    <h6><i class="fas fa-bug me-2"></i>Controles de Debug</h6>
    <button class="btn btn-sm btn-outline-info me-2" onclick="debugProductEditor()">
      <i class="fas fa-info me-1"></i>Estado
    </button>
    <button class="btn btn-sm btn-outline-warning me-2" onclick="console.log('unitsData:', unitsData)">
      <i class="fas fa-database me-1"></i>Ver Datos
    </button>
    <button class="btn btn-sm btn-outline-danger" onclick="localStorage.clear(); location.reload()">
      <i class="fas fa-trash me-1"></i>Limpiar Cache
    </button>
  `;
  
  const container = document.querySelector('.container') || document.body;
  container.appendChild(debugContainer);
}