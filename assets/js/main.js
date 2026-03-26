
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

[
  {
    "category": "iphone-preowned",
    "name": "iPhone 8",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 100,
    "priceLabel": "USD 100"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2020",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "99%",
    "grade": "A+",
    "price": 200,
    "priceLabel": "USD 200"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2020",
    "storage": "128GB",
    "color": [
      "Red"
    ],
    "battery": "82%",
    "grade": "A+",
    "price": 220,
    "priceLabel": "USD 220"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone SE 2020",
    "storage": "256GB",
    "color": [
      "Black"
    ],
    "battery": "86%",
    "grade": "A+",
    "price": 240,
    "priceLabel": "USD 240"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2022",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "89%",
    "grade": "A-",
    "price": 240,
    "priceLabel": "USD 240"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2022",
    "storage": "128GB",
    "color": [
      "White"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 240,
    "priceLabel": "USD 240"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11",
    "storage": "64GB",
    "color": [
      "White"
    ],
    "battery": "82%",
    "grade": "A",
    "price": 260,
    "priceLabel": "USD 260"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11",
    "storage": "64GB",
    "color": [
      "White"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 260,
    "priceLabel": "USD 260"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 11",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "100%",
    "grade": "A-",
    "price": 260,
    "priceLabel": "USD 260"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11 Pro",
    "storage": "256GB",
    "color": [
      "Green Midnight"
    ],
    "battery": "89%",
    "grade": "A-",
    "price": 300,
    "priceLabel": "USD 300"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11 Pro Max",
    "storage": "64GB",
    "color": [
      "Space Gray"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 500,
    "priceLabel": "USD 500"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "84%",
    "grade": "A",
    "price": 310,
    "priceLabel": "USD 310"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 12",
    "storage": "64GB",
    "color": [
      "Red"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 330,
    "priceLabel": "USD 330"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 12",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "86%",
    "grade": "A",
    "price": 330,
    "priceLabel": "USD 330"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12 Pro",
    "storage": "128GB",
    "color": [
      "Graphite"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 330,
    "priceLabel": "USD 330"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12 Pro",
    "storage": "128GB",
    "color": [
      "Pacific Blue"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 350,
    "priceLabel": "USD 350"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12 Pro",
    "storage": "128GB",
    "color": [
      "Gold"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 350,
    "priceLabel": "USD 350"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 13 Mini",
    "storage": "128GB",
    "color": [
      "Blue"
    ],
    "battery": "100%",
    "grade": "B+",
    "price": 310,
    "priceLabel": "USD 310"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "100%",
    "grade": "B",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13 (Mjs display)",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "128GB",
    "color": [
      "Pink"
    ],
    "battery": "88%",
    "grade": "A+",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "128GB",
    "color": [
      "Pink"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Blue"
    ],
    "battery": "100%",
    "grade": "A-",
    "price": 440,
    "priceLabel": "USD 440"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Midnight"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 420,
    "priceLabel": "USD 420"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Pink"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 420,
    "priceLabel": "USD 420"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Red"
    ],
    "battery": "87%",
    "grade": "A+",
    "price": 420,
    "priceLabel": "USD 420"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "87%",
    "grade": "A-",
    "price": 450,
    "priceLabel": "USD 450"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro",
    "storage": "256GB",
    "color": [
      "Deep Purple"
    ],
    "battery": "86%",
    "grade": "A-",
    "price": 580,
    "priceLabel": "USD 580"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro Max (Mjs display- MODULO OG)",
    "storage": "128GB",
    "color": [
      "Deep purple"
    ],
    "battery": "85%",
    "grade": "A",
    "price": 620,
    "priceLabel": "USD 620"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro Max",
    "storage": "128GB",
    "color": [
      "Space Black"
    ],
    "battery": "85%",
    "grade": "A",
    "price": 620,
    "priceLabel": "USD 620"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "color": [
      "Space Black"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 660,
    "priceLabel": "USD 660"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15",
    "storage": "128GB",
    "color": [
      "Black"
    ],
    "battery": "87%",
    "grade": "A-",
    "price": 570,
    "priceLabel": "USD 570"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 15 Pro",
    "storage": "128GB",
    "color": [
      "Blue Titanium"
    ],
    "battery": "89%",
    "grade": "A",
    "price": 620,
    "priceLabel": "USD 620"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro (C/ SIM)",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "89%",
    "grade": "A+",
    "price": 670,
    "priceLabel": "USD 670"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "87%",
    "grade": "A+",
    "price": 670,
    "priceLabel": "USD 670"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro Max",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "83%",
    "grade": "A-",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro Max",
    "storage": "256GB",
    "color": [
      "Natural Titanium"
    ],
    "battery": "86%",
    "grade": "A+",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 15 Pro Max",
    "storage": "512GB",
    "color": [
      "Natural Titanium"
    ],
    "battery": "94%",
    "grade": "",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 16 Pro",
    "storage": "128GB",
    "color": [
      "Natural Titanium"
    ],
    "battery": "91%",
    "grade": "A+",
    "price": 800,
    "priceLabel": "USD 800"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 16 Pro Max",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "92%",
    "grade": "A+",
    "price": 970,
    "priceLabel": "USD 970"
  },
  {
    "category": "macbook-preowned",
    "name": "Macbook Pro A2141 2019 16' I9 (C/ Touchbar)",
    "storage": "1TB / 16GB",
    "color": [
      "Silver"
    ],
    "battery": "3 Ciclos",
    "grade": "A+",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "macbook-preowned",
    "name": "MacBook Air M1 13' (le falta una tecla)",
    "storage": "8GB / 256GB",
    "color": [
      "Space Gray"
    ],
    "battery": "BATERIA OK",
    "grade": "",
    "price": 650,
    "priceLabel": "USD 650"
  },
  {
    "category": "macbook-preowned",
    "name": "MacBook Pro M1 2020 13' (c/ touchbar) esq de pantalla astillada - trackpad astillado",
    "storage": "8G / 256GB",
    "color": [
      "Space Gray"
    ],
    "battery": "91% (278 Ciclos)",
    "grade": "A-",
    "price": 600,
    "priceLabel": "USD 600"
  },
  {
    "category": "watch-preowned",
    "name": "Watch Ultra 2 49mm + GPS + CELLULAR C/malla (Garantia hasta 6/03/26) Con cargador",
    "storage": "64GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "99%",
    "grade": "A",
    "price": 600,
    "priceLabel": "USD 600"
  },
  {
    "category": "watch-preowned",
    "name": "Watch Series 7 45mm (GPS) Con cargador",
    "storage": "32GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "84%",
    "grade": "A-",
    "price": 190,
    "priceLabel": "USD 190"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 15",
    "storage": "128GB",
    "color": [],
    "battery": "New",
    "grade": "New",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 16E",
    "storage": "128GB",
    "color": [],
    "battery": "New",
    "grade": "New",
    "price": null,
    "priceLabel": "Consultar"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 16",
    "storage": "128GB",
    "color": [],
    "battery": "New",
    "grade": "New",
    "price": 850,
    "priceLabel": "USD 850"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Air",
    "storage": "256GB",
    "color": [
      "Gold",
      "Blue",
      "White",
      "Black"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1080,
    "priceLabel": "USD 1.080"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17",
    "storage": "256GB",
    "color": [
      "Black",
      "Sage",
      "Lavender",
      "Blue"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1000,
    "priceLabel": "USD 1.000"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Pro",
    "storage": "256GB",
    "color": [
      "Blue",
      "Orange",
      "Silver"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1390,
    "priceLabel": "USD 1.390"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Pro Max",
    "storage": "256GB",
    "color": [
      "Orange",
      "Blue"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1500,
    "priceLabel": "USD 1.500"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Pro Max",
    "storage": "256GB",
    "color": [
      "Silver"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1550,
    "priceLabel": "USD 1.550"
  }
]
window.PRODUCTS = [
  {
    "category": "iphone-preowned",
    "name": "iPhone 8",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 100,
    "priceLabel": "USD 100"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2020",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "99%",
    "grade": "A+",
    "price": 200,
    "priceLabel": "USD 200"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2020",
    "storage": "128GB",
    "color": [
      "Red"
    ],
    "battery": "82%",
    "grade": "A+",
    "price": 220,
    "priceLabel": "USD 220"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone SE 2020",
    "storage": "256GB",
    "color": [
      "Black"
    ],
    "battery": "86%",
    "grade": "A+",
    "price": 240,
    "priceLabel": "USD 240"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2022",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "89%",
    "grade": "A-",
    "price": 240,
    "priceLabel": "USD 240"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone SE 2022",
    "storage": "128GB",
    "color": [
      "White"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 240,
    "priceLabel": "USD 240"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11",
    "storage": "64GB",
    "color": [
      "White"
    ],
    "battery": "82%",
    "grade": "A",
    "price": 260,
    "priceLabel": "USD 260"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11",
    "storage": "64GB",
    "color": [
      "White"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 260,
    "priceLabel": "USD 260"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 11",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "100%",
    "grade": "A-",
    "price": 260,
    "priceLabel": "USD 260"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11 Pro",
    "storage": "256GB",
    "color": [
      "Green Midnight"
    ],
    "battery": "89%",
    "grade": "A-",
    "price": 300,
    "priceLabel": "USD 300"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 11 Pro Max",
    "storage": "64GB",
    "color": [
      "Space Gray"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 500,
    "priceLabel": "USD 500"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12",
    "storage": "64GB",
    "color": [
      "Black"
    ],
    "battery": "84%",
    "grade": "A",
    "price": 310,
    "priceLabel": "USD 310"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 12",
    "storage": "64GB",
    "color": [
      "Red"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 330,
    "priceLabel": "USD 330"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 12",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "86%",
    "grade": "A",
    "price": 330,
    "priceLabel": "USD 330"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12 Pro",
    "storage": "128GB",
    "color": [
      "Graphite"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 330,
    "priceLabel": "USD 330"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12 Pro",
    "storage": "128GB",
    "color": [
      "Pacific Blue"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 350,
    "priceLabel": "USD 350"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 12 Pro",
    "storage": "128GB",
    "color": [
      "Gold"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 350,
    "priceLabel": "USD 350"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 13 Mini",
    "storage": "128GB",
    "color": [
      "Blue"
    ],
    "battery": "100%",
    "grade": "B+",
    "price": 310,
    "priceLabel": "USD 310"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "100%",
    "grade": "B",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13 (Mjs display)",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "128GB",
    "color": [
      "Pink"
    ],
    "battery": "88%",
    "grade": "A+",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "128GB",
    "color": [
      "Pink"
    ],
    "battery": "100%",
    "grade": "A+",
    "price": 400,
    "priceLabel": "USD 400"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Blue"
    ],
    "battery": "100%",
    "grade": "A-",
    "price": 440,
    "priceLabel": "USD 440"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Midnight"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 420,
    "priceLabel": "USD 420"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Pink"
    ],
    "battery": "87%",
    "grade": "A",
    "price": 420,
    "priceLabel": "USD 420"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 13",
    "storage": "256GB",
    "color": [
      "Red"
    ],
    "battery": "87%",
    "grade": "A+",
    "price": 420,
    "priceLabel": "USD 420"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14",
    "storage": "128GB",
    "color": [
      "Midnight"
    ],
    "battery": "87%",
    "grade": "A-",
    "price": 450,
    "priceLabel": "USD 450"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro",
    "storage": "256GB",
    "color": [
      "Deep Purple"
    ],
    "battery": "86%",
    "grade": "A-",
    "price": 580,
    "priceLabel": "USD 580"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro Max (Mjs display- MODULO OG)",
    "storage": "128GB",
    "color": [
      "Deep purple"
    ],
    "battery": "85%",
    "grade": "A",
    "price": 620,
    "priceLabel": "USD 620"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro Max",
    "storage": "128GB",
    "color": [
      "Space Black"
    ],
    "battery": "85%",
    "grade": "A",
    "price": 620,
    "priceLabel": "USD 620"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "color": [
      "Space Black"
    ],
    "battery": "100%",
    "grade": "A",
    "price": 660,
    "priceLabel": "USD 660"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15",
    "storage": "128GB",
    "color": [
      "Black"
    ],
    "battery": "87%",
    "grade": "A-",
    "price": 570,
    "priceLabel": "USD 570"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 15 Pro",
    "storage": "128GB",
    "color": [
      "Blue Titanium"
    ],
    "battery": "89%",
    "grade": "A",
    "price": 620,
    "priceLabel": "USD 620"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro (C/ SIM)",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "89%",
    "grade": "A+",
    "price": 670,
    "priceLabel": "USD 670"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "87%",
    "grade": "A+",
    "price": 670,
    "priceLabel": "USD 670"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro Max",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "83%",
    "grade": "A-",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 15 Pro Max",
    "storage": "256GB",
    "color": [
      "Natural Titanium"
    ],
    "battery": "86%",
    "grade": "A+",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-outlet",
    "name": "iPhone 15 Pro Max",
    "storage": "512GB",
    "color": [
      "Natural Titanium"
    ],
    "battery": "94%",
    "grade": "",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 16 Pro",
    "storage": "128GB",
    "color": [
      "Natural Titanium"
    ],
    "battery": "91%",
    "grade": "A+",
    "price": 800,
    "priceLabel": "USD 800"
  },
  {
    "category": "iphone-preowned",
    "name": "iPhone 16 Pro Max",
    "storage": "256GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "92%",
    "grade": "A+",
    "price": 970,
    "priceLabel": "USD 970"
  },
  {
    "category": "macbook-preowned",
    "name": "Macbook Pro A2141 2019 16' I9 (C/ Touchbar)",
    "storage": "1TB / 16GB",
    "color": [
      "Silver"
    ],
    "battery": "3 Ciclos",
    "grade": "A+",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "macbook-preowned",
    "name": "MacBook Air M1 13' (le falta una tecla)",
    "storage": "8GB / 256GB",
    "color": [
      "Space Gray"
    ],
    "battery": "BATERIA OK",
    "grade": "",
    "price": 650,
    "priceLabel": "USD 650"
  },
  {
    "category": "macbook-preowned",
    "name": "MacBook Pro M1 2020 13' (c/ touchbar) esq de pantalla astillada - trackpad astillado",
    "storage": "8G / 256GB",
    "color": [
      "Space Gray"
    ],
    "battery": "91% (278 Ciclos)",
    "grade": "A-",
    "price": 600,
    "priceLabel": "USD 600"
  },
  {
    "category": "watch-preowned",
    "name": "Watch Ultra 2 49mm + GPS + CELLULAR C/malla (Garantia hasta 6/03/26) Con cargador",
    "storage": "64GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "99%",
    "grade": "A",
    "price": 600,
    "priceLabel": "USD 600"
  },
  {
    "category": "watch-preowned",
    "name": "Watch Series 7 45mm (GPS) Con cargador",
    "storage": "32GB",
    "color": [
      "Black Titanium"
    ],
    "battery": "84%",
    "grade": "A-",
    "price": 190,
    "priceLabel": "USD 190"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 15",
    "storage": "128GB",
    "color": [],
    "battery": "New",
    "grade": "New",
    "price": 750,
    "priceLabel": "USD 750"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 16E",
    "storage": "128GB",
    "color": [],
    "battery": "New",
    "grade": "New",
    "price": null,
    "priceLabel": "Consultar"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 16",
    "storage": "128GB",
    "color": [],
    "battery": "New",
    "grade": "New",
    "price": 850,
    "priceLabel": "USD 850"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Air",
    "storage": "256GB",
    "color": [
      "Gold",
      "Blue",
      "White",
      "Black"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1080,
    "priceLabel": "USD 1.080"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17",
    "storage": "256GB",
    "color": [
      "Black",
      "Sage",
      "Lavender",
      "Blue"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1000,
    "priceLabel": "USD 1.000"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Pro",
    "storage": "256GB",
    "color": [
      "Blue",
      "Orange",
      "Silver"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1390,
    "priceLabel": "USD 1.390"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Pro Max",
    "storage": "256GB",
    "color": [
      "Orange",
      "Blue"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1500,
    "priceLabel": "USD 1.500"
  },
  {
    "category": "iphone-new",
    "name": "iPhone 17 Pro Max",
    "storage": "256GB",
    "color": [
      "Silver"
    ],
    "battery": "New",
    "grade": "New",
    "price": 1550,
    "priceLabel": "USD 1.550"
  }
];
