let productosGlobales = [];
let familiaPreownedActiva = "todos";

let mostrarTodosPreowned = 4;
let mostrarTodosNew = 4;
let mostrarTodosOutlet = 4;

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
  const wrap = document.getElementById("preowned-filtros-wrap");

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
    ${familias
      .map(
        (familia) => `
      <button data-familia="${familia}" class="filtro-btn px-4 py-2 rounded-full border border-black/10 bg-white text-black text-sm whitespace-nowrap">
        ${familia}
      </button>
    `
      )
      .join("")}
  `;

  contenedor.querySelectorAll(".filtro-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      familiaPreownedActiva = btn.dataset.familia;
      mostrarTodosPreowned = 4;

      contenedor.querySelectorAll(".filtro-btn").forEach((b) => {
        b.classList.remove("bg-black", "text-white");
        b.classList.add("bg-white", "text-black");
      });

      btn.classList.remove("bg-white", "text-black");
      btn.classList.add("bg-black", "text-white");

      renderProductos();
    });
  });

  if (wrap) {
    wrap.removeEventListener("scroll", actualizarIndicadorFiltrosPreowned);
    wrap.addEventListener("scroll", actualizarIndicadorFiltrosPreowned, { passive: true });
  }

  setTimeout(actualizarIndicadorFiltrosPreowned, 50);
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

  const modelo = p.MODELO || "";
  const gb = p.GB || "";
  const color = p.COLOR || "";
  const bateria = p.BATERIA || "";
  const precio = p.USD || "";
  const grade = p.GRADE || "";
  const detalle = p.DETALLE || "";

  const id = `${modelo}-${gb}-${color}`
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  const imagenes = [p.IMAGEN_1, p.IMAGEN_2, p.IMAGEN_3]
    .filter(Boolean)
    .map(resolverRutaImagen);

  const imagenesFinales = imagenes.length ? imagenes : ["img/iphone.jpg"];

  const bateriaTag = bateria
    ? `<span class="px-3 py-1 rounded-full bg-black/5">${bateria} batería</span>`
    : "";

  const gradeTag = grade
    ? `<span class="px-3 py-1 rounded-full bg-black/5">Grade ${grade}</span>`
    : "";

  const colorTexto = color ? ` · ${color}` : "";
  const precioTexto = precio ? `USD ${precio}` : "Consultar";

  const precioNumerico = Number(precio || 0);
  const precioPesos =
    precioNumerico && dolarWeb ? Math.round(precioNumerico * dolarWeb) : 0;

  const mensaje = `Hola Hassel! Quiero consultar por el ${modelo} ${gb}${
    color ? ` ${color}` : ""
  } que vi en la web. ¿Lo tienen disponible?`;

  const waLink = `https://wa.me/5491136404202?text=${encodeURIComponent(mensaje)}`;

  const esNuevo = categoria === "iphone-new";
  const esOutlet = categoria === "iphone-outlet";
  const esPreowned = categoria === "iphone-preowned";

  const outletDetalle = esOutlet
    ? `<p class="text-sm text-black/50 mb-4">${
        detalle || "Equipo outlet con detalle informado al momento de la compra."
      }</p>`
    : "";

  const nuevoTags = esNuevo
    ? `
      <span class="px-3 py-1 rounded-full bg-black/5">Nuevo</span>
      <span class="px-3 py-1 rounded-full bg-black/5">Sellado</span>
    `
    : "";

  const preownedTag = esPreowned
    ? `<span class="px-3 py-1 rounded-full bg-black/5">PreOwned</span>`
    : "";

  const outletTag = esOutlet
    ? `<span class="px-3 py-1 rounded-full bg-black/5">Outlet</span>`
    : "";

  return `
    <article class="rounded-3xl bg-white border border-black/8 p-4">
      <div class="mb-4 relative">
        <div class="overflow-hidden rounded-2xl aspect-square">
          <div id="slider-${id}" class="flex h-full w-full max-w-full transition-transform duration-300 ease-out">
            ${imagenesFinales
              .map(
                (img) => `
              <div class="relative basis-full min-w-full w-full h-full aspect-square shrink-0 overflow-hidden">
                <img src="${img}" alt="${modelo}" class="w-full h-full aspect-square object-cover">
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
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-black/10 text-black">
              ‹
            </button>

            <button onclick="moverSlide('${id}', 1)"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-black/10 text-black">
              ›
            </button>
          `
            : ""
        }
      </div>

      <div class="mb-3">
        <h3 class="text-lg font-semibold text-black leading-tight">${modelo}</h3>
        <p class="text-sm text-black/50">${gb}${colorTexto}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-4 text-xs text-black/60">
        ${bateriaTag}
        ${gradeTag}
        ${preownedTag}
        ${nuevoTags}
        ${outletTag}
      </div>

      ${outletDetalle}

      <div class="flex items-end justify-between gap-3">
        <div>
          <p class="text-xl font-semibold text-black leading-none">
            ${precioTexto}
          </p>

          <p class="text-sm font-medium text-[#1F8F5F] mt-1">
            ${precioPesos ? `$${precioPesos.toLocaleString("es-AR")}` : ""}
          </p>
        </div>

        <a href="${waLink}" target="_blank"
          class="px-4 py-2.5 rounded-full bg-black text-white text-xs font-medium">
          Consultar
        </a>
      </div>
    </article>
  `;
}

