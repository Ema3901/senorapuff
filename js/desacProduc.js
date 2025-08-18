// Agregar event listener cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  const desactivarBtn = document.getElementById('desactivarBtn');
  if (desactivarBtn) {
    desactivarBtn.addEventListener('click', desactivarProductos);
  }
});

async function desactivarProductos() {
  // Obtener los productos seleccionados (solo filas de items, no expandibles)
  const checkboxes = document.querySelectorAll('#inventoryTableBody tr.item-row input[type="checkbox"]:checked');
  
  if (checkboxes.length === 0) {
    Swal.fire({
      title: 'Advertencia',
      text: 'No has seleccionado ningún producto.',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Obtener los IDs de los productos seleccionados usando el atributo data-id
  const productIds = Array.from(checkboxes).map(checkbox => {
    const row = checkbox.closest('tr.item-row');
    return row.getAttribute('data-id'); // Usar data-id en lugar del texto de la celda
  }).filter(id => id); // Filtrar IDs válidos

  Swal.fire({
    title: '¿Estás seguro?',
    text: '¡Esto deshabilitará los productos seleccionados!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, deshabilitar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Hacer peticiones PUT individuales para cada producto
        const disablePromises = productIds.map(id => 
          fetch(`https://inventariolabsapi.uttn.app/api/product_units/disable/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        );

        const responses = await Promise.all(disablePromises);
        const allSuccessful = responses.every(response => response.ok);

        if (allSuccessful) {
          // Eliminar las filas de los productos deshabilitados (tanto la fila principal como la expandible)
          checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr.item-row');
            const nextRow = row.nextElementSibling; // La fila expandible
            
            // Eliminar la fila expandible si existe
            if (nextRow && nextRow.classList.contains('expandable-row')) {
              nextRow.remove();
            }
            
            // Eliminar la fila principal
            row.remove();
          });

          Swal.fire({
            title: 'Éxito',
            text: 'Los productos seleccionados han sido deshabilitados.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al deshabilitar los productos. Intenta nuevamente.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      } catch (error) {
        console.error('Error al desactivar productos:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al conectarse con la API. Intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  });
}