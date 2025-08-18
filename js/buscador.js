  const normalizeText = (text) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const inputBusqueda = document.getElementById("busquedaInput");

  inputBusqueda.addEventListener("input", () => {
    const filtro = normalizeText(inputBusqueda.value.trim());
    const filas = document.querySelectorAll("#inventoryTableBody tr");

    filas.forEach((fila) => {
      const idCelda = fila.querySelector(".col-id");
      const articuloCelda = fila.querySelector(".col-articulo");

      if (!idCelda || !articuloCelda) return;

      const id = normalizeText(idCelda.textContent);
      const articulo = normalizeText(articuloCelda.textContent);
      const coincide = id.includes(filtro) || articulo.includes(filtro);

      fila.style.display = coincide ? "" : "none";
    });
  });

  function limpiarBusqueda() {
    inputBusqueda.value = "";
    inputBusqueda.dispatchEvent(new Event("input"));
  }
