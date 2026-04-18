import axios from "axios";

const GROCERY_STORES = [
  "Provigo",
  "IGA",
  "Super C",
  "Maxi",
  "Metro",
  "Walmart",
  "Loblaws",
  "No Frills",
  "FreshCo",
  "Food Basics",
  "Costco",
  "Adonis",
  "PA Supermarche",
];

function normalizePostalCode(postalCode) {
  return String(postalCode ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export function generate_sid() {
  let sid = "";

  for (let i = 0; i < 16; i++) {
    const randomNum = Math.floor(Math.random() * (9 - 0 + 1));
    sid += randomNum.toString();
  }

  return sid;
}

/**
 *  Fetch flyer data from Flipp API given a postal code and a session ID.
 * @param {*} postalCode
 * @returns
 */
export async function getFlyersByPostalCode(postalCode) {
  const normalized = normalizePostalCode(postalCode);
  if (!normalized) {
    throw new Error("postalCode is required");
  }

  const sid = generate_sid();
  const url = `${process.env.FLYER_API_URL}data?locale=en&postal_code=${normalized}&sid=${sid}`;
  try {
    const resp = await axios.get(url);
    return resp;
  } catch (error) {
    throw new Error(`Could not fetch flyers by postal code: ${error.message}`);
  }
}

/**
 * Return flyer id's for grocery stores applicable to given postal code that are labeled as "Groceries" to filter out non-grocery flyers
    
 * @param {*} postalCode 
 */
export async function getGroceryFlyerId(postalCode) {
  const responseData = await getFlyersByPostalCode(postalCode);
  const flyers = responseData?.data?.flyers;
  if (!Array.isArray(flyers)) {
    return [];
  }

  const groceryFlyers = [];

  for (const flyer of flyers) {
    const merchant = flyer["merchant"];
    let categories = flyer["categories"] ?? [];

    if (typeof categories === "string") {
      categories = categories.split(",");
    }

    if (GROCERY_STORES.includes(merchant)) {
      if (categories.includes("Groceries")) {
        groceryFlyers.push({
          id: flyer["id"],
          merchant: merchant,
        });
      }
    }
  }

  return groceryFlyers;
}

/*
Return flyer items for a given flyer id
*/
export async function getFlyerItems(flyerId) {
  const sid = generate_sid();

  const url = `${process.env.FLYER_API_URL}flyers/${flyerId}/flyer_items?locale=en&sid=${sid}`;
  try {
    const resp = await axios.get(url);
    return resp;
  } catch (error) {
    throw new Error(`Error occured while getting flyer items from flyer id: ${error.message}`);
  }
}

function toPriceNumber(value) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getAllGroceries(postalCode) {
  const groceryFlyers = await getGroceryFlyerId(postalCode);
  if (groceryFlyers.length === 0) {
    return [];
  }

  const allItems = [];

  for (const flyer of groceryFlyers) {
    const flyerId = flyer.id;
    const merchant = flyer.merchant;
    const itemsResponse = await getFlyerItems(flyerId);
    const items = Array.isArray(itemsResponse?.data) ? itemsResponse.data : [];

    for (const item of items) {
      const normalized = {
        merchant,
        flyer_id: item.flyer_id ?? flyerId,
        name: item.name ?? "Unnamed item",
        price: toPriceNumber(item.price),
        valid_from: item.valid_from ?? null,
        valid_to: item.valid_to ?? null,
        store_name: merchant,
        store_lat: 0,
        store_lon: 0,
      };

      if (normalized.price != null) {
        allItems.push(normalized);
      }
    }
  }

  return allItems;
}
