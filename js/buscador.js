// Función para normalizar texto (eliminar acentos y convertir a minúsculas)
const normalizeText = (text) => {
  if (!text) return "";
  return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Función para inicializar el buscador
function initializeBuscador() {
  const inputBusqueda = document.getElementById("busquedaInput");
  
  if (!inputBusqueda) {
    console.warn("No se encontró el input de búsqueda");
    return;
  }

  // Limpiar eventos anteriores para evitar duplicados
  inputBusqueda.removeEventListener("input", buscarEnTabla);
  inputBusqueda.removeEventListener("keydown", handleKeyDown);
  
  // Agregar eventos
  inputBusqueda.addEventListener("input", buscarEnTabla);
  inputBusqueda.addEventListener("keydown", handleKeyDown);
  
  // Asegurar que el input funcione correctamente
  inputBusqueda.style.pointerEvents = "auto";
  inputBusqueda.disabled = false;
  inputBusqueda.readOnly = false;
}

// Función de búsqueda
function buscarEnTabla() {
  try {
    const inputBusqueda = document.getElementById("busquedaInput");
    if (!inputBusqueda) return;
    
    const filtro = normalizeText(inputBusqueda.value.trim());
    const filas = document.querySelectorAll("#inventoryTableBody tr");

    filas.forEach((fila) => {
      try {
        const celdas = fila.querySelectorAll("td");
        
        if (celdas.length === 0) {
          fila.style.display = "";
          return;
        }

        // Buscar en las columnas relevantes
        const numeroItem = celdas[1] ? normalizeText(celdas[1].textContent) : "";
        const nombreEquipo = celdas[4] ? normalizeText(celdas[4].textContent) : "";
        const nombreTaller = celdas[2] ? normalizeText(celdas[2].textContent) : "";
        const clase = celdas[3] ? normalizeText(celdas[3].textContent) : "";
        const ubicacion = celdas[6] ? normalizeText(celdas[6].textContent) : "";

        // Verificar coincidencias
        const coincide = !filtro || 
          numeroItem.includes(filtro) || 
          nombreEquipo.includes(filtro) ||
          nombreTaller.includes(filtro) ||
          clase.includes(filtro) ||
          ubicacion.includes(filtro);

        fila.style.display = coincide ? "" : "none";
      } catch (error) {
        console.warn("Error procesando fila:", error);
        fila.style.display = "";
      }
    });

    // Manejar icono de limpiar
    updateClearIcon(inputBusqueda.value.trim());
    
  } catch (error) {
    console.error("Error en búsqueda:", error);
  }
}

// Función para manejar teclas especiales
function handleKeyDown(event) {
  if (event.key === "Escape") {
    limpiarBusqueda();
  }
}

// Función para actualizar el icono de limpiar
function updateClearIcon(hasValue) {
  const clearIcon = document.querySelector(".clear-icon");
  if (clearIcon) {
    clearIcon.style.display = hasValue ? "block" : "none";
  }
}

// Función para limpiar búsqueda
function limpiarBusqueda() {
  try {
    const inputBusqueda = document.getElementById("busquedaInput");
    if (inputBusqueda) {
      inputBusqueda.value = "";
      buscarEnTabla();
      inputBusqueda.focus();
    }
  } catch (error) {
    console.error("Error limpiando búsqueda:", error);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeBuscador);
} else {
  initializeBuscador();
}

// También inicializar después de cargar la página completamente
window.addEventListener("load", initializeBuscador);