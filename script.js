let productosGlobales = [];
let familiaPreownedActiva = "todos";

let mostrarTodosPreowned = 4;
let mostrarTodosNew = 4;
let mostrarTodosOutlet = 4;
let mostrarTodosMacbooks = 4;

let ordenGlobal = "mas-nuevos";

let terminoBusqueda = "";

let dolarBlueVenta = 0;
let dolarWeb = 0;

async function cargarDolar() {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue");
    const data = await res.json();

    dolarBlueVenta = Number(data.venta || 0);
    dolarWeb = dolarBlueVenta + 15;

    const dolarHeader = document.getElementById("dolar-header");
    if (dolarHeader && dolarWeb > 0) {
      dolarHeader.textContent = `Cotización USD $${dolarWeb.toLocaleString("es-AR")}`;
    }
  } catch (error) {
    console.error("Error cargando dólar:", error);

    const dolarHeader = document.getElementById("dolar-header");
    if (dolarHeader) {
      dolarHeader.textContent = "USD no disponible";
    }
  }
}

function obtenerFamilia(modelo) {
  const match = (modelo || "").match(/iPhone\s(\d+)/i);
  return match ? `iPhone ${match[1]}` : "Otros";
}

function obtenerOrdenModelo(modelo) {
  const match = (modelo || "").match(/iPhone\s(\d+)/i);
  const numero = match ? parseInt(match[1], 10) : 0;

  let tipo = 0;

  if (/pro max/i.test(modelo)) tipo = 5;
  else if (/pro/i.test(modelo)) tipo = 4;
  else if (/plus/i.test(modelo)) tipo = 3;
  else if (/mini/i.test(modelo)) tipo = 2;
  else tipo = 1;

  return numero * 10 + tipo;
}

