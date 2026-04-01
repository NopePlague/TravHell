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

const api = "https://api.geoapify.com/v2/places?categories=tourism&filter=circle:77.2167,28.6667,20000&limit=50&apiKey=a31292bf77a74691a892781eb579eb50";

const container = document.getElementById("places");
const loading = document.getElementById("loading");

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalName = document.getElementById("modal-name");
const modalLocation = document.getElementById("modal-location");
const modalCategory = document.getElementById("modal-category");
const closeBtn = document.getElementById("close");


async function fetchPlaces() {
  try {
    const res = await fetch(api);
    const data = await res.json();

    displayPlaces(data.features);

    loading.style.display = "none";
  } catch {
    loading.innerText = "Failed to load data";
  }
}


async function getImage(wikidataId) {
  try {
    if (!wikidataId) return fallback();

    const res = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`
    );
    const data = await res.json();

    const entity = data.entities[wikidataId];

    if (!entity.claims.P18) return fallback();

    const img =
      entity.claims.P18[0].mainsnak.datavalue.value;

    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img)}`;
  } catch {
    return fallback();
  }
}

function fallback() {
  return "https://via.placeholder.com/300x200?text=No+Image";
}


async function displayPlaces(places) {
  container.innerHTML = "";

  for (let place of places) {
    const name = place.properties.name || "Unknown";
    const city = place.properties.city || "Unknown";
    const country = place.properties.country || "";
    const category = place.properties.categories?.[0] || "tourism";
    const wikidataId = place?.properties?.wiki_and_media?.wikidata;

    const image = await getImage(wikidataId);

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <span class="heart">♡</span>
      <img src="${image}">
      <h3>${name}</h3>
      <p>${city}, ${country}</p>
      <p>${category}</p>
      <button>View More</button>
    `;

  
    const heart = card.querySelector(".heart");
    heart.addEventListener("click", () => {
      heart.classList.toggle("red");
    });


    const btn = card.querySelector("button");
    btn.addEventListener("click", () => {
      modal.classList.remove("hidden");

      modalImg.src = image;
      modalName.innerText = name;
      modalLocation.innerText = `${city}, ${country}`;
      modalCategory.innerText = category;
    });

    container.appendChild(card);
  }
}


closeBtn.onclick = () => modal.classList.add("hidden");

fetchPlaces();