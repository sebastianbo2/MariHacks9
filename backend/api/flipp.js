import axios from "axios";

// GROCERY_STORES = ["Provigo", 'FreshCo', 'Walmart', 'Loblaws', "Maxi", "IGA", "Metro", "Super C", "T&T Supermarket"]
const GROCERY_STORES = ["Provigo", "IGA", "Super C"];
const log = console.log;

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
  const sid = generate_sid();
  const url = `${process.env.FLYER_API_URL}data?locale=en&postal_code=${postalCode}&sid=${sid}`;
  try {
    const resp = await axios.get(url);
    return resp;
  } catch (error) {
    console.error("Could not fetch flyers by postal code:", error);
  }
}

/**
 * Return flyer id's for grocery stores applicable to given postal code that are labeled as "Groceries" to filter out non-grocery flyers
    
 * @param {*} postalCode 
 */
export async function getGroceryFlyerId(postalCode) {
  const responseData = await getFlyersByPostalCode(postalCode);
  // log(responseData.data.flyers[0]);

  if (!responseData.data.flyers) {
    return null;
  }

  const groceryFlyers = [];

  let ctr = 0;
  for (const flyer of responseData.data["flyers"]) {
    if (ctr++ < 4) {
      log(flyer);
    }
    const merchant = flyer["merchant"];
    const categories = flyer["categories"] ?? [];

    if (typeof categories === "string") {
      categories = categories.split(",");
    }

    log("-----------");
    log(categories);
    log(typeof categories);

    if (GROCERY_STORES.includes(merchant)) {
      if (categories.includes("Groceries")) {
        log("Hello world");
        groceryFlyers.push({
          id: flyer["id"],
          merchant: merchant,
        });
      }
    }
  }

  log(groceryFlyers);

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
    console.error(
      "Error occured while getting flyer items from flyer id:",
      error,
    );
  }
}

export async function getAllGroceries(postalCode) {
  // regex to check postal code

  const grocery_flyers = await getGroceryFlyerId(postalCode);
  if (grocery_flyers.length === 0) {
    log("No grocery flyers found for postal code");
    return;
  }

  log("Found some grocery flyers for postal code", postalCode);

  for (const flyer of grocery_flyers) {
    const flyerId = flyer["id"];
    const merchant = flyer["merchant"];
    log(`Processing ${merchant} flyer`);

    const items = await getFlyerItems(flyerId);
    log(Object.keys(items));
    log("merchant,flyer_id,name,price,valid_from,valid_to");

    for (const item of items.data) {
      log(
        merchant,
        item.flyer_id,
        item.name ?? "no name",
        item.price ?? "no price",
        item.valid_from ?? "",
        item.valid_to ?? "",
      );
    }
  }
}
