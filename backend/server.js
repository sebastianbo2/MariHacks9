import express from 'express';
import axios from 'axios';
import fetch from "node-fetch";
import cors from 'cors';
import "dotenv/config"

import recipeRoutes from "./routers/recipeRoutes.js";

const log = console.log;

const app = express();
app.use(express.json());
app.use(cors());
// app.use('/api/ai', recipeRoutes);

// log("key: ", process.env.API_KEY)

// --- Example usage ---
// Any of these input formats work:
// const results1 = await getNearbySupermarkets("4696 Ave. King-Edward, Montréal, QC H4V 2J6");

// console.log(`Found ${results1.length} supermarkets:`);
// results1.forEach((s) => {
//   console.log(`• ${s.name} — ${s.address}`);
// });

app.get("/", (req, res) => {
  res.json({
    service: "MariHacks9 backend",
    status: "ok",
    endpoints: ["POST /api/ai/recipes"],
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  log("Server is listening on port", PORT);
});