function normalizarTexto(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function cambiarOrden(valor) {
  ordenGlobal = valor;
  renderProductos();
}

function aplicarOrden(a, b) {
  if (ordenGlobal === "menor-precio") {
    const precioA = Number(a.USD || 0) || 99999; // Mandar sin precio al final
    const precioB = Number(b.USD || 0) || 99999;
    return precioA - precioB;
  }
  if (ordenGlobal === "mejor-bateria") {
    const batA = parseInt(a.BATERIA || "0");
    const batB = parseInt(b.BATERIA || "0");
    
    const ciclosA = parseInt(a.CICLOS || "9999");
    const ciclosB = parseInt(b.CICLOS || "9999");

    const esMacbookA = (a.CATEGORIA || "").toLowerCase().includes("macbook");
    const esMacbookB = (b.CATEGORIA || "").toLowerCase().includes("macbook");

    if (esMacbookA && esMacbookB) {
      return ciclosA - ciclosB; // menor cantidad de ciclos es mejor
    }
    
    if (!esMacbookA && !esMacbookB) {
      return batB - batA; // mayor porcentaje de batería es mejor
    }
    return 0;
  }

  // mas-nuevos (default)
  return obtenerOrdenModelo(b.MODELO) - obtenerOrdenModelo(a.MODELO);
}

function productoCoincideBusqueda(p, termino) {
  if (!termino) return true;

  const base = [
    p.MODELO,
    p.GB,
    p.COLOR,
    p.BATERIA,
    p.GRADE,
    p.CATEGORIA,
    p.DETALLE,
    p.CHIP,
    p.RAM,
    p.SSD,
    p.ESTADO
  ]
    .filter(Boolean)
    .join(" ");

  return normalizarTexto(base).includes(normalizarTexto(termino));
}

function limitarProductos(lista, cantidadVisible) {
  return lista.slice(0, cantidadVisible);
}

function toggleBuscadorMobile() {
  const wrap = document.getElementById("buscador-mobile-wrap");
  if (wrap) wrap.classList.toggle("hidden");
}

function toggleMenu() {
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("menu-overlay");

  if (!menu || !overlay) return;

  const abierto = !menu.classList.contains("hidden");

  if (abierto) {
    menu.classList.add("hidden");
    menu.classList.remove("flex");
    overlay.classList.add("hidden");
  } else {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    overlay.classList.remove("hidden");
  }
}

function cerrarMenu() {
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("menu-overlay");

  if (!menu || !overlay) return;

  menu.classList.add("hidden");
  menu.classList.remove("flex");
  overlay.classList.add("hidden");
}

function toggleAccordion(id) {
  const content = document.getElementById(id);
  const icon = document.getElementById(`icon-${id}`);

  if (!content || !icon) return;

  if (content.classList.contains("hidden")) {
    content.classList.remove("hidden");
    content.classList.add("flex");
    icon.style.transform = "rotate(45deg)";
  } else {
    content.classList.add("hidden");
    content.classList.remove("flex");
    icon.style.transform = "rotate(0deg)";
  }
}

function toggleModalFiltros() {
  const modal = document.getElementById("modal-filtros");
  if (!modal) return;
  if (modal.classList.contains("translate-y-full")) {
    modal.classList.remove("translate-y-full");
    modal.classList.add("translate-y-0");
    document.body.style.overflow = "hidden";
  } else {
    modal.classList.add("translate-y-full");
    modal.classList.remove("translate-y-0");
    document.body.style.overflow = "";
  }
}

function obtenerFiltrosActivos() {
  const modelos = Array.from(document.querySelectorAll('.filtro-modelo:checked')).map(cb => cb.value);
  const baterias = Array.from(document.querySelectorAll('.filtro-bateria:checked')).map(cb => parseInt(cb.value));
  const precios = Array.from(document.querySelectorAll('.filtro-precio:checked')).map(cb => cb.value);
  return { modelos, baterias, precios };
}

function filtrarPreowned(lista) {
  const { modelos, baterias, precios } = obtenerFiltrosActivos();
  return lista.filter((p) => {
    if (modelos.length > 0 && !modelos.includes(obtenerFamilia(p.MODELO || ""))) return false;
    if (baterias.length > 0) {
      const batVal = parseInt(p.BATERIA || "0");
      const minBat = Math.min(...baterias);
      if (minBat === 100 && batVal < 100) return false;
      if (minBat < 100 && batVal <= minBat) return false;
    }
    if (precios.length > 0) {
      const pPrecio = Number(p.USD || 99999);
      const cumplePrecio = precios.some(filtro => {
        if (filtro === "500") return pPrecio <= 500;
        if (filtro === "800") return pPrecio <= 800;
        if (filtro === "1000") return pPrecio <= 1000;
        if (filtro === "1000+") return pPrecio > 1000;
        return false;
      });
      if (!cumplePrecio) return false;
    }
    return true;
  });
}

function inicializarFiltrosSidebar(productos) {
  const contenedorModelos = document.getElementById("filtros-modelos");
  if (!contenedorModelos) return;

  let familias = [...new Set(productos.map((p) => obtenerFamilia(p.MODELO || "")))];
  familias = familias.filter((familia) => familia && familia !== "Otros");

  familias.sort((a, b) => {
    const numA = parseInt((a.match(/\d+/) || ["0"])[0], 10);
    const numB = parseInt((b.match(/\d+/) || ["0"])[0], 10);
    return numB - numA;
  });

  contenedorModelos.innerHTML = familias.map(familia => `
    <label class="flex items-center gap-3 text-sm text-black/80 dark:text-white/80 cursor-pointer hover:text-black dark:text-white transition">
      <input type="checkbox" value="${familia}" class="filtro-modelo accent-black w-4 h-4 rounded border-black/20 dark:border-white/20">
      <span>${familia}</span>
    </label>
  `).join("");

  const checkboxes = document.querySelectorAll('.filtro-modelo, .filtro-bateria, .filtro-precio');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      mostrarTodosPreowned = 6;
      renderProductos();
    });
  });
}

const sliders = {};

function moverSlide(id, direccion) {
  const slider = document.getElementById(`slider-${id}`);
  if (!slider) return;

  const total = slider.children.length;
  if (total <= 1) return;

  if (sliders[id] === undefined) sliders[id] = 0;

  sliders[id] += direccion;

  if (sliders[id] < 0) sliders[id] = total - 1;
  if (sliders[id] >= total) sliders[id] = 0;

  slider.style.transform = `translateX(-${sliders[id] * 100}%)`;
}

