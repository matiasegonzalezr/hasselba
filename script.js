let productosGlobales = [];
let familiaPreownedActiva = "todos";

let mostrarTodosPreowned = false;
let mostrarTodosNew = false;
let mostrarTodosOutlet = false;

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

function productoCoincideBusqueda(p, termino) {
  if (!termino) return true;

  const base = [
    p.MODELO,
    p.GB,
    p.COLOR,
    p.BATERIA,
    p.GRADE,
    p.CATEGORIA,
    p.DETALLE
  ]
    .filter(Boolean)
    .join(" ");

  return normalizarTexto(base).includes(normalizarTexto(termino));
}

function limitarProductos(lista, mostrarTodos) {
  return mostrarTodos ? lista : lista.slice(0, 4);
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

function actualizarIndicadorFiltrosPreowned() {
  const wrap = document.getElementById("preowned-filtros-wrap");
  const fade = document.getElementById("preowned-fade");

  if (!wrap || !fade) return;

  const hayOverflow = wrap.scrollWidth > wrap.clientWidth + 4;
  const estaAlFinal = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 6;

  if (hayOverflow && !estaAlFinal) {
    fade.classList.remove("hidden");
  } else {
    fade.classList.add("hidden");
  }
}

function scrollFiltrosPreowned() {
  const wrap = document.getElementById("preowned-filtros-wrap");
  if (!wrap) return;

  wrap.scrollBy({
    left: 120,
    behavior: "smooth"
  });
}

function crearBotonesFiltroPreowned(productos) {
  const contenedor = document.getElementById("preowned-filtros");

  if (!contenedor) return;

  let familias = [...new Set(productos.map((p) => obtenerFamilia(p.MODELO || "")))];
  familias = familias.filter((familia) => familia && familia !== "Otros");

  familias.sort((a, b) => {
    const numA = parseInt((a.match(/\d+/) || ["0"])[0], 10);
    const numB = parseInt((b.match(/\d+/) || ["0"])[0], 10);
    return numB - numA;
  });

  contenedor.innerHTML = `
    <button data-familia="todos" class="filtro-btn px-4 py-2 rounded-full border border-black/10 bg-black text-white text-sm whitespace-nowrap">
      Todos
    </button>
    ${familias.map(f => `
      <button data-familia="${f}" class="filtro-btn px-4 py-2 rounded-full border border-black/10 bg-white text-black text-sm whitespace-nowrap">
        ${f}
      </button>
    `).join("")}
  `;

  contenedor.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      familiaPreownedActiva = btn.dataset.familia;
      mostrarTodosPreowned = false;
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

  if (img.startsWith("http") || img.startsWith("img/")) return img;

  return `img/${img}`;
}

function construirCard(p) {
  const modelo = p.MODELO || "";
  const gb = p.GB || "";
  const color = p.COLOR || "";

  const id = `${modelo}-${gb}-${color}`.replace(/\s+/g, "-");

  const imagenes = [p.IMAGEN_1, p.IMAGEN_2, p.IMAGEN_3]
    .filter(Boolean)
    .map(resolverRutaImagen);

  const imagenesFinales = imagenes.length ? imagenes : ["img/iphone.jpg"];

  return `
    <article class="rounded-3xl bg-white border border-black/8 p-4">

      <div class="mb-4 relative">
        <div class="overflow-hidden rounded-2xl aspect-square">
          <div id="slider-${id}" class="flex h-full transition-transform duration-300 ease-out">
            
            ${imagenesFinales.map(img => `
              <div class="relative w-full h-full flex-shrink-0">
                <img src="${img}" class="w-full h-full object-cover">

                <img 
                  src="img/ISOTIPO - B.png" 
                  class="absolute bottom-2 right-2 w-5 opacity-70 pointer-events-none"
                />
              </div>
            `).join("")}

          </div>
        </div>
      </div>

    </article>
  `;
}
