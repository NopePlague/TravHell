var API_KEY = "a31292bf77a74691a892781eb579eb50";
var FALLBACK_IMG = "https://static.vecteezy.com/system/resources/previews/031/975/000/non_2x/modern-minimal-not-found-error-icon-oops-page-not-found-404-error-the-page-not-found-with-concept-cartoon-cut-theme-web-banner-link-to-empty-non-existent-page-workers-repairs-website-vector.jpg";
var PER_PAGE = 9;
var API_URL = "https://api.geoapify.com/v2/places?categories=tourism&filter=circle:77.2167,28.6667,20000&limit=50&apiKey=" + API_KEY;

var allPlaces = [];
var filteredPlaces = [];
var currentFilter = "all";
var currentPage = 1;
var searchQuery = "";
var debounceTimer;
var isDark = true;

var container  = document.getElementById("places");
var loading    = document.getElementById("loading");
var pagination = document.getElementById("pagination");
var resultInfo = document.getElementById("resultInfo");

var favorites = JSON.parse(localStorage.getItem("travhell_favs") || "[]");

function saveFavs() {
  localStorage.setItem("travhell_favs", JSON.stringify(favorites));
  updateFavCount();
  renderFavPanel();
}

function isFaved(id) {
  var found = false;
  for (var i = 0; i < favorites.length; i++) {
    if (favorites[i].id === id) { found = true; break; }
  }
  return found;
}

function toggleFav(place) {
  if (isFaved(place.id)) {
    var newFavs = [];
    for (var i = 0; i < favorites.length; i++) {
      if (favorites[i].id !== place.id) newFavs.push(favorites[i]);
    }
    favorites = newFavs;
  } else {
    favorites.push(place);
  }
  saveFavs();
}

function updateFavCount() {
  document.getElementById("favCount").textContent = favorites.length;
}

function toggleTheme() {
  var body = document.getElementById("body-dark") || document.getElementById("body-light");
  if (isDark) {
    body.id = "body-light";
    document.getElementById("themeBtn").textContent = "🧛🏿 Spooky";
    isDark = false;
    localStorage.setItem("travhell_theme", "light");
  } else {
    body.id = "body-dark";
    document.getElementById("themeBtn").textContent = "🌿 Nature";
    isDark = true;
    localStorage.setItem("travhell_theme", "dark");
  }
}

var savedTheme = localStorage.getItem("travhell_theme");
if (savedTheme === "light") {
  document.body.id = "body-light";
  isDark = false;
  document.getElementById("themeBtn").textContent = "💀 Spooky";
}

function toggleFavPanel() {
  document.getElementById("favPanel").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("active");
  renderFavPanel();
}

function renderFavPanel() {
  var list = document.getElementById("favList");
  if (favorites.length === 0) {
    list.innerHTML = '<div class="fav-empty"><span style="font-size:2rem">🗺️</span><p>No saved places yet.<br>Tap Save on any card.</p></div>';
    return;
  }
  var html = "";
  for (var i = 0; i < favorites.length; i++) {
    var f = favorites[i];
    html += '<div class="fav-item">';
    html += '<img src="' + f.img + '" onerror="this.src=\'' + FALLBACK_IMG + '\'" />';
    html += '<div><div class="fav-item-name">' + f.name + '</div>';
    html += '<div class="fav-item-loc">📍 ' + f.city + ', ' + f.country + '</div></div>';
    html += '<button class="fav-remove" onclick="removeFav(\'' + f.id + '\')">✕</button>';
    html += '</div>';
  }
  list.innerHTML = html;
}

function removeFav(id) {
  var newFavs = [];
  for (var i = 0; i < favorites.length; i++) {
    if (favorites[i].id !== id) newFavs.push(favorites[i]);
  }
  favorites = newFavs;
  saveFavs();
  renderFavPanel();
  renderGrid();
}

