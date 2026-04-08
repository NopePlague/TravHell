// let api = "https://api.geoapify.com/v2/places?categories=tourism&filter=circle:77.2167,28.6667,20000&limit=50&apiKey=a31292bf77a74691a892781eb579eb50";

// async function fetchPlaceImage() {
//   try {
//     const response = await fetch(api);
//     const data = await response.json();
//     for (let i = 0; i < data.features.length; i++) {
//         const wikidataId =
//           data?.features?.[i]?.properties?.wiki_and_media?.wikidata;
    
//         if (!wikidataId) {
//           console.log("No Wikidata ID found");
//           continue;
//         }
//         console.log(i+1)
//         console.log("Wikidata ID:", wikidataId);
//         console.log("Name: ",data.features[i].properties.name);
    
//         const url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
//         const res = await fetch(url);
//         const wikidata = await res.json();
    
//         const entity = wikidata.entities[wikidataId];
    
//         if (!entity.claims.P18) {
//           console.log("No image available");
//           continue;
//         }
    
//         const imageName =
//           entity.claims.P18[0].mainsnak.datavalue.value;
    
//         const imageUrl =
//           "https://commons.wikimedia.org/wiki/Special:FilePath/" +
//           encodeURIComponent(imageName);
    
//         console.log("Image URL:", imageUrl);
//     }

//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// fetchPlaceImage();



const API_KEY = "a31292bf77a74691a892781eb579eb50";
const FALLBACK_IMG = "https://static.vecteezy.com/system/resources/previews/031/975/000/non_2x/modern-minimal-not-found-error-icon-oops-page-not-found-404-error-the-page-not-found-with-concept-cartoon-cut-theme-web-banner-link-to-empty-non-existent-page-workers-repairs-website-vector.jpg";
const PER_PAGE = 9;

let allPlaces = [];
let filteredPlaces = [];
let currentFilter = "all";
let currentPage = 1;
let searchQuery = "";
let debounceTimer;

const container  = document.getElementById("places");
const loading    = document.getElementById("loading");
const pagination = document.getElementById("pagination");
const resultInfo = document.getElementById("resultInfo");

let favorites = JSON.parse(localStorage.getItem("travhell_favs") || "[]");

function saveFavs() {
  localStorage.setItem("travhell_favs", JSON.stringify(favorites));
  updateFavCount();
  renderFavPanel();
}

function isFaved(id) {
  return favorites.some(f => f.id === id);
}

function toggleFav(place) {
  if (isFaved(place.id)) {
    favorites = favorites.filter(f => f.id !== place.id);
  } else {
    favorites.push(place);
  }
  saveFavs();
}

function updateFavCount() {
  document.getElementById("favCount").textContent = favorites.length;
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  document.getElementById("themeBtn").textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("travhell_theme", isDark ? "light" : "dark");
}

const savedTheme = localStorage.getItem("travhell_theme");
if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("themeBtn").textContent = savedTheme === "light" ? "☀️" : "🌙";
}

function toggleFavPanel() {
  document.getElementById("favPanel").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("active");
  renderFavPanel();
}

function renderFavPanel() {
  const list = document.getElementById("favList");
  if (favorites.length === 0) {
    list.innerHTML = `<div class="fav-empty"><span style="font-size:2rem">🗺️</span><p>No saved places yet.<br>Tap ♥ on any card to save.</p></div>`;
    return;
  }
  list.innerHTML = favorites.map(f => `
    <div class="fav-item">
      <img src="${f.img}" alt="${f.name}" onerror="this.src='${FALLBACK_IMG}'" />
      <div>
        <div class="fav-item-name">${f.name}</div>
        <div class="fav-item-loc">📍 ${f.city}, ${f.country}</div>
      </div>
      <button class="fav-remove" onclick="removeFav('${f.id}')">✕</button>
    </div>
  `).join("");
}

function removeFav(id) {
  favorites = favorites.filter(f => f.id !== id);
  saveFavs();
  renderFavPanel();
  renderGrid();
}

const api = `https://api.geoapify.com/v2/places?categories=tourism&filter=circle:77.2167,28.6667,20000&limit=50&apiKey=${API_KEY}`;

async function fetchPlaces() {
  loading.style.display = "flex";
  container.style.display = "none";
  pagination.innerHTML = "";
  resultInfo.textContent = "";

  try {
    const res  = await fetch(api);
    const data = await res.json();

    const raw = data.features || [];
    const resolved = await Promise.all(raw.map(async (place) => {
      const name       = place.properties.name || "Unknown Place";
      const city       = place.properties.city || place.properties.county || "Unknown";
      const country    = place.properties.country || "";
      const category   = place.properties.categories?.[0] || "tourism";
      const wikidataId = place?.properties?.wiki_and_media?.wikidata;
      const id         = place.properties.place_id || Math.random().toString(36).slice(2);
      const img        = await getImage(wikidataId);

      return { id, name, city, country, category, img };
    }));

    allPlaces = resolved.filter(p => p.name !== "Unknown Place");
    currentFilter = "all";
    currentPage   = 1;
    searchQuery   = "";
    document.getElementById("searchInput").value = "";

    applySortFilter();

  } catch (err) {
    loading.style.display = "none";
    container.style.display = "grid";
    container.innerHTML = `<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:3rem">Failed to load places. Check your API key or internet.</p>`;
  }
}

