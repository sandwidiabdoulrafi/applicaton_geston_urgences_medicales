const express = require("express")

const cors = require("cors")
const dotenv = require('dotenv');
const routeRoutes = require("./routes/routeRoutes");

const app = express();

dotenv.config();

console.log("Google Maps API Key :", process.env.GOOGLE_MAPS_API_KEY);
app.use(cors);
app.use(express.json());



app.use("/gestion_urgence_medicale/routes", routeRoutes);

module.exports = app;