async function fetchPlaces() {
  loading.style.display = "flex";
  container.style.display = "none";
  pagination.innerHTML = "";
  resultInfo.textContent = "";

  try {
    var res = await fetch(API_URL);
    var data = await res.json();
    var raw = data.features || [];

    var resolved = [];
    for (var i = 0; i < raw.length; i++) {
      var p = raw[i].properties;
      var name = p.name || "";
      if (!name) continue;

      var city = p.city || p.county || "Unknown";
      var country = p.country || "";
      var categories = p.categories || [];
      var wikidataId = p.wiki_and_media ? p.wiki_and_media.wikidata : null;
      var id = p.place_id || ("place_" + i);
      var img = await getImage(wikidataId);

      resolved.push({
        id: id,
        name: name,
        city: city,
        country: country,
        categories: categories,
        img: img
      });
    }

    allPlaces = resolved;
    currentFilter = "all";
    currentPage = 1;
    searchQuery = "";
    document.getElementById("searchInput").value = "";

    applySortFilter();

  } catch (err) {
    loading.style.display = "none";
    container.style.display = "grid";
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888">Failed to load places. Check API key or internet.</p>';
  }
}

async function getImage(wikidataId) {
  try {
    if (!wikidataId) return FALLBACK_IMG;
    var res = await fetch("https://www.wikidata.org/wiki/Special:EntityData/" + wikidataId + ".json");
    var data = await res.json();
    var entity = data.entities[wikidataId];
    if (!entity || !entity.claims || !entity.claims.P18) return FALLBACK_IMG;
    var imgName = entity.claims.P18[0].mainsnak.datavalue.value;
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(imgName);
  } catch (e) {
    return FALLBACK_IMG;
  }
}

function handleSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
    currentPage = 1;
    applySortFilter();
  }, 350);
}

function setFilter(filter, btn) {
  currentFilter = filter;
  currentPage = 1;
  var buttons = document.querySelectorAll(".filter-btn");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }
  btn.classList.add("active");
  applySortFilter();
}

function getCategoryType(categories) {
  var joined = "";
  for (var i = 0; i < categories.length; i++) {
    joined += categories[i].toLowerCase() + " ";
  }

  if (joined.indexOf("castle") > -1 || joined.indexOf("monument") > -1 || joined.indexOf("memorial") > -1 || joined.indexOf("historic") > -1) return "historic";
  if (joined.indexOf("mosque") > -1 || joined.indexOf("place_of_worship") > -1 || joined.indexOf("religion") > -1 || joined.indexOf("temple") > -1 || joined.indexOf("church") > -1) return "religion";
  if (joined.indexOf("natural") > -1 || joined.indexOf("park") > -1 || joined.indexOf("nature") > -1) return "natural";
  if (joined.indexOf("museum") > -1 || joined.indexOf("cultural") > -1 || joined.indexOf("art") > -1 || joined.indexOf("gallery") > -1) return "cultural";
  if (joined.indexOf("sport") > -1 || joined.indexOf("stadium") > -1) return "sport";
  return "tourism";
}

function getCategoryLabel(type) {
  if (type === "historic")  return "🏛️ Historic";
  if (type === "religion")  return "🕌 Religious";
  if (type === "natural")   return "🌿 Nature";
  if (type === "cultural")  return "🎭 Culture";
  if (type === "sport")     return "⚽ Sport";
  return "📍 Tourism";
}

function getAllCategoryTags(categories) {
  var tags = [];
  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    var parts = cat.split(".");
    var last = parts[parts.length - 1];
    var label = last.replace(/_/g, " ");
    label = label.charAt(0).toUpperCase() + label.slice(1);
    var alreadyIn = false;
    for (var j = 0; j < tags.length; j++) {
      if (tags[j] === label) { alreadyIn = true; break; }
    }
    if (!alreadyIn && label.length > 1) tags.push(label);
  }
  return tags;
}

function applySortFilter() {
  var result = allPlaces.filter(function(p) {
    if (!searchQuery) return true;
    var nameMatch = p.name.toLowerCase().indexOf(searchQuery) > -1;
    var cityMatch = p.city.toLowerCase().indexOf(searchQuery) > -1;
    var catMatch  = false;
    for (var i = 0; i < p.categories.length; i++) {
      if (p.categories[i].toLowerCase().indexOf(searchQuery) > -1) { catMatch = true; break; }
    }
    return nameMatch || cityMatch || catMatch;
  });

  if (currentFilter !== "all") {
    result = result.filter(function(p) {
      var type = getCategoryType(p.categories);
      return type === currentFilter;
    });
  }

  var sortVal = document.getElementById("sortSelect").value;
  if (sortVal === "name_asc") {
    result = result.sort(function(a, b) { return a.name.localeCompare(b.name); });
  }
  if (sortVal === "name_desc") {
    result = result.sort(function(a, b) { return b.name.localeCompare(a.name); });
  }

  filteredPlaces = result;
  resultInfo.textContent = "Showing " + filteredPlaces.length + (filteredPlaces.length === 1 ? " place" : " places");

  loading.style.display = "none";
  container.style.display = "grid";

  if (filteredPlaces.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#888"><div style="font-size:3rem;margin-bottom:12px">🗺️</div><p>No places found. Try a different search or filter.</p></div>';
    pagination.innerHTML = "";
    return;
  }

  renderGrid();
  renderPagination();
}

