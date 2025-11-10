const express = require("express");

const router = express.Router();

const  mapControlleur = require("../controllers/");

router.get("/directions",mapControlleur.getDirections);


module.exports = router;
