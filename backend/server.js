import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import fetch from "node-fetch";

import getNearbySupermarkets from './api/getNearbyStores.js';

dotenv.config();

const log = console.log;

const app = express();

log("key: ", process.env.API_KEY)

// --- Example usage ---
// Any of these input formats work:
const results1 = await getNearbySupermarkets("4696 Ave. King-Edward, Montréal, QC H4V 2J6");

console.log(`Found ${results1.length} supermarkets:`);
results1.forEach((s) => {
  console.log(`• ${s.name} — ${s.address}`);
});

app.get("/", (req, res) => {

    res.send(results1);
})

app.listen(process.env.PORT || 8000, () => {
    log("Server is listening on port", process.env.PORT)
})