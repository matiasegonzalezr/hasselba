let productosGlobales = [];
let familiaPreownedActiva = "todos";

let mostrarTodosPreowned = 4;
let mostrarTodosNew = 4;
let mostrarTodosOutlet = 4;
let mostrarTodosMacbooks = 4;
let mostrarTodosIpads = 4;
let mostrarTodosMacbooksNew = 4;
let mostrarTodosIpadsNew = 4;
let mostrarTodosWatchNew = 4;
let mostrarTodosWatch = 4;
let mostrarTodosAccesorios = 4;

// Filtro por TIPO de accesorio ("todos" o el TIPO normalizado)
let tipoAccesorioActivo = "todos";
let tiposAccesorios = []; // [{ clave, etiqueta }]

let ordenGlobal = "mas-nuevos";

let terminoBusqueda = "";

let dolarBlueVenta = 0;
let dolarWeb = 0;

// Helper para leer propiedades ignorando mayúsculas, minúsculas y tildes
function getVal(obj, ...possibleKeys) {
  if (!obj) return "";
  for (const k of possibleKeys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return String(obj[k]).trim();
    }
    const foundKey = Object.keys(obj).find(
      key => normalizarTexto(key) === normalizarTexto(k)
    );
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && String(obj[foundKey]).trim() !== "") {
      return String(obj[foundKey]).trim();
    }
  }
  return "";
}

// Normaliza las filas leídas desde Google Sheets a propiedades estándar
function normalizarFilaSheet(item) {
  if (!item) return {};
  const modelo = getVal(item, "MODELO", "Modelo", "PRODUCTO", "Producto", "Product");
  const gb = getVal(item, "GB", "Gb", "Tamaño", "Tamano", "Capacidad", "Almacenamiento");
  const categoria = getVal(item, "CATEGORIA", "Categoría", "Categoria", "Category");
  const tipo = getVal(item, "TIPO", "Tipo");
  const color = getVal(item, "COLOR", "Color");
  const usd = getVal(item, "USD", "Usd", "Precio", "PRECIO");
  const img1 = getVal(item, "IMAGEN_1", "Imagen_1", "Imagen 1", "IMAGEN 1");
  const img2 = getVal(item, "IMAGEN_2", "Imagen_2", "Imagen 2", "IMAGEN 2");
  const img3 = getVal(item, "IMAGEN_3", "Imagen_3", "Imagen 3", "IMAGEN 3");
  const detalle = getVal(item, "DETALLE", "Detalle");
  const estado = getVal(item, "ESTADO", "Estado");
  const chip = getVal(item, "CHIP", "Chip");
  const ram = getVal(item, "RAM", "Ram");
  const ssd = getVal(item, "SSD", "Ssd");
  const bateria = getVal(item, "BATERIA", "Bateria", "Batería");
  const grade = getVal(item, "GRADE", "Grade");
  const ciclos = getVal(item, "CICLOS", "Ciclos");
  const precioAntes = getVal(item, "PRECIO_ANTES", "Precio_Antes", "Precio Antes");

  return {
    ...item,
    MODELO: modelo,
    PRODUCTO: modelo,
    GB: gb,
    CATEGORIA: categoria,
    TIPO: tipo,
    COLOR: color,
    USD: usd,
    IMAGEN_1: img1,
    IMAGEN_2: img2,
    IMAGEN_3: img3,
    DETALLE: detalle,
    ESTADO: estado,
    CHIP: chip,
    RAM: ram,
    SSD: ssd,
    BATERIA: bateria,
    GRADE: grade,
    CICLOS: ciclos,
    PRECIO_ANTES: precioAntes
  };
}

async function cargarDolar() {
  const dolarHeader = document.getElementById("dolar-header");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s de tolerancia

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue", { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();

    dolarBlueVenta = Number(data.venta || 0);
    dolarWeb = dolarBlueVenta + 15;

    if (dolarHeader) {
      dolarHeader.textContent = dolarWeb > 0
        ? `Cotización USD $${dolarWeb.toLocaleString("es-AR")}`
        : "Cotización: consultar";
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error cargando dólar:", error);
    dolarWeb = 0;
    if (dolarHeader) dolarHeader.textContent = "Cotización: consultar";
  } finally {
    if (productosGlobales.length) renderProductos();
  }
}

function obtenerFamilia(modelo) {
  const match = (modelo || "").match(/iPhone\s(\d+)/i);
  return match ? `iPhone ${match[1]}` : "Otros";
}

function obtenerFamiliaMac(modelo) {
  if (/pro/i.test(modelo || "")) return "MacBook Pro";
  if (/air/i.test(modelo || "")) return "MacBook Air";
  return "Otros";
}