async function getImage(wikidataId) {
  try {
    if (!wikidataId) return FALLBACK_IMG;
    const res    = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);
    const data   = await res.json();
    const entity = data.entities[wikidataId];
    if (!entity?.claims?.P18) return FALLBACK_IMG;
    const imgName = entity.claims.P18[0].mainsnak.datavalue.value;
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imgName)}`;
  } catch {
    return FALLBACK_IMG;
  }
}

function handleSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery   = document.getElementById("searchInput").value.trim().toLowerCase();
    currentPage   = 1;
    applySortFilter();
  }, 350);
}

function setFilter(filter, btn) {
  currentFilter = filter;
  currentPage   = 1;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  applySortFilter();
}

function applySortFilter() {
  let result = allPlaces.filter(p => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery) ||
      p.city.toLowerCase().includes(searchQuery)
    );
  });

  if (currentFilter !== "all") {
    result = result.filter(p => p.category.toLowerCase().includes(currentFilter));
  }

  const sortVal = document.getElementById("sortSelect").value;
  if (sortVal === "name_asc")  result = result.sort((a, b) => a.name.localeCompare(b.name));
  if (sortVal === "name_desc") result = result.sort((a, b) => b.name.localeCompare(a.name));

  filteredPlaces = result;

  resultInfo.textContent = `Showing ${filteredPlaces.length} place${filteredPlaces.length !== 1 ? "s" : ""}`;

  loading.style.display = "none";
  container.style.display = "grid";

  if (filteredPlaces.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--muted)"><div style="font-size:3rem;margin-bottom:1rem">🗺️</div><p>No places found. Try a different search or filter.</p></div>`;
    pagination.innerHTML = "";
    return;
  }

  renderGrid();
  renderPagination();
}

function renderGrid() {
  const start    = (currentPage - 1) * PER_PAGE;
  const pageData = filteredPlaces.slice(start, start + PER_PAGE);

  container.innerHTML = pageData.map((place, i) => {
    const saved = isFaved(place.id);
    return `
      <div class="card" style="animation-delay:${i * 0.06}s">
        <img
          src="${place.img}"
          alt="${place.name}"
          onerror="this.src='${FALLBACK_IMG}'"
        />
        <div class="card-body">
          <h3>${place.name}</h3>
          <p class="location">📍 ${place.city}, ${place.country}</p>
          <p class="category">${formatCategory(place.category)}</p>
          <div class="card-footer">
            <button class="btn-view" onclick="openModal('${escStr(place.name)}','${escStr(place.city)}','${escStr(place.country)}','${escStr(place.category)}','${escStr(place.img)}')">View More</button>
            <button class="btn-save ${saved ? "saved" : ""}" onclick="handleSave('${place.id}', this)">
              <span class="heart-icon">${saved ? "♥" : "♡"}</span> ${saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function handleSave(id, btn) {
  const place = allPlaces.find(p => p.id === id);
  if (!place) return;
  toggleFav(place);
  const saved = isFaved(id);
  btn.innerHTML = `<span class="heart-icon">${saved ? "♥" : "♡"}</span> ${saved ? "Saved" : "Save"}`;
  btn.classList.toggle("saved", saved);
}

function openModal(name, city, country, category, img) {
  document.getElementById("modal-img").src       = img;
  document.getElementById("modal-img").onerror   = () => { document.getElementById("modal-img").src = FALLBACK_IMG; };
  document.getElementById("modal-name").textContent     = name;
  document.getElementById("modal-location").textContent = `📍 ${city}, ${country}`;
  document.getElementById("modal-category").textContent = formatCategory(category);
  document.getElementById("modal").classList.remove("hidden");
}

function renderPagination() {
  const total = Math.ceil(filteredPlaces.length / PER_PAGE);
  if (total <= 1) { pagination.innerHTML = ""; return; }

  let html = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>←</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === total ? "disabled" : ""}>→</button>`;
  pagination.innerHTML = html;
}

function goPage(page) {
  const total = Math.ceil(filteredPlaces.length / PER_PAGE);
  if (page < 1 || page > total) return;
  currentPage = page;
  renderGrid();
  renderPagination();
  window.scrollTo({ top: 300, behavior: "smooth" });
}

function formatCategory(cat) {
  return cat.split(".").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" › ");
}

function escStr(str) {
  return (str || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

updateFavCount();
fetchPlaces();