function renderGrid() {
  var start = (currentPage - 1) * PER_PAGE;
  var pageData = filteredPlaces.slice(start, start + PER_PAGE);
  var html = "";

  for (var i = 0; i < pageData.length; i++) {
    var place = pageData[i];
    var saved = isFaved(place.id);
    var type = getCategoryType(place.categories);
    var label = getCategoryLabel(type);

    html += '<div class="card">';
    html += '<div class="card-img-wrap">';
    html += '<img src="' + place.img + '" alt="' + place.name + '" onerror="this.src=\'' + FALLBACK_IMG + '\'" />';
    html += '<span class="cat-badge">' + label + '</span>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<h3>' + place.name + '</h3>';
    html += '<p class="location">📍 ' + place.city + ', ' + place.country + '</p>';
    html += '<div class="card-footer">';

    html += '<button class="btn-view" onclick="openModal(\'' + esc(place.id) + '\')">View More</button>';
    html += '<button class="btn-save ' + (saved ? "saved" : "") + '" onclick="handleSave(\'' + place.id + '\', this)">' + (saved ? "♥ Saved" : "♡ Save") + '</button>';

    html += '</div>';
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function handleSave(id, btn) {
  var place = null;
  for (var i = 0; i < allPlaces.length; i++) {
    if (allPlaces[i].id === id) { place = allPlaces[i]; break; }
  }
  if (!place) return;
  toggleFav(place);
  var saved = isFaved(id);
  btn.textContent = saved ? "♥ Saved" : "♡ Save";
  if (saved) { btn.classList.add("saved"); } else { btn.classList.remove("saved"); }
}

function openModal(id) {
  var place = null;
  for (var i = 0; i < allPlaces.length; i++) {
    if (allPlaces[i].id === id) { place = allPlaces[i]; break; }
  }
  if (!place) return;

  document.getElementById("modal-img").src = place.img;
  document.getElementById("modal-img").onerror = function() { this.src = FALLBACK_IMG; };
  document.getElementById("modal-name").textContent = place.name;
  document.getElementById("modal-location").textContent = "📍 " + place.city + ", " + place.country;

  var tags = getAllCategoryTags(place.categories);
  var tagsHtml = "";
  for (var i = 0; i < tags.length; i++) {
    tagsHtml += '<span class="modal-cat-tag">' + tags[i] + '</span>';
  }
  document.getElementById("modal-categories").innerHTML = tagsHtml;

  document.getElementById("modal").classList.remove("hidden");
}

function renderPagination() {
  var total = Math.ceil(filteredPlaces.length / PER_PAGE);
  if (total <= 1) { pagination.innerHTML = ""; return; }

  var html = '<button class="page-btn" onclick="goPage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? "disabled" : "") + '>←</button>';
  for (var i = 1; i <= total; i++) {
    html += '<button class="page-btn ' + (i === currentPage ? "active" : "") + '" onclick="goPage(' + i + ')">' + i + '</button>';
  }
  html += '<button class="page-btn" onclick="goPage(' + (currentPage + 1) + ')" ' + (currentPage === total ? "disabled" : "") + '>→</button>';
  pagination.innerHTML = html;
}

function goPage(page) {
  var total = Math.ceil(filteredPlaces.length / PER_PAGE);
  if (page < 1 || page > total) return;
  currentPage = page;
  renderGrid();
  renderPagination();
  window.scrollTo({ top: 300, behavior: "smooth" });
}

function esc(str) {
  return (str || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

updateFavCount();
fetchPlaces();