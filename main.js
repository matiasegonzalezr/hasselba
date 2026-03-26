
const WA_NUMBER = "5491136404202";

function buildWhatsAppLink(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function setupHeader() {
  const shopItem = document.querySelector(".shop-item");
  const trigger = document.querySelector(".shop-trigger");
  const mobileToggle = document.querySelector(".mobile-toggle");
  const mobilePanel = document.querySelector(".mobile-panel");

  if (trigger && shopItem) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const open = shopItem.classList.toggle("open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!shopItem.contains(e.target)) {
        shopItem.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener("click", () => {
      mobilePanel.classList.toggle("open");
      mobileToggle.setAttribute("aria-expanded", mobilePanel.classList.contains("open") ? "true" : "false");
    });
  }
}

function getCategoryProducts(category) {
  if (!window.PRODUCTS) return [];
  return window.PRODUCTS
    .filter((item) => item.category === category)
    .sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
}

function getUniqueValues(items, key) {
  const values = new Set();
  items.forEach((item) => {
    const value = item[key];
    if (Array.isArray(value)) {
      value.forEach((v) => v && values.add(v));
    } else if (value) {
      values.add(value);
    }
  });
  return [...values];
}

function buildSelectOptions(select, values, placeholder) {
  if (!select) return;
  const options = values.map((value) => `<option value="${value}">${value}</option>`).join("");
  select.innerHTML = `<option value="">${placeholder}</option>${options}`;
}

function productCard(item) {
  const colorText = Array.isArray(item.color) ? item.color.join(" · ") : item.color || "";
  const line2 = [item.storage, colorText].filter(Boolean).join(" · ");
  const line3 = [item.battery && item.battery !== "New" ? `Bat ${item.battery}` : "", item.grade && item.grade !== "New" ? `Grade ${item.grade}` : item.grade === "New" ? "Nuevo" : ""]
    .filter(Boolean)
    .join(" · ");
  const message = `Hola! Me interesa el ${item.name}${item.storage ? ` ${item.storage}` : ""} que vi en la web.`;

  return `
    <article class="product-card">
      <h3>${item.name}</h3>
      ${line2 ? `<div class="product-meta">${line2}</div>` : ""}
      ${line3 ? `<div class="product-sub">${line3}</div>` : ""}
      <div class="price">${item.priceLabel || "Consultar"}</div>
      <div class="product-actions">
        <a class="link-btn primary" href="${buildWhatsAppLink(message)}" target="_blank" rel="noopener">Consultar</a>
      </div>
    </article>
  `;
}

function initCategoryPage() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const category = document.body.dataset.category;
  const allItems = getCategoryProducts(category);
  const modelSelect = document.getElementById("filterModel");
  const storageSelect = document.getElementById("filterStorage");
  const countLabel = document.getElementById("resultsCount");
  const visibleStep = 9;
  let visibleCount = visibleStep;
  let filteredItems = [...allItems];

  buildSelectOptions(modelSelect, getUniqueValues(allItems, "name"), "Modelo");
  buildSelectOptions(storageSelect, getUniqueValues(allItems, "storage"), "Capacidad");

  function applyFilters() {
    const model = modelSelect?.value || "";
    const storage = storageSelect?.value || "";

    filteredItems = allItems.filter((item) => {
      const modelOk = !model || item.name === model;
      const storageOk = !storage || item.storage === storage;
      return modelOk && storageOk;
    });

    visibleCount = visibleStep;
    render();
  }

  function render() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    if (countLabel) {
      countLabel.textContent = `${filteredItems.length} equipo${filteredItems.length === 1 ? "" : "s"} visible${filteredItems.length === 1 ? "" : "s"}`;
    }

    if (!filteredItems.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No hay equipos para ese filtro</h3>
          <p>Probá con otra combinación o escribinos por WhatsApp.</p>
        </div>
      `;
      if (loadMoreBtn) loadMoreBtn.style.display = "none";
      return;
    }

    const visibleItems = filteredItems.slice(0, visibleCount);
    grid.innerHTML = visibleItems.map(productCard).join("");

    if (loadMoreBtn) {
      loadMoreBtn.style.display = visibleCount >= filteredItems.length ? "none" : "inline-flex";
    }
  }

  modelSelect?.addEventListener("change", applyFilters);
  storageSelect?.addEventListener("change", applyFilters);
  document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
    visibleCount += visibleStep;
    render();
  });

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  setupHeader();
  initCategoryPage();
});