function resolverRutaImagen(valor) {
  const img = (valor || "").trim();
  if (!img) return "";

  if (
    img.startsWith("http://") ||
    img.startsWith("https://") ||
    img.startsWith("img/")
  ) {
    return img;
  }

  return `img/${img}`;
}

function construirCard(p) {
  const categoria = (p.CATEGORIA || "").toLowerCase().trim();
  const esMacbook = categoria === "macbook-preowned" || categoria === "macbook";

  const modelo = p.MODELO || "";
  const gb = esMacbook ? (p.SSD || "") : (p.GB || "");
  const color = p.COLOR || "";
  const bateria = p.BATERIA || "";
  const ciclos = p.CICLOS || "";
  const chip = p.CHIP || "";
  const ram = p.RAM || "";
  const precio = p.USD || "";
  const grade = p.GRADE || "";
  const detalle = p.DETALLE || "";
  const estado = p.ESTADO || "";

  const id = `${modelo}-${gb}-${color}`
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  const imagenes = [p.IMAGEN_1, p.IMAGEN_2, p.IMAGEN_3]
    .filter(Boolean)
    .map(resolverRutaImagen);

  const imagenesFinales = imagenes.length ? imagenes : ["img/iphone.jpg"];

  const bateriaTag = bateria
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">${bateria} batería</span>`
    : "";

  const ciclosTag = ciclos
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">${ciclos} ciclos</span>`
    : "";

  const gradeTag = grade
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">Grade ${grade}</span>`
    : "";

  let subTitulo = gb;
  if (esMacbook) {
    const parts = [];
    if (chip) parts.push(chip);
    if (ram) parts.push(`${ram} RAM`);
    if (gb) parts.push(`${gb} SSD`);
    if (color) parts.push(color);
    subTitulo = parts.join(" · ");
  } else {
    if (color) subTitulo += ` · ${color}`;
  }

  const precioTexto = precio ? `USD ${precio}` : "Consultar";

  const precioNumerico = Number(precio || 0);
  const precioPesos =
    precioNumerico && dolarWeb ? Math.round(precioNumerico * dolarWeb) : 0;

  let nombreProducto = esMacbook ? `la ${modelo}` : `el ${modelo}`;
  if (esMacbook) {
    if (chip) nombreProducto += ` ${chip}`;
    if (ram) nombreProducto += ` ${ram} RAM`;
    if (gb) nombreProducto += ` ${gb} SSD`;
  } else {
    if (gb) nombreProducto += ` ${gb}`;
  }
  if (color) nombreProducto += ` ${color}`;
  
  nombreProducto = nombreProducto.replace(/\s+/g, " ");

  const mensaje = `Hola Hassel! Quiero consultar por ${nombreProducto} que vi en la web. ¿L${esMacbook ? "a" : "o"} tienen disponible?`;

  const waLink = `https://wa.me/5491136404202?text=${encodeURIComponent(mensaje)}`;

  const esNuevo = categoria === "iphone-new";
  const esOutlet = categoria === "iphone-outlet";
  const esPreowned = categoria === "iphone-preowned" || esMacbook;

  const outletDetalle = esOutlet
    ? `<p class="text-sm text-black/50 dark:text-white/50 mb-4">${
        detalle || "Equipo outlet con detalle informado al momento de la compra."
      }</p>`
    : "";

  const estadoDetalle = esMacbook && estado
    ? `<p class="text-sm text-black/50 dark:text-white/50 mb-4">${estado}</p>`
    : "";

  const nuevoTags = esNuevo
    ? `
      <span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">Nuevo</span>
      <span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">Sellado</span>
    `
    : "";

  const preownedTag = esPreowned
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">PreOwned</span>`
    : "";

  const outletTag = esOutlet
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">Outlet</span>`
    : "";

  return `
    <article class="reveal rounded-3xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/8 p-4">
      <div class="mb-4 relative">
        <div class="overflow-hidden rounded-2xl aspect-square">
          <div id="slider-${id}" class="flex h-full w-full max-w-full transition-transform duration-300 ease-out">
            ${imagenesFinales
              .map(
                (img) => `
              <div class="relative basis-full min-w-full w-full h-full aspect-square shrink-0 overflow-hidden">
                <img src="${img}" alt="${modelo}" loading="lazy" class="w-full h-full aspect-square object-cover" onerror="this.onerror=null; this.src='img/IMG_9926 (1).jpg';">
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        ${
          imagenesFinales.length > 1
            ? `
            <button onclick="moverSlide('${id}', -1)"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-black/10 dark:border-white/10 text-black dark:text-white">
              ‹
            </button>

            <button onclick="moverSlide('${id}', 1)"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-black/10 dark:border-white/10 text-black dark:text-white">
              ›
            </button>
          `
            : ""
        }
      </div>

      <div class="mb-3">
        <h3 class="text-lg font-semibold text-black dark:text-white leading-tight">${modelo}</h3>
        <p class="text-sm text-black/50 dark:text-white/50">${subTitulo}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-4 text-xs text-black/60 dark:text-white/60">
        ${bateriaTag}
        ${ciclosTag}
        ${gradeTag}
        ${preownedTag}
        ${nuevoTags}
        ${outletTag}
      </div>

      ${outletDetalle}
      ${estadoDetalle}

      <div class="flex items-end justify-between gap-3">
        <div>
          <p class="text-xl font-semibold text-black dark:text-white leading-none">
            ${precioTexto}
          </p>

          <p class="text-sm font-medium text-[#1F8F5F] mt-1">
            ${precioPesos ? `$${precioPesos.toLocaleString("es-AR")}` : ""}
          </p>
        </div>

        <a href="${waLink}" target="_blank"
          class="px-4 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-medium">
          Consultar
        </a>
      </div>
    </article>
  `;
}

function renderProductos() {
  const preownedGrid = document.querySelector("#preowned-grid");
  const newGrid = document.querySelector("#iphone-new .grid");
  const outletGrid = document.querySelector("#outlet .grid");
  const macbooksGrid = document.querySelector("#macbooks .grid");

  const preownedVerMas = document.getElementById("preowned-vermas");
  const newVerMas = document.getElementById("iphone-new-vermas");
  const outletVerMas = document.getElementById("outlet-vermas");
  const macbooksVerMas = document.getElementById("macbooks-vermas");

  if (preownedGrid) preownedGrid.innerHTML = "";
  if (newGrid) newGrid.innerHTML = "";
  if (outletGrid) outletGrid.innerHTML = "";
  if (macbooksGrid) macbooksGrid.innerHTML = "";

  const preowned = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort(aplicarOrden);

  const nuevos = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-new")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort(aplicarOrden);

  const outlet = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-outlet")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort(aplicarOrden);

  const macbooks = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "macbook-preowned" || (p.CATEGORIA || "").toLowerCase().trim() === "macbook")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort(aplicarOrden);

  const preownedFiltrados = filtrarPreowned(preowned);

  const preownedVisibles = limitarProductos(preownedFiltrados, mostrarTodosPreowned);
  const nuevosVisibles = limitarProductos(nuevos, mostrarTodosNew);
  const outletVisibles = limitarProductos(outlet, mostrarTodosOutlet);
  const macbooksVisibles = limitarProductos(macbooks, mostrarTodosMacbooks);

  const htmlEmptyState = `
    <div class="col-span-full py-12 flex flex-col items-center justify-center text-center">
      <iconify-icon icon="lucide:search-x" class="text-4xl text-black/20 dark:text-white/20 mb-4"></iconify-icon>
      <p class="text-lg font-semibold text-black dark:text-white mb-2">No encontramos equipos exactos.</p>
      <p class="text-sm text-black/50 dark:text-white/50 mb-6 max-w-sm">Intentá con otros filtros o escribinos por WhatsApp para ver si te lo podemos conseguir.</p>
      <a href="https://wa.me/5491136404202?text=Hola%20Hassel!%20Estoy%20buscando%20un%20equipo%20y%20no%20lo%20encuentro%20en%20la%20web." target="_blank" class="px-5 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium">Consultar por WhatsApp</a>
    </div>
  `;

  if (preownedGrid) preownedGrid.innerHTML = preownedVisibles.length ? preownedVisibles.map(construirCard).join("") : htmlEmptyState;
  if (newGrid) newGrid.innerHTML = nuevosVisibles.length ? nuevosVisibles.map(construirCard).join("") : htmlEmptyState;
  if (outletGrid) outletGrid.innerHTML = outletVisibles.length ? outletVisibles.map(construirCard).join("") : htmlEmptyState;
  if (macbooksGrid) macbooksGrid.innerHTML = macbooksVisibles.length ? macbooksVisibles.map(construirCard).join("") : htmlEmptyState;

  // Inicializar animaciones reveal en las tarjetas nuevas si las tuvieran
  setTimeout(initReveals, 50);

  if (preownedVerMas) {
    preownedVerMas.innerHTML =
      preownedFiltrados.length > 4
        ? `
        <button onclick="toggleVerMas('preowned')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
          ${mostrarTodosPreowned >= preownedFiltrados.length ? "Ver menos" : "Ver más"}
        </button>
      `
        : "";
  }

  if (newVerMas) {
    newVerMas.innerHTML =
      nuevos.length > 4
        ? `
        <button onclick="toggleVerMas('iphone-new')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
          ${mostrarTodosNew >= nuevos.length ? "Ver menos" : "Ver más"}
        </button>
      `
        : "";
  }

  if (outletVerMas) {
    outletVerMas.innerHTML =
      outlet.length > 4
        ? `
        <button onclick="toggleVerMas('outlet')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
          ${mostrarTodosOutlet >= outlet.length ? "Ver menos" : "Ver más"}
        </button>
      `
        : "";
  }

  if (macbooksVerMas) {
    macbooksVerMas.innerHTML =
      macbooks.length > 4
        ? `
        <button onclick="toggleVerMas('macbooks')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
          ${mostrarTodosMacbooks >= macbooks.length ? "Ver menos" : "Ver más"}
        </button>
      `
        : "";
  }

  const resultadosWrap = document.getElementById("resultados-busqueda");
  const gridResultados = document.getElementById("grid-resultados");

  if (terminoBusqueda.trim() !== "") {
    const resultados = productosGlobales
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
      .sort((a, b) => obtenerOrdenModelo(b.MODELO) - obtenerOrdenModelo(a.MODELO));

    if (resultadosWrap && gridResultados) {
      resultadosWrap.classList.remove("hidden");
      gridResultados.innerHTML = resultados.length
        ? resultados.map(construirCard).join("")
        : `<p class="text-sm text-black/50 dark:text-white/50 col-span-full">No encontramos resultados.</p>`;
    }
  } else {
    resultadosWrap?.classList.add("hidden");
  }
}

function toggleVerMas(categoria) {
  if (categoria === "preowned") {
    const preowned = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    const preownedFiltrados = filtrarPreowned(preowned);

    if (mostrarTodosPreowned >= preownedFiltrados.length) {
      mostrarTodosPreowned = 4;
    } else {
      mostrarTodosPreowned += 4;
    }
  }

  if (categoria === "iphone-new") {
    const nuevos = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-new")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosNew >= nuevos.length) {
      mostrarTodosNew = 4;
    } else {
      mostrarTodosNew += 4;
    }
  }

  if (categoria === "outlet") {
    const outlet = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-outlet")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosOutlet >= outlet.length) {
      mostrarTodosOutlet = 4;
    } else {
      mostrarTodosOutlet += 4;
    }
  }

  if (categoria === "macbooks") {
    const macbooks = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "macbook-preowned" || (p.CATEGORIA || "").toLowerCase().trim() === "macbook")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosMacbooks >= macbooks.length) {
      mostrarTodosMacbooks = 4;
    } else {
      mostrarTodosMacbooks += 4;
    }
  }

  renderProductos();
}

async function cargarProductos() {
  mostrarSkeletons();

  const urlIphones =
    "https://opensheet.elk.sh/1wLegO19-06hNTsL-Fta_nwkGSCcF3omBYVTqpCCKUZA/iphone";
  const urlMacbooks =
    "https://opensheet.elk.sh/1wLegO19-06hNTsL-Fta_nwkGSCcF3omBYVTqpCCKUZA/MacBook";

  try {
    const [resIphones, resMacbooks] = await Promise.all([
      fetch(urlIphones),
      fetch(urlMacbooks).catch(() => ({ json: () => [] })) // en caso de que la URL de macbooks falle
    ]);

    const dataIphones = await resIphones.json();
    let dataMacbooks = [];
    if (resMacbooks.ok) {
        dataMacbooks = await resMacbooks.json();
    }

    const iphonesArr = Array.isArray(dataIphones) ? dataIphones : [];
    const macbooksArr = Array.isArray(dataMacbooks) ? dataMacbooks : [];

    // Por defecto asumo que vienen sin categoria "macbook-preowned"
    macbooksArr.forEach(m => m.CATEGORIA = m.CATEGORIA || "macbook-preowned");

    productosGlobales = [...iphonesArr, ...macbooksArr];

    inicializarFiltrosSidebar(
      productosGlobales.filter(
        (p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned"
      )
    );

    renderProductos();
  } catch (error) {
    console.error("Error cargando productos:", error);
    mostrarErrorVisual();
  }
}

function mostrarErrorVisual() {
  const preownedGrid = document.querySelector("#preowned-grid");
  const newGrid = document.querySelector("#iphone-new .grid");
  const outletGrid = document.querySelector("#outlet .grid");
  const macbooksGrid = document.querySelector("#macbooks .grid");

  const htmlError = `
    <div class="col-span-full p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-red-500/20 shadow-sm mt-4">
      <p class="text-lg font-semibold text-black dark:text-white mb-2">Tuvimos un problema cargando el stock.</p>
      <p class="text-sm text-black/60 dark:text-white/60 mb-5">Por favor, revisá tu conexión o contactanos directamente para conocer el stock.</p>
      <a href="https://wa.me/5491136404202?text=Hola%20Hassel!%20No%20me%20carga%20la%20página,%20quería%20consultar%20el%20stock." 
         target="_blank" 
         class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-black/80 dark:bg-white/80 transition">
        Escribinos por WhatsApp
      </a>
    </div>
  `;

  if (preownedGrid) preownedGrid.innerHTML = htmlError;
  if (newGrid) newGrid.innerHTML = htmlError;
  if (outletGrid) outletGrid.innerHTML = htmlError;
  if (macbooksGrid) macbooksGrid.innerHTML = htmlError;
}

function mostrarSkeletons() {
  const preownedGrid = document.querySelector("#preowned-grid");
  const newGrid = document.querySelector("#iphone-new .grid");
  const outletGrid = document.querySelector("#outlet .grid");
  const macbooksGrid = document.querySelector("#macbooks .grid");

  const htmlSkeleton = `
    <article class="rounded-3xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/8 p-4 animate-pulse">
      <div class="mb-4 relative">
        <div class="overflow-hidden rounded-2xl aspect-square bg-black/5 dark:bg-white/5"></div>
      </div>
      <div class="mb-3">
        <div class="h-6 bg-black/5 dark:bg-white/5 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-black/5 dark:bg-white/5 rounded w-1/2"></div>
      </div>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <div class="h-6 w-16 bg-black/5 dark:bg-white/5 rounded-full"></div>
        <div class="h-6 w-20 bg-black/5 dark:bg-white/5 rounded-full"></div>
      </div>
      <div class="flex items-end justify-between gap-3">
        <div>
          <div class="h-7 w-24 bg-black/5 dark:bg-white/5 rounded mb-1"></div>
          <div class="h-4 w-16 bg-black/5 dark:bg-white/5 rounded"></div>
        </div>
        <div class="h-9 w-24 bg-black/5 dark:bg-white/5 rounded-full"></div>
      </div>
    </article>
  `;
  
  const repeatSkeletons = htmlSkeleton.repeat(4);

  if (preownedGrid) preownedGrid.innerHTML = repeatSkeletons;
  if (newGrid) newGrid.innerHTML = repeatSkeletons;
  if (outletGrid) outletGrid.innerHTML = repeatSkeletons;
  if (macbooksGrid) macbooksGrid.innerHTML = repeatSkeletons;
}

document.addEventListener("DOMContentLoaded", async () => {
  const buscadorDesktop = document.getElementById("buscador-stock");
  const buscadorMobile = document.getElementById("buscador-stock-mobile");

  if (buscadorDesktop) {
    buscadorDesktop.addEventListener("input", (e) => {
      terminoBusqueda = e.target.value;
      familiaPreownedActiva = "todos";
      mostrarTodosPreowned = 4;
      renderProductos();
    });
  }

  if (buscadorMobile) {
    buscadorMobile.addEventListener("input", (e) => {
      terminoBusqueda = e.target.value;
      mostrarTodosPreowned = 6;
      renderProductos();
    });
  }

  await cargarDolar();
  await cargarProductos();
  
  setTimeout(initReveals, 100);
});

function enviarServiceWhatsApp() {
  const nombre = document.getElementById("service-nombre")?.value.trim() || "";
  const whatsapp = document.getElementById("service-whatsapp")?.value.trim() || "";
  const modelo = document.getElementById("service-modelo")?.value.trim() || "";
  const mensaje = document.getElementById("service-mensaje")?.value.trim() || "";

  if (!nombre || !modelo || !mensaje) {
    alert("Completá al menos nombre, modelo y qué le pasa al equipo.");
    return;
  }

  const texto = `Hola Hassel, quiero consultar por servicio técnico.

Nombre: ${nombre}
WhatsApp: ${whatsapp}
Modelo: ${modelo}
Falla: ${mensaje}`;

  const url = `https://wa.me/5491136404202?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

let heroSlideActual = 0;
let heroSliderInterval;

function actualizarHeroSlider(index) {
  const slider = document.getElementById("hero-slider");
  const dots = document.querySelectorAll(".hero-dot");
  if (!slider) return;

  heroSlideActual = index;
  slider.style.transform = `translateX(-${heroSlideActual * 100}%)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle("bg-black", i === heroSlideActual);
    dot.classList.toggle("dark:bg-white", i === heroSlideActual);
    dot.classList.toggle("bg-black/20", i !== heroSlideActual);
    dot.classList.toggle("dark:bg-white/20", i !== heroSlideActual);
  });
}

function siguienteHeroSlide() {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  const totalSlides = slider.children.length;
  heroSlideActual = (heroSlideActual + 1) % totalSlides;
  actualizarHeroSlider(heroSlideActual);
}

function iniciarHeroSlider() {
  const slider = document.getElementById("hero-slider");
  const dots = document.querySelectorAll(".hero-dot");
  if (!slider || !dots.length) return;

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      actualizarHeroSlider(index);
      reiniciarHeroSlider();
    });
  });

  // Swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  slider.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, {passive: true});
  slider.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) heroNext();
    if (touchEndX - touchStartX > 50) heroPrev();
  }, {passive: true});

  heroSliderInterval = setInterval(siguienteHeroSlide, 4500);
}

function reiniciarHeroSlider() {
  clearInterval(heroSliderInterval);
  heroSliderInterval = setInterval(siguienteHeroSlide, 4500);
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarHeroSlider();
});

function heroNext() {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  const totalSlides = slider.children.length;
  heroSlideActual = (heroSlideActual + 1) % totalSlides;
  actualizarHeroSlider(heroSlideActual);
  reiniciarHeroSlider();
}

function heroPrev() {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  const totalSlides = slider.children.length;
  heroSlideActual = (heroSlideActual - 1 + totalSlides) % totalSlides;
  actualizarHeroSlider(heroSlideActual);
  reiniciarHeroSlider();
}

// ANIMACIONES REVEAL
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-active');
      observer.unobserve(entry.target);
    }
  });
}, {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
});

function initReveals() {
  const reveals = document.querySelectorAll('.reveal:not(.reveal-active)');
  reveals.forEach(el => revealObserver.observe(el));
}
