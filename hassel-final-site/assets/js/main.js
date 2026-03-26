
const WA_NUMBER = "5491136404202";
const DOLLAR_API_URL = "https://dolarapi.com/v1/dolares/blue";

function qs(sel, root = document){ return root.querySelector(sel); }
function qsa(sel, root = document){ return [...root.querySelectorAll(sel)]; }

function buildWhatsAppLink(message){
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatARS(value){
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Consultar";
  return new Intl.NumberFormat("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 }).format(Number(value));
}

function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  const icon = qs("#themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "☀" : "☾";
  localStorage.setItem("hassel-theme", theme);
}

function setupTheme(){
  const saved = localStorage.getItem("hassel-theme") || "dark";
  applyTheme(saved);
  qs("#themeBtn")?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

function setupHeader(){
  const item = qs(".nav-item");
  const trigger = qs(".menu-trigger");
  const mobileToggle = qs(".mobile-toggle");
  const mobilePanel = qs(".mobile-panel");

  trigger?.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = item.classList.toggle("open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (item && !item.contains(e.target)) {
      item.classList.remove("open");
      trigger?.setAttribute("aria-expanded", "false");
    }
  });

  mobileToggle?.addEventListener("click", () => {
    const isOpen = mobilePanel.classList.toggle("open");
    mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

async function fetchBlueRate(){
  try{
    const res = await fetch(DOLLAR_API_URL, { headers: { "Accept":"application/json" }});
    if(!res.ok) throw new Error("No se pudo obtener dólar blue");
    const data = await res.json();
    const value = Number(data?.venta);
    if(!value) throw new Error("Cotización inválida");
    window.HASSEL_BLUE = {
      venta: value,
      fechaActualizacion: data.fechaActualizacion || "",
      source: "DolarApi"
    };
  }catch(err){
    window.HASSEL_BLUE = { venta: null, fechaActualizacion: "", source:"DolarApi" };
  }
}

function productCard(item){
  const colors = Array.isArray(item.color) ? item.color.join(" · ") : item.color || "";
  const line2 = [item.storage, colors].filter(Boolean).join(" · ");
  const line3 = [
    item.battery && item.battery !== "New" ? `Bat ${item.battery}` : "",
    item.grade && item.grade !== "New" ? `Grade ${item.grade}` : item.grade === "New" ? "Nuevo" : ""
  ].filter(Boolean).join(" · ");
  const usdText = item.priceLabel || "Consultar";
  const arsText = item.price && window.HASSEL_BLUE?.venta ? formatARS(item.price * window.HASSEL_BLUE.venta) : "ARS no disponible";
  const message = `Hola! Me interesa el ${item.name}${item.storage ? ` ${item.storage}` : ""} que vi en la web.`;

  return `
    <article class="product-card">
      <h3>${item.name}</h3>
      ${line2 ? `<div class="product-meta">${line2}</div>` : ""}
      ${line3 ? `<div class="product-sub">${line3}</div>` : ""}
      <div class="price-usd">${usdText}</div>
      <div class="price-ars">${arsText}</div>
      <div class="product-actions">
        <a class="link-btn primary" href="${buildWhatsAppLink(message)}" target="_blank" rel="noopener">Consultar</a>
      </div>
    </article>
  `;
}

function getProducts(category){
  return (window.PRODUCTS || [])
    .filter(item => item.category === category)
    .sort((a,b) => (a.price ?? 999999) - (b.price ?? 999999));
}

function uniqueValues(items, key){
  return [...new Set(items.map(i => i[key]).filter(Boolean))];
}

function fillSelect(select, values, placeholder){
  if(!select) return;
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${v}">${v}</option>`).join("");
}

function renderFeatured(){
  const root = qs("#featuredGrid");
  if(!root || !window.PRODUCTS) return;
  const featured = [
    ...getProducts("iphone-preowned").slice(0,2),
    ...getProducts("iphone-new").slice(0,2),
    ...getProducts("iphone-outlet").slice(0,2)
  ].slice(0,6);

  root.innerHTML = featured.map(item => {
    const kicker = item.category === "iphone-new" ? "iPhone New" : item.category === "iphone-outlet" ? "iPhone Outlet" : "iPhone PreOwned";
    const arsText = item.price && window.HASSEL_BLUE?.venta ? formatARS(item.price * window.HASSEL_BLUE.venta) : "ARS no disponible";
    const href = item.category === "iphone-new" ? "iphone-new.html" : item.category === "iphone-outlet" ? "iphone-outlet.html" : "iphone-preowned.html";
    return `
      <article class="featured-card">
        <span class="featured-kicker">${kicker}</span>
        <h3>${item.name}</h3>
        <p>${[item.storage, Array.isArray(item.color) ? item.color.join(" · ") : item.color].filter(Boolean).join(" · ")}</p>
        <div class="price-usd">${item.priceLabel || "Consultar"}</div>
        <div class="price-ars">${arsText}</div>
        <div class="product-actions" style="margin-top:14px">
          <a class="link-btn secondary" href="${href}">Ver categoría</a>
        </div>
      </article>
    `;
  }).join("");

  const quote = qs("#quoteBadge");
  if(quote){
    quote.textContent = window.HASSEL_BLUE?.venta
      ? `Dólar blue venta: ${formatARS(window.HASSEL_BLUE.venta)}`
      : "Dólar blue no disponible";
  }
}

function initCategoryPage(){
  const grid = qs("#productGrid");
  if(!grid) return;
  const category = document.body.dataset.category;
  const all = getProducts(category);
  const model = qs("#filterModel");
  const storage = qs("#filterStorage");
  const search = qs("#searchInput");
  const summary = qs("#resultsSummary");
  const quote = qs("#pageQuote");
  const loadMore = qs("#loadMoreBtn");
  const step = 9;
  let visible = step;
  let filtered = [...all];

  fillSelect(model, uniqueValues(all, "name"), "Modelo");
  fillSelect(storage, uniqueValues(all, "storage"), "Capacidad");
  if(quote){
    quote.textContent = window.HASSEL_BLUE?.venta
      ? `Dólar blue venta: ${formatARS(window.HASSEL_BLUE.venta)}`
      : "Dólar blue no disponible";
  }

  function applyFilters(){
    const term = (search?.value || "").trim().toLowerCase();
    const modelValue = model?.value || "";
    const storageValue = storage?.value || "";

    filtered = all.filter(item => {
      const modelOk = !modelValue || item.name === modelValue;
      const storageOk = !storageValue || item.storage === storageValue;
      const searchOk = !term || `${item.name} ${item.storage} ${(Array.isArray(item.color) ? item.color.join(" ") : item.color || "")}`.toLowerCase().includes(term);
      return modelOk && storageOk && searchOk;
    });

    visible = step;
    render();
  }

  function render(){
    if(summary){
      summary.textContent = `${filtered.length} equipo${filtered.length === 1 ? "" : "s"} visible${filtered.length === 1 ? "" : "s"}`;
    }
    if(!filtered.length){
      grid.innerHTML = `<div class="empty"><h3>No hay equipos para ese filtro</h3><p>Probá con otra combinación o escribinos por WhatsApp.</p></div>`;
      if(loadMore) loadMore.style.display = "none";
      return;
    }
    const items = filtered.slice(0, visible);
    grid.innerHTML = items.map(productCard).join("");
    if(loadMore){
      loadMore.style.display = visible >= filtered.length ? "none" : "inline-flex";
    }
  }

  model?.addEventListener("change", applyFilters);
  storage?.addEventListener("change", applyFilters);
  search?.addEventListener("input", applyFilters);
  loadMore?.addEventListener("click", () => {
    visible += step;
    render();
  });

  render();
}

async function boot(){
  setupTheme();
  setupHeader();
  await fetchBlueRate();
  renderFeatured();
  initCategoryPage();
}
document.addEventListener("DOMContentLoaded", boot);