function obtenerOrdenModelo(modelo) {
  const mod = (modelo || "").toString();
  const match = mod.match(/(\d+)/);
  const numero = match ? parseInt(match[1], 10) : 0;

  let tipo = 0;

  if (/pro max/i.test(mod)) tipo = 5;
  else if (/pro/i.test(mod)) tipo = 4;
  else if (/plus/i.test(mod)) tipo = 3;
  else if (/mini/i.test(mod)) tipo = 2;
  else if (/ultra/i.test(mod)) tipo = 6;
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

function formatearPesos(valor) {
  if (!valor) return "";
  return "$" + Math.round(valor).toLocaleString("es-AR");
}

function cambiarOrden(valor) {
  ordenGlobal = valor;
  renderProductos();
}

function aplicarOrden(a, b) {
  if (!a || !b) return 0;
  if (ordenGlobal === "menor-precio") {
    const precioA = Number(a.USD || 0) || 99999;
    const precioB = Number(b.USD || 0) || 99999;
    return precioA - precioB;
  }
  if (ordenGlobal === "mejor-bateria") {
    const batA = parseInt(a.BATERIA || "0", 10);
    const batB = parseInt(b.BATERIA || "0", 10);
    
    const ciclosA = parseInt(a.CICLOS || "9999", 10);
    const ciclosB = parseInt(b.CICLOS || "9999", 10);

    const esMacbookA = (a.CATEGORIA || "").toLowerCase().includes("macbook");
    const esMacbookB = (b.CATEGORIA || "").toLowerCase().includes("macbook");

    if (esMacbookA && esMacbookB) {
      return ciclosA - ciclosB;
    }
    
    if (!esMacbookA && !esMacbookB) {
      return batB - batA;
    }
    return 0;
  }

  // mas-nuevos (default)
  return obtenerOrdenModelo(b.MODELO || b.PRODUCTO) - obtenerOrdenModelo(a.MODELO || a.PRODUCTO);
}

function productoCoincideBusqueda(p, termino) {
  if (!p) return false;
  if (!termino) return true;

  const base = [
    p.MODELO,
    p.PRODUCTO,
    p.GB,
    p.COLOR,
    p.BATERIA,
    p.GRADE,
    p.CATEGORIA,
    p.DETALLE,
    p.CHIP,
    p.RAM,
    p.SSD,
    p.ESTADO,
    p.TIPO
  ]
    .filter(Boolean)
    .join(" ");

  return normalizarTexto(base).includes(normalizarTexto(termino));
}

function limitarProductos(lista, cantidadVisible) {
  return (lista || []).slice(0, cantidadVisible);
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
  const overlay = document.getElementById("overlay-filtros");
  if (!modal) return;

  if (modal.classList.contains("translate-y-full")) {
    modal.classList.remove("translate-y-full");
    modal.classList.add("translate-y-0");
    document.body.style.overflow = "hidden";
    if (overlay) overlay.classList.add("active");
  } else {
    modal.classList.add("translate-y-full");
    modal.classList.remove("translate-y-0");
    document.body.style.overflow = "";
    if (overlay) overlay.classList.remove("active");
  }
}

function obtenerFiltrosActivos() {
  const modelos = Array.from(document.querySelectorAll('.filtro-modelo:checked')).map(cb => cb.value);
  const baterias = Array.from(document.querySelectorAll('.filtro-bateria:checked')).map(cb => parseInt(cb.value, 10));
  const precios = Array.from(document.querySelectorAll('.filtro-precio:checked')).map(cb => cb.value);
  const almacenamientos = Array.from(document.querySelectorAll('.filtro-almacenamiento:checked')).map(cb => cb.value);
  return { modelos, baterias, precios, almacenamientos };
}

function filtrarPreowned(lista) {
  const { modelos, baterias, precios, almacenamientos } = obtenerFiltrosActivos();
  return (lista || []).filter((p) => {
    if (modelos.length > 0 && !modelos.includes(obtenerFamilia(p.MODELO || p.PRODUCTO || ""))) return false;
    if (baterias.length > 0) {
      const batVal = parseInt(p.BATERIA || "0", 10);
      const minBat = Math.min(...baterias);
      if (minBat === 100 && batVal < 100) return false;
      if (minBat < 100 && batVal <= minBat) return false;
    }
    if (almacenamientos.length > 0) {
      const gbVal = (p.GB || "").toString().replace(/[^\d]/g, "");
      if (!almacenamientos.includes(gbVal)) return false;
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

  let familias = [...new Set((productos || []).map((p) => obtenerFamilia(p.MODELO || p.PRODUCTO || "")))];
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

  const checkboxes = document.querySelectorAll('.filtro-modelo, .filtro-bateria, .filtro-precio, .filtro-almacenamiento');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      mostrarTodosPreowned = 6;
      renderProductos();
    });
  });
}

function ordenarNumerico(valores) {
  return (valores || []).sort((a, b) => {
    const numA = parseFloat((a.match(/[\d.]+/) || ["0"])[0]);
    const numB = parseFloat((b.match(/[\d.]+/) || ["0"])[0]);
    return numA - numB;
  });
}

function inicializarFiltrosSidebarMac(productos) {
  const contenedorModelos = document.getElementById("filtros-mac-modelo");
  const contenedorChip = document.getElementById("filtros-mac-chip");
  const contenedorRam = document.getElementById("filtros-mac-ram");
  const contenedorSsd = document.getElementById("filtros-mac-ssd");

  if (!contenedorModelos || !contenedorChip || !contenedorRam || !contenedorSsd) return;

  let familias = [...new Set((productos || []).map((p) => obtenerFamiliaMac(p.MODELO || p.PRODUCTO || "")))]
    .filter((f) => f && f !== "Otros")
    .sort();

  let chips = [...new Set((productos || []).map((p) => (p.CHIP || "").trim()))].filter(Boolean);
  let rams = ordenarNumerico([...new Set((productos || []).map((p) => (p.RAM || "").trim()))].filter(Boolean));
  let ssds = ordenarNumerico([...new Set((productos || []).map((p) => (p.SSD || "").trim()))].filter(Boolean));

  const renderGrupo = (valores, claseFiltro) =>
    valores.map(valor => `
      <label class="flex items-center gap-3 text-sm text-black/80 dark:text-white/80 cursor-pointer hover:text-black dark:text-white transition">
        <input type="checkbox" value="${valor}" class="${claseFiltro} accent-black w-4 h-4 rounded border-black/20 dark:border-white/20">
        <span>${valor}</span>
      </label>
    `).join("");

  contenedorModelos.innerHTML = renderGrupo(familias, "filtro-mac-modelo");
  contenedorChip.innerHTML = renderGrupo(chips, "filtro-mac-chip");
  contenedorRam.innerHTML = renderGrupo(rams, "filtro-mac-ram");
  contenedorSsd.innerHTML = renderGrupo(ssds, "filtro-mac-ssd");

  const checkboxesMac = document.querySelectorAll('.filtro-mac-modelo, .filtro-mac-chip, .filtro-mac-ram, .filtro-mac-ssd');
  checkboxesMac.forEach(cb => {
    cb.addEventListener('change', () => {
      mostrarTodosMacbooks = 6;
      renderProductos();
    });
  });
}

