const recentAPI = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const strongAPI = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&orderby=time&limit=1&eventtype=earthquake";

let earthquakes = [];
let filterStrong = false;

function level(magnitude) {
  return magnitude >= 5 ? "high" : magnitude >= 2.5 ? "medium" : "low";
}

function showCard(id, earthquake) {
  const card = document.getElementById(id);
  if (!earthquake) {
    card.querySelector(".place").textContent = "No earthquake found";
    return;
  }

  const q = earthquake.properties;
  const magnitude = q.mag ?? 0;
  card.className = "featured " + level(magnitude);
  card.style.setProperty("--size", Math.min(1.3, Math.max(0.7, magnitude / 5)));
  card.querySelector(".value").textContent = magnitude.toFixed(1);
  card.querySelector(".place").textContent = q.place || "Unknown location";
  card.querySelector(".time").textContent = new Date(q.time).toLocaleString();
  card.querySelector(".level").textContent = magnitude >= 5 ? "Magnitude 5.0 or higher" : magnitude >= 2.5 ? "Magnitude 2.5–4.9" : "Magnitude below 2.5";
}

function showList() {
  const list = document.getElementById("earthquakes");
  const latestFive = earthquakes.filter(q => !filterStrong || q.properties.mag >= 2.5).slice(0, 5);
  list.replaceChildren();

  if (latestFive.length === 0) {
    list.textContent = "No earthquakes found.";
    return;
  }

  latestFive.forEach(earthquake => {
    const q = earthquake.properties;
    const row = document.createElement("a");
    row.className = "quake";
    row.href = q.url;
    row.target = "_blank";
    row.rel = "noopener noreferrer";

    const mag = document.createElement("span");
    mag.className = "mag " + level(q.mag ?? 0);
    mag.textContent = q.mag?.toFixed(1) ?? "--";

    const info = document.createElement("span");
    info.className = "quake-info";
    const place = document.createElement("strong");
    place.textContent = q.place || "Unknown location";
    const time = document.createElement("small");
    time.textContent = new Date(q.time).toLocaleString();
    info.append(place, time);
    row.append(mag, info);
    list.append(row);
  });
}

async function getEarthquakes() {
  const refresh = document.getElementById("refresh");
  refresh.disabled = true;
  try {
    const responses = await Promise.all([fetch(recentAPI), fetch(strongAPI)]);
    if (responses.some(response => !response.ok)) throw new Error("API unavailable");
    const [recent, strong] = await Promise.all(responses.map(response => response.json()));

    earthquakes = recent.features
      .filter(q => q.properties.type === "earthquake")
      .sort((a, b) => b.properties.time - a.properties.time);

    showCard("latest-card", earthquakes[0]);
    showCard("strong-card", strong.features[0]);
    showList();
    document.getElementById("updated").textContent = "Updated: " + new Date().toLocaleTimeString();
  } catch (error) {
    document.getElementById("updated").textContent = "Could not load data. Try refreshing.";
  }
  refresh.disabled = false;
}

document.getElementById("refresh").addEventListener("click", getEarthquakes);
document.getElementById("all").addEventListener("click", () => {
  filterStrong = false;
  document.getElementById("all").classList.add("active");
  document.getElementById("strong").classList.remove("active");
  showList();
});
document.getElementById("strong").addEventListener("click", () => {
  filterStrong = true;
  document.getElementById("strong").classList.add("active");
  document.getElementById("all").classList.remove("active");
  showList();
});

getEarthquakes();
setInterval(getEarthquakes, 60000);
