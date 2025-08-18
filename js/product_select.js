document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el botón de editar está disponible
  const editButton = document.querySelector('button[onclick="editSelectedProducts()"]');
  
  if (editButton) {
    // Asegúrate de que el evento solo se agregue una vez que el DOM esté cargado
    editButton.addEventListener('click', editSelectedProducts);
  }
});

// Función para manejar la edición de productos seleccionados
function editSelectedProducts() {
  const rows = document.querySelectorAll('#inventoryTableBody tr.item-row'); // Solo seleccionar filas de items, no expandibles
  let selectedProductIds = [];

  // Recorrer las filas y verificar si los checkboxes están seleccionados
  rows.forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    
    if (checkbox && checkbox.checked) {
      // Obtener el id_unit desde el atributo data-id que se asigna en createItemRow
      const productId = row.getAttribute('data-id');
      if (productId) {
        selectedProductIds.push(productId);
      }
    }
  });

  // Si no se seleccionaron productos, mostrar una advertencia y redirigir
  if (selectedProductIds.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No se seleccionaron productos',
      text: 'Por favor, selecciona al menos un producto para editar.',
      confirmButtonText: 'Aceptar'
    });
    return; // No continuar con el código si no hay productos seleccionados
  }

  // Almacenar solo las IDs de los productos seleccionados en localStorage
  localStorage.setItem('selectedProducts', JSON.stringify(selectedProductIds));

  // Redirigir automáticamente a la página de edición
  window.location.href = 'editItems.html';
}