function obtenerFiltrosActivosMac() {
  const modelos = Array.from(document.querySelectorAll('.filtro-mac-modelo:checked')).map(cb => cb.value);
  const chips = Array.from(document.querySelectorAll('.filtro-mac-chip:checked')).map(cb => cb.value);
  const rams = Array.from(document.querySelectorAll('.filtro-mac-ram:checked')).map(cb => cb.value);
  const ssds = Array.from(document.querySelectorAll('.filtro-mac-ssd:checked')).map(cb => cb.value);
  return { modelos, chips, rams, ssds };
}

function filtrarMacbooks(lista) {
  const { modelos, chips, rams, ssds } = obtenerFiltrosActivosMac();
  return (lista || []).filter((p) => {
    if (modelos.length > 0 && !modelos.includes(obtenerFamiliaMac(p.MODELO || p.PRODUCTO || ""))) return false;
    if (chips.length > 0 && !chips.includes((p.CHIP || "").trim())) return false;
    if (rams.length > 0 && !rams.includes((p.RAM || "").trim())) return false;
    if (ssds.length > 0 && !ssds.includes((p.SSD || "").trim())) return false;
    return true;
  });
}

function toggleModalFiltrosMac() {
  const modal = document.getElementById("modal-filtros-mac");
  const overlay = document.getElementById("overlay-filtros-mac");
  if (!modal) return;

  if (modal.classList.contains("translate-y-full")) {
    modal.classList.remove("translate-y-full");
    modal.classList.add("translate-y-0");
    document.body.style.overflow = "hidden";
    if (overlay) overlay.classList.add("active");
  } else {
    modal.classList.add("translate-y-full");
    modal.classList.remove("translate-y-0");
    document.body.style.overflow = "";
    if (overlay) overlay.classList.remove("active");
  }
}

function limpiarFiltrosMacbooks() {
  document.querySelectorAll('.filtro-mac-modelo:checked, .filtro-mac-chip:checked, .filtro-mac-ram:checked, .filtro-mac-ssd:checked')
    .forEach(cb => cb.checked = false);
  mostrarTodosMacbooks = 4;
  renderProductos();
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
  const img = (valor || "").toString().trim();
  if (!img) return "";

  if (
    img.startsWith("http://") ||
    img.startsWith("https://") ||
    img.startsWith("data:") ||
    img.startsWith("img/")
  ) {
    return img;
  }

  return `img/${img}`;
}

