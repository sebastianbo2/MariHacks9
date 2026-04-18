import axios from 'axios';

async function addressToCoords(address) {
  // Append region to improve accuracy
  const fullAddress = `${address}, Quebec, Canada`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "my-supermarket-app/1.0" },
  });
  const data = await res.json();

  if (!data.length) throw new Error(`Address not found: ${address}`);

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name, // useful to confirm what was matched
  };
}

async function getNearbySupermarkets(address, radiusMeters = 1000) {
  const { lat, lon, displayName } = await addressToCoords(address);
  console.log(`📍 Resolved to: ${displayName}`);

  const query = `
    [out:json][timeout:25];
    (
      node["shop"="supermarket"](around:${radiusMeters},${lat},${lon});
      way["shop"="supermarket"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = await res.json();

  return data.elements.map((el) => ({
    id: el.id,
    name: el.tags?.name ?? "Unknown",
    brand: el.tags?.brand ?? null,
    address: [
      el.tags?.["addr:housenumber"],
      el.tags?.["addr:street"],
      el.tags?.["addr:city"],
    ]
      .filter(Boolean)
      .join(" "),
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
    openingHours: el.tags?.opening_hours ?? null,
    phone: el.tags?.phone ?? null,
    website: el.tags?.website ?? null,
  }));
}

export default getNearbySupermarkets;