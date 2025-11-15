const express = require("express");
const router = express.Router();
const urgenceController = require("../controllers/urgenceController");


// Ajouter une urgence
router.post("/add", urgenceController.addUrgence);

// Supprimer une urgence
router.delete("/delete", urgenceController.deleteUrgence);

// Mettre à jour une urgence
router.put("/update", urgenceController.updateUrgence);

//  Récupérer toutes les urgences
router.get("/get_all", urgenceController.getAllUrgence);

// Service intervient sur une urgence (Socket intégré)
router.post("/intervention", urgenceController.serviceIntervient);


module.exports = router;