function construirCard(p, isCarousel = false) {
  if (!p) return "";

  const categoria = (p.CATEGORIA || "").toLowerCase().trim();
  const esMacbook = categoria.includes("macbook");
  const esIpad = categoria.includes("ipad");
  const esWatch = categoria.includes("watch");
  const esAccesorio = categoria.includes("accesorio");

  const modelo = p.MODELO || p.PRODUCTO || "Producto Hassel";
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

  const precioAntes = p.PRECIO_ANTES || "";

  const id = `${modelo}-${gb}-${color}`
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  const imagenes = [p.IMAGEN_1, p.IMAGEN_2, p.IMAGEN_3]
    .map(resolverRutaImagen)
    .filter(Boolean);

  const imagenesFinales = imagenes.length ? imagenes : ["img/fotonodisponible.png"];

  const bateriaTag = bateria
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">${bateria}${bateria.includes('%') ? '' : '%'} batería</span>`
    : "";

  const ciclosTag = ciclos
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">${ciclos} ciclos</span>`
    : "";

  const gradeTexto =
    grade === "A+" ? "Excelente" :
    grade === "A"  ? "Muy bueno" :
    grade === "B"  ? "Bueno" :
    grade;

  const gradeTag = grade
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">Grade ${grade}${gradeTexto ? ` · ${gradeTexto}` : ''}</span>`
    : "";

  const estadoTag = (esAccesorio || esWatch) && estado
    ? `<span class="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">${estado}</span>`
    : "";

  let subTitulo = gb;
  if (esMacbook) {
    const parts = [];
    if (chip) parts.push(chip);
    if (ram) parts.push(`${ram} RAM`);
    if (gb) parts.push(`${gb} SSD`);
    if (color) parts.push(color);
    subTitulo = parts.join(" · ");
  } else if (esIpad) {
    const parts = [];
    if (chip) parts.push(chip);
    if (gb) parts.push(gb);
    if (color) parts.push(color);
    subTitulo = parts.join(" · ");
  } else if (esWatch) {
    const parts = [];
    if (gb) parts.push(gb);
    if (color) parts.push(color);
    subTitulo = parts.join(" · ");
  } else {
    if (color) subTitulo = subTitulo ? `${subTitulo} · ${color}` : color;
  }

  const precioTexto = precio ? `USD ${precio}` : "Consultar";

  const precioNumerico = Number(precio || 0);
  const precioPesos =
    precioNumerico && dolarWeb ? Math.round(precioNumerico * dolarWeb) : 0;

  let articuloEl = "el";
  if (esMacbook) articuloEl = "la";
  if (esIpad) articuloEl = "el";

  let nombreProducto = esAccesorio ? modelo : `${articuloEl} ${modelo}`;
  if (esMacbook) {
    if (chip) nombreProducto += ` ${chip}`;
    if (ram) nombreProducto += ` ${ram} RAM`;
    if (gb) nombreProducto += ` ${gb} SSD`;
  } else if (esIpad) {
    if (chip) nombreProducto += ` ${chip}`;
    if (gb) nombreProducto += ` ${gb}`;
  } else if (!esAccesorio) {
    if (gb) nombreProducto += ` ${gb}`;
  }
  if (color) nombreProducto += ` ${color}`;

  nombreProducto = nombreProducto.replace(/\s+/g, " ").trim();

  const mensaje = `Hola Hassel! Quiero consultar por ${nombreProducto} que vi en la web. ¿Lo tienen disponible?`;
  const waLink = `https://wa.me/5491136404202?text=${encodeURIComponent(mensaje)}`;

  const esNuevo = categoria.endsWith("-new");
  const esOutlet = categoria.endsWith("-outlet");
  const esPreowned = categoria.endsWith("-preowned") || (esMacbook && !esNuevo && !esOutlet) || (esIpad && !esNuevo && !esOutlet);

  const outletDetalle = esOutlet
    ? `<p class="text-sm text-black/50 dark:text-white/50 mb-4">${
        detalle || "Equipo outlet con detalle informado al momento de la compra."
      }</p>`
    : "";

  const detalleGeneral =
    detalle && !esOutlet
      ? `<p class="text-sm text-black/50 dark:text-white/50 mb-4">${detalle}</p>`
      : "";

  const estadoDetalle = (esMacbook || esWatch) && estado
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

  const carouselClasses = isCarousel ? "min-w-[85vw] sm:min-w-[320px] shrink-0 snap-center" : "";

  return `
    <article class="reveal rounded-3xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/8 p-4 ${carouselClasses}">
      <div class="mb-4 relative">
        <a href="${waLink}" target="_blank" class="block overflow-hidden rounded-2xl aspect-square relative cursor-pointer">
          <div id="slider-${id}" class="flex h-full w-full max-w-full transition-transform duration-300 ease-out">
            ${imagenesFinales
              .map(
                (img) => `
              <div class="relative basis-full min-w-full w-full h-full aspect-square shrink-0 overflow-hidden">
                <img src="${img}" alt="${modelo}" loading="lazy" class="w-full h-full aspect-square object-cover" onerror="this.onerror=null; this.src='img/fotonodisponible.png';">
              </div>
            `
              )
              .join("")}
          </div>
        </a>

        ${
          imagenesFinales.length > 1
            ? `
            <button onclick="event.preventDefault(); event.stopPropagation(); moverSlide('${id}', -1)"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center font-bold">
              ‹
            </button>

            <button onclick="event.preventDefault(); event.stopPropagation(); moverSlide('${id}', 1)"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center font-bold">
              ›
            </button>
          `
            : ""
        }
      </div>

      <div class="mb-3">
        <h3 class="text-lg font-semibold text-black dark:text-white leading-tight">${modelo}</h3>
        ${subTitulo ? `<p class="text-sm text-black/50 dark:text-white/50">${subTitulo}</p>` : ""}
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-4 text-xs text-black/60 dark:text-white/60">
        ${bateriaTag}
        ${ciclosTag}
        ${gradeTag}
        ${preownedTag}
        ${nuevoTags}
        ${outletTag}
        ${estadoTag}
      </div>

      ${outletDetalle}
      ${detalleGeneral}
      ${estadoDetalle}

      <div class="flex items-end justify-between gap-3">
        <div>
          ${precioAntes ? `<p class="text-sm text-black/40 dark:text-white/40 line-through leading-none mb-1">USD ${precioAntes}</p>` : ""}
          <p class="text-xl font-semibold text-black dark:text-white leading-none">
            ${precioTexto}
          </p>

          <p class="text-sm font-medium text-[#1F8F5F] mt-1">
            ${precioPesos
              ? formatearPesos(precioPesos)
              : (precioNumerico ? `<a href="${waLink}" target="_blank" class="underline">Consultar en pesos</a>` : "")}
          </p>
        </div>

        <a href="${waLink}" target="_blank"
          class="px-4 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-medium shrink-0">
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
  const macbooksGrid = document.querySelector("#macbooks-grid");
  const ipadsGrid = document.querySelector("#ipads .grid");
  const macbooksNewGrid = document.querySelector("#macbooks-new .grid");
  const ipadsNewGrid = document.querySelector("#ipads-new .grid");
  const watchNewGrid = document.querySelector("#watch-new .grid");
  const watchGrid = document.querySelector("#watch .grid");
  const accesoriosGrid = document.querySelector("#accesorios-grid");

  const preownedVerMas = document.getElementById("preowned-vermas");
  const newVerMas = document.getElementById("iphone-new-vermas");
  const outletVerMas = document.getElementById("outlet-vermas");
  const macbooksVerMas = document.getElementById("macbooks-vermas");
  const ipadsVerMas = document.getElementById("ipads-vermas");
  const macbooksNewVerMas = document.getElementById("macbooks-new-vermas");
  const ipadsNewVerMas = document.getElementById("ipads-new-vermas");
  const watchNewVerMas = document.getElementById("watch-new-vermas");
  const watchVerMas = document.getElementById("watch-vermas");
  const accesoriosVerMas = document.getElementById("accesorios-vermas");

  if (preownedGrid) preownedGrid.innerHTML = "";
  if (newGrid) newGrid.innerHTML = "";
  if (outletGrid) outletGrid.innerHTML = "";
  if (macbooksGrid) macbooksGrid.innerHTML = "";
  if (ipadsGrid) ipadsGrid.innerHTML = "";
  if (macbooksNewGrid) macbooksNewGrid.innerHTML = "";
  if (ipadsNewGrid) ipadsNewGrid.innerHTML = "";
  if (watchNewGrid) watchNewGrid.innerHTML = "";
  if (watchGrid) watchGrid.innerHTML = "";
  if (accesoriosGrid) accesoriosGrid.innerHTML = "";

  const { modelos } = obtenerFiltrosActivos();

  const preowned = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort(modelos.length > 0 ? (a, b) => Number(b.USD || 0) - Number(a.USD || 0) : aplicarOrden);

  const nuevos = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-new")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort(aplicarOrden);

  const outlet = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-outlet")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort(aplicarOrden);

  const macbooks = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "macbook-preowned")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => Number(b.USD || 0) - Number(a.USD || 0));

  const macbooksNew = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "macbook-new")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => Number(b.USD || 0) - Number(a.USD || 0));

  const ipads = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "ipad-preowned")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => Number(b.USD || 0) - Number(a.USD || 0));

  const ipadsNew = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "ipad-new")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => Number(b.USD || 0) - Number(a.USD || 0));

  const watchNew = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "watch-new")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => Number(b.USD || 0) - Number(a.USD || 0));

  const watchPreowned = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "watch-preowned")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => Number(b.USD || 0) - Number(a.USD || 0));

  const accesoriosBusqueda = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "accesorios")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => Number(a.USD || 0) - Number(b.USD || 0));

  const accesorios = accesoriosBusqueda.filter(coincideTipoAccesorio);

  const preownedFiltrados = filtrarPreowned(preowned);
  const macbooksFiltrados = filtrarMacbooks(macbooks);

  const preownedVisibles = limitarProductos(preownedFiltrados, mostrarTodosPreowned);
  const nuevosVisibles = limitarProductos(nuevos, mostrarTodosNew);
  const outletVisibles = limitarProductos(outlet, mostrarTodosOutlet);
  const macbooksVisibles = limitarProductos(macbooksFiltrados, mostrarTodosMacbooks);
  const macbooksNewVisibles = limitarProductos(macbooksNew, mostrarTodosMacbooksNew);
  const ipadsVisibles = limitarProductos(ipads, mostrarTodosIpads);
  const ipadsNewVisibles = limitarProductos(ipadsNew, mostrarTodosIpadsNew);
  const watchNewVisibles = limitarProductos(watchNew, mostrarTodosWatchNew);
  const watchPreownedVisibles = limitarProductos(watchPreowned, mostrarTodosWatch);
  const accesoriosVisibles = limitarProductos(accesorios, mostrarTodosAccesorios);

  const htmlEmptyState = `
    <div class="col-span-full py-12 flex flex-col items-center justify-center text-center">
      <p class="text-lg font-semibold text-black dark:text-white mb-2">Sin stock disponible por el momento.</p>
      <p class="text-sm text-black/50 dark:text-white/50 mb-6 max-w-sm">Escribinos y te asesoramos para conseguir el modelo exacto que estás buscando.</p>
      <a href="https://wa.me/5491136404202?text=Hola%20Hassel!%20Estoy%20buscando%20un%20equipo%20y%20no%20lo%20encuentro%20en%20la%20web." target="_blank" class="px-5 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium">Consultar por WhatsApp</a>
    </div>
  `;

  const htmlEmptyStateAccesorios = `
    <div class="col-span-full py-12 flex flex-col items-center justify-center text-center">
      <p class="text-lg font-semibold text-black dark:text-white mb-2">Sin stock por el momento.</p>
      <p class="text-sm text-black/50 dark:text-white/50 mb-6 max-w-sm">Contanos qué accesorio buscás y te avisamos apenas lo tengamos.</p>
      <a href="https://wa.me/5491136404202?text=Hola%20Hassel!%20Estoy%20buscando%20un%20accesorio%20y%20no%20lo%20encuentro%20en%20la%20web." target="_blank" class="px-5 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium">Consultar por WhatsApp</a>
    </div>
  `;

  if (preownedGrid) {
    if (preownedVisibles.length) {
      preownedGrid.innerHTML = preownedVisibles.map(p => construirCard(p)).join("");
    } else if (preowned.length > 0) {
      preownedGrid.innerHTML = `
        <div class="col-span-full py-12 flex flex-col items-center justify-center text-center">
          <p class="text-lg font-semibold text-black dark:text-white mb-2">No hay equipos con estos filtros.</p>
          <p class="text-sm text-black/50 dark:text-white/50 mb-6 max-w-sm">Probá ajustando los filtros o mirá todo el stock disponible.</p>
          <button onclick="limpiarFiltrosPreowned()" class="px-5 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium">Ver todos</button>
        </div>
      `;
    } else {
      preownedGrid.innerHTML = htmlEmptyState;
    }
  }

  if (newGrid) newGrid.innerHTML = nuevosVisibles.length ? nuevosVisibles.map(p => construirCard(p)).join("") : htmlEmptyState;
  if (outletGrid) outletGrid.innerHTML = outletVisibles.length ? outletVisibles.map(p => construirCard(p)).join("") : htmlEmptyState;
  
  if (macbooksGrid) {
    if (macbooksVisibles.length) {
      macbooksGrid.innerHTML = macbooksVisibles.map(p => construirCard(p)).join("");
    } else if (macbooks.length > 0) {
      macbooksGrid.innerHTML = `
        <div class="col-span-full py-12 flex flex-col items-center justify-center text-center">
          <p class="text-lg font-semibold text-black dark:text-white mb-2">No hay equipos con estos filtros.</p>
          <p class="text-sm text-black/50 dark:text-white/50 mb-6 max-w-sm">Probá ajustando los filtros o mirá todo el stock disponible.</p>
          <button onclick="limpiarFiltrosMacbooks()" class="px-5 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium">Ver todos</button>
        </div>
      `;
    } else {
      macbooksGrid.innerHTML = htmlEmptyState;
    }
  }

  if (macbooksNewGrid) macbooksNewGrid.innerHTML = macbooksNewVisibles.length ? macbooksNewVisibles.map(p => construirCard(p)).join("") : htmlEmptyState;
  if (ipadsGrid) ipadsGrid.innerHTML = ipadsVisibles.length ? ipadsVisibles.map(p => construirCard(p)).join("") : htmlEmptyState;
  if (ipadsNewGrid) ipadsNewGrid.innerHTML = ipadsNewVisibles.length ? ipadsNewVisibles.map(p => construirCard(p)).join("") : htmlEmptyState;
  if (watchNewGrid) watchNewGrid.innerHTML = watchNewVisibles.length ? watchNewVisibles.map(p => construirCard(p)).join("") : htmlEmptyState;
  if (watchGrid) watchGrid.innerHTML = watchPreownedVisibles.length ? watchPreownedVisibles.map(p => construirCard(p)).join("") : htmlEmptyState;

  if (accesoriosGrid) {
    if (accesoriosVisibles.length) {
      accesoriosGrid.innerHTML = accesoriosVisibles.map(p => construirCard(p)).join("");
    } else if (accesoriosBusqueda.length === 0 && tipoAccesorioActivo === "todos") {
      accesoriosGrid.innerHTML = htmlEmptyStateAccesorios;
    } else {
      accesoriosGrid.innerHTML = `
        <div class="col-span-full py-12 flex flex-col items-center justify-center text-center">
          <p class="text-lg font-semibold text-black dark:text-white mb-2">No hay accesorios con este filtro.</p>
          <p class="text-sm text-black/50 dark:text-white/50 mb-6 max-w-sm">Probá con otra categoría o mirá todo el stock disponible.</p>
          <button onclick="limpiarFiltrosAccesorios()" class="px-5 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium">Ver todos</button>
        </div>
      `;
    }
  }

  renderFiltrosAccesorios(accesoriosGrid);
  setTimeout(initReveals, 50);

  if (preownedVerMas) {
    preownedVerMas.innerHTML =
      preownedFiltrados.length > 4
        ? `<button onclick="toggleVerMas('preowned')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosPreowned >= preownedFiltrados.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (newVerMas) {
    newVerMas.innerHTML =
      nuevos.length > 4
        ? `<button onclick="toggleVerMas('iphone-new')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosNew >= nuevos.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (outletVerMas) {
    outletVerMas.innerHTML =
      outlet.length > 4
        ? `<button onclick="toggleVerMas('outlet')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosOutlet >= outlet.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (macbooksVerMas) {
    macbooksVerMas.innerHTML =
      macbooksFiltrados.length > 4
        ? `<button onclick="toggleVerMas('macbooks')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosMacbooks >= macbooksFiltrados.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (macbooksNewVerMas) {
    macbooksNewVerMas.innerHTML =
      macbooksNew.length > 4
        ? `<button onclick="toggleVerMas('macbooks-new')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosMacbooksNew >= macbooksNew.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (ipadsVerMas) {
    ipadsVerMas.innerHTML =
      ipads.length > 4
        ? `<button onclick="toggleVerMas('ipads')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosIpads >= ipads.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (ipadsNewVerMas) {
    ipadsNewVerMas.innerHTML =
      ipadsNew.length > 4
        ? `<button onclick="toggleVerMas('ipads-new')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosIpadsNew >= ipadsNew.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (watchNewVerMas) {
    watchNewVerMas.innerHTML =
      watchNew.length > 4
        ? `<button onclick="toggleVerMas('watch-new')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosWatchNew >= watchNew.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (watchVerMas) {
    watchVerMas.innerHTML =
      watchPreowned.length > 4
        ? `<button onclick="toggleVerMas('watch')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosWatch >= watchPreowned.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  if (accesoriosVerMas) {
    accesoriosVerMas.innerHTML =
      accesorios.length > 4
        ? `<button onclick="toggleVerMas('accesorios')" class="w-full px-5 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-medium">
            ${mostrarTodosAccesorios >= accesorios.length ? "Ver menos" : "Ver más"}
          </button>`
        : "";
  }

  const resultadosWrap = document.getElementById("resultados-busqueda");
  const gridResultados = document.getElementById("grid-resultados");

  if (terminoBusqueda.trim() !== "") {
    const resultados = productosGlobales
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
      .sort((a, b) => obtenerOrdenModelo(b.MODELO || b.PRODUCTO) - obtenerOrdenModelo(a.MODELO || a.PRODUCTO));

    if (resultadosWrap && gridResultados) {
      resultadosWrap.classList.remove("hidden");
      gridResultados.innerHTML = resultados.length
        ? resultados.map(p => construirCard(p)).join("")
        : `<p class="text-sm text-black/50 dark:text-white/50 col-span-full">No encontramos resultados.</p>`;
    }
  } else {
    if (resultadosWrap) resultadosWrap.classList.add("hidden");
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
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "macbook-preowned")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));
    const macbooksFiltrados = filtrarMacbooks(macbooks);

    if (mostrarTodosMacbooks >= macbooksFiltrados.length) {
      mostrarTodosMacbooks = 4;
    } else {
      mostrarTodosMacbooks += 4;
    }
  }

  if (categoria === "macbooks-new") {
    const macbooksNew = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "macbook-new")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosMacbooksNew >= macbooksNew.length) {
      mostrarTodosMacbooksNew = 4;
    } else {
      mostrarTodosMacbooksNew += 4;
    }
  }

  if (categoria === "ipads") {
    const ipads = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "ipad-preowned")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosIpads >= ipads.length) {
      mostrarTodosIpads = 4;
    } else {
      mostrarTodosIpads += 4;
    }
  }

  if (categoria === "ipads-new") {
    const ipadsNew = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "ipad-new")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosIpadsNew >= ipadsNew.length) {
      mostrarTodosIpadsNew = 4;
    } else {
      mostrarTodosIpadsNew += 4;
    }
  }

  if (categoria === "watch-new") {
    const watchNew = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "watch-new")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosWatchNew >= watchNew.length) {
      mostrarTodosWatchNew = 4;
    } else {
      mostrarTodosWatchNew += 4;
    }
  }

  if (categoria === "watch") {
    const watchPreowned = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "watch-preowned")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    if (mostrarTodosWatch >= watchPreowned.length) {
      mostrarTodosWatch = 4;
    } else {
      mostrarTodosWatch += 4;
    }
  }

  if (categoria === "accesorios") {
    const accesorios = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "accesorios")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
      .filter(coincideTipoAccesorio);

    if (mostrarTodosAccesorios >= accesorios.length) {
      mostrarTodosAccesorios = 4;
    } else {
      mostrarTodosAccesorios += 4;
    }
  }

  renderProductos();
}