function renderProductos() {
  const preownedGrid = document.querySelector("#preowned .grid");
  const newGrid = document.querySelector("#iphone-new .grid");
  const outletGrid = document.querySelector("#outlet .grid");

  const preownedVerMas = document.getElementById("preowned-vermas");
  const newVerMas = document.getElementById("iphone-new-vermas");
  const outletVerMas = document.getElementById("outlet-vermas");

  if (!preownedGrid || !newGrid || !outletGrid) return;

  preownedGrid.innerHTML = "";
  newGrid.innerHTML = "";
  outletGrid.innerHTML = "";

  const preowned = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => obtenerOrdenModelo(b.MODELO) - obtenerOrdenModelo(a.MODELO));

  const nuevos = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-new")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => obtenerOrdenModelo(b.MODELO) - obtenerOrdenModelo(a.MODELO));

  const outlet = productosGlobales
    .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-outlet")
    .filter((p) => productoCoincideBusqueda(p, terminoBusqueda))
    .sort((a, b) => obtenerOrdenModelo(b.MODELO) - obtenerOrdenModelo(a.MODELO));

  const preownedFiltrados =
    familiaPreownedActiva === "todos"
      ? preowned
      : preowned.filter((p) => obtenerFamilia(p.MODELO || "") === familiaPreownedActiva);

  const preownedVisibles = limitarProductos(preownedFiltrados, mostrarTodosPreowned);
  const nuevosVisibles = limitarProductos(nuevos, mostrarTodosNew);
  const outletVisibles = limitarProductos(outlet, mostrarTodosOutlet);

  preownedGrid.innerHTML = preownedVisibles.map(construirCard).join("");
  newGrid.innerHTML = nuevosVisibles.map(construirCard).join("");
  outletGrid.innerHTML = outletVisibles.map(construirCard).join("");

  if (preownedVerMas) {
    preownedVerMas.innerHTML =
      preownedFiltrados.length > 4
        ? `
        <button onclick="toggleVerMas('preowned')" class="w-full px-5 py-3 rounded-full border border-black/10 bg-white text-black text-sm font-medium">
          ${mostrarTodosPreowned >= preownedFiltrados.length ? "Ver menos" : "Ver más"}
        </button>
      `
        : "";
  }

  if (newVerMas) {
    newVerMas.innerHTML =
      nuevos.length > 4
        ? `
        <button onclick="toggleVerMas('iphone-new')" class="w-full px-5 py-3 rounded-full border border-black/10 bg-white text-black text-sm font-medium">
          ${mostrarTodosNew >= nuevos.length ? "Ver menos" : "Ver más"}
        </button>
      `
        : "";
  }

  if (outletVerMas) {
    outletVerMas.innerHTML =
      outlet.length > 4
        ? `
        <button onclick="toggleVerMas('outlet')" class="w-full px-5 py-3 rounded-full border border-black/10 bg-white text-black text-sm font-medium">
          ${mostrarTodosOutlet >= outlet.length ? "Ver menos" : "Ver más"}
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
        : `<p class="text-sm text-black/50 col-span-full">No encontramos resultados.</p>`;
    }
  } else {
    resultadosWrap?.classList.add("hidden");
  }

  setTimeout(actualizarIndicadorFiltrosPreowned, 50);
}

function toggleVerMas(categoria) {
  if (categoria === "preowned") {
    const preowned = productosGlobales
      .filter((p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned")
      .filter((p) => productoCoincideBusqueda(p, terminoBusqueda));

    const preownedFiltrados =
      familiaPreownedActiva === "todos"
        ? preowned
        : preowned.filter((p) => obtenerFamilia(p.MODELO || "") === familiaPreownedActiva);

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

  renderProductos();
}

async function cargarProductos() {
  const urlIphones =
    "https://opensheet.elk.sh/1wLegO19-06hNTsL-Fta_nwkGSCcF3omBYVTqpCCKUZA/iphone";

  try {
    const res = await fetch(urlIphones);
    const data = await res.json();

    productosGlobales = Array.isArray(data) ? data : [];

    crearBotonesFiltroPreowned(
      productosGlobales.filter(
        (p) => (p.CATEGORIA || "").toLowerCase().trim() === "iphone-preowned"
      )
    );

    renderProductos();
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
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
      familiaPreownedActiva = "todos";
      mostrarTodosPreowned = 4;
      renderProductos();
    });
  }

  window.addEventListener("resize", actualizarIndicadorFiltrosPreowned);

  await cargarDolar();
  await cargarProductos();

  setTimeout(actualizarIndicadorFiltrosPreowned, 100);
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
    dot.classList.toggle("bg-black/20", i !== heroSlideActual);
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