async function cargarProductos() {
  mostrarSkeletons();

  const baseUrl = "https://opensheet.elk.sh/1wLegO19-06hNTsL-Fta_nwkGSCcF3omBYVTqpCCKUZA";
  
  const fetchSafe = async (sheetName) => {
    try {
      const res = await fetch(`${baseUrl}/${sheetName}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizarFilaSheet) : [];
    } catch (e) {
      console.warn(`No se pudieron cargar datos de la pestaña ${sheetName}:`, e);
      return [];
    }
  };

  try {
    const [dataIphones, dataMacbooks, dataIpads, dataWatch, dataAccesorios] = await Promise.all([
      fetchSafe("iphone"),
      fetchSafe("MacBook"),
      fetchSafe("iPad"),
      fetchSafe("Watch"),
      fetchSafe("Accesorios")
    ]);

    // Asignar categorías base en caso de venirse vacías
    dataIphones.forEach(item => {
      if (!item.CATEGORIA) item.CATEGORIA = "iphone-preowned";
    });

    dataMacbooks.forEach(item => {
      if (!item.CATEGORIA) item.CATEGORIA = "macbook-preowned";
    });

    dataIpads.forEach(item => {
      if (!item.CATEGORIA) item.CATEGORIA = "ipad-preowned";
    });

    dataAccesorios.forEach(item => {
      if (!item.CATEGORIA) item.CATEGORIA = "accesorios";
    });

    // Clasificar y normalizar todas las entradas cargadas
    productosGlobales = [...dataIphones, ...dataMacbooks, ...dataIpads, ...dataWatch, ...dataAccesorios].map(p => {
      const catNorm = normalizarTexto(p.CATEGORIA);
      const tipoNorm = normalizarTexto(p.TIPO);
      
      if (catNorm.includes("watch") || tipoNorm.includes("watch") || normalizarTexto(p.MODELO).includes("watch")) {
        if (catNorm === "watch-new" || tipoNorm === "watch-new" || catNorm.includes("new") || tipoNorm.includes("new") || catNorm.includes("sellado") || tipoNorm.includes("sellado")) {
          p.CATEGORIA = "watch-new";
        } else {
          p.CATEGORIA = "watch-preowned";
        }
      }
      return p;
    });

    inicializarFiltrosSidebar(
      productosGlobales.filter(
        (p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned"
      )
    );

    inicializarFiltrosSidebarMac(
      productosGlobales.filter(
        (p) => (p.CATEGORIA || "").toLowerCase().trim() === "macbook-preowned"
      )
    );

    inicializarFiltrosAccesorios();

    renderProductos();
  } catch (error) {
    console.error("Error general cargando productos:", error);
    mostrarErrorVisual();
  }
}

function mostrarErrorVisual() {
  const preownedGrid = document.querySelector("#preowned-grid");
  const newGrid = document.querySelector("#iphone-new .grid");
  const outletGrid = document.querySelector("#outlet .grid");
  const macbooksGrid = document.querySelector("#macbooks-grid");
  const ipadsGrid = document.querySelector("#ipads .grid");
  const macbooksNewGrid = document.querySelector("#macbooks-new .grid");
  const ipadsNewGrid = document.querySelector("#ipads-new .grid");
  const watchNewGrid = document.querySelector("#watch-new .grid");
  const watchGrid = document.querySelector("#watch .grid");
  const accesoriosGrid = document.querySelector("#accesorios-grid");

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
  if (ipadsGrid) ipadsGrid.innerHTML = htmlError;
  if (macbooksNewGrid) macbooksNewGrid.innerHTML = htmlError;
  if (ipadsNewGrid) ipadsNewGrid.innerHTML = htmlError;
  if (watchNewGrid) watchNewGrid.innerHTML = htmlError;
  if (watchGrid) watchGrid.innerHTML = htmlError;
  if (accesoriosGrid) accesoriosGrid.innerHTML = htmlError;
}

function mostrarSkeletons() {
  const preownedGrid = document.querySelector("#preowned-grid");
  const newGrid = document.querySelector("#iphone-new .grid");
  const outletGrid = document.querySelector("#outlet .grid");
  const macbooksGrid = document.querySelector("#macbooks-grid");
  const ipadsGrid = document.querySelector("#ipads .grid");
  const macbooksNewGrid = document.querySelector("#macbooks-new .grid");
  const ipadsNewGrid = document.querySelector("#ipads-new .grid");
  const watchNewGrid = document.querySelector("#watch-new .grid");
  const watchGrid = document.querySelector("#watch .grid");
  const accesoriosGrid = document.querySelector("#accesorios-grid");

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
  if (ipadsGrid) ipadsGrid.innerHTML = repeatSkeletons;
  if (macbooksNewGrid) macbooksNewGrid.innerHTML = repeatSkeletons;
  if (ipadsNewGrid) ipadsNewGrid.innerHTML = repeatSkeletons;
  if (watchNewGrid) watchNewGrid.innerHTML = repeatSkeletons;
  if (watchGrid) watchGrid.innerHTML = repeatSkeletons;
  if (accesoriosGrid) accesoriosGrid.innerHTML = repeatSkeletons;
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
  const modelo = document.getElementById("service-modelo")?.value.trim() || "";
  const mensaje = document.getElementById("service-mensaje")?.value.trim() || "";

  if (!nombre || !modelo || !mensaje) {
    alert("Completá al menos nombre, modelo y qué le pasa al equipo.");
    return;
  }

  const texto = `Hola Hassel, quiero consultar por servicio técnico.

Nombre: ${nombre}
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
  if (!totalSlides) return;
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
  const slider = document.getElementById("hero-slider");
  if (slider) {
    heroSliderInterval = setInterval(siguienteHeroSlide, 4500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarHeroSlider();
});

function heroNext() {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  const totalSlides = slider.children.length;
  if (!totalSlides) return;
  heroSlideActual = (heroSlideActual + 1) % totalSlides;
  actualizarHeroSlider(heroSlideActual);
  reiniciarHeroSlider();
}

function heroPrev() {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  const totalSlides = slider.children.length;
  if (!totalSlides) return;
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

document.addEventListener("DOMContentLoaded", () => {
  const whatsappBtn = document.querySelector(".whatsapp-fab") || document.querySelector(".whatsapp-float");
  const hero = document.querySelector("section");

  if (!whatsappBtn || !hero) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > hero.offsetHeight) {
      whatsappBtn.classList.add("show");
    } else {
      whatsappBtn.classList.remove("show");
    }
  });
});

function limpiarFiltrosPreowned() {
  document.querySelectorAll('.filtro-modelo:checked, .filtro-bateria:checked, .filtro-precio:checked, .filtro-almacenamiento:checked')
    .forEach(cb => cb.checked = false);
  mostrarTodosPreowned = 4;
  renderProductos();
}

// ==========================
// FILTROS DE ACCESORIOS
// ==========================

function escaparHTML(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function coincideTipoAccesorio(p) {
  if (tipoAccesorioActivo === "todos") return true;
  return normalizarTexto(p.TIPO) === tipoAccesorioActivo;
}

function inicializarFiltrosAccesorios() {
  const vistos = new Map();

  productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "accesorios")
    .forEach((p) => {
      const etiqueta = (p.TIPO || "").toString().trim();
      const clave = normalizarTexto(etiqueta);
      if (clave && !vistos.has(clave)) vistos.set(clave, etiqueta);
    });

  tiposAccesorios = Array.from(vistos, ([clave, etiqueta]) => ({ clave, etiqueta }));

  if (tipoAccesorioActivo !== "todos" && !vistos.has(tipoAccesorioActivo)) {
    tipoAccesorioActivo = "todos";
  }
}

function renderFiltrosAccesorios(accesoriosGrid) {
  let contenedor = document.getElementById("accesorios-filtros");

  if (!contenedor && accesoriosGrid && accesoriosGrid.parentNode) {
    contenedor = document.createElement("div");
    contenedor.id = "accesorios-filtros";
    accesoriosGrid.parentNode.insertBefore(contenedor, accesoriosGrid);
  }
  if (!contenedor) return;

  if (!tiposAccesorios.length) {
    contenedor.innerHTML = "";
    return;
  }

  const claseBase = "px-4 py-2 rounded-full border text-sm font-medium transition whitespace-nowrap";
  const claseActivo = "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white";
  const claseInactivo = "bg-white text-black border-black/10 hover:border-black/30 dark:bg-zinc-900 dark:text-white dark:border-white/10 dark:hover:border-white/30";

  const botones = [
    `<button type="button" onclick="filtrarAccesoriosPorTipo('todos')" class="${claseBase} ${tipoAccesorioActivo === "todos" ? claseActivo : claseInactivo}">Todos</button>`,
    ...tiposAccesorios.map((t, i) =>
      `<button type="button" onclick="filtrarAccesoriosPorTipo(${i})" class="${claseBase} ${tipoAccesorioActivo === t.clave ? claseActivo : claseInactivo}">${escaparHTML(t.etiqueta)}</button>`
    )
  ];

  contenedor.className = "flex flex-wrap gap-2 mb-6";
  contenedor.innerHTML = botones.join("");
}

function filtrarAccesoriosPorTipo(indice) {
  tipoAccesorioActivo = indice === "todos" ? "todos" : (tiposAccesorios[indice]?.clave || "todos");
  mostrarTodosAccesorios = 4;
  renderProductos();
}

function filtrarAccesorios(indice) {
  filtrarAccesoriosPorTipo(indice);
}

function limpiarFiltrosAccesorios() {
  tipoAccesorioActivo = "todos";
  mostrarTodosAccesorios = 4;
  renderProductos();
}
