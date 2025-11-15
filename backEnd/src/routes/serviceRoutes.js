const express = require("express");
const router = express.Router();
const {
    addService,
    updateService,
    deleteService,
    getAllServices,
    getServiceById
} = require("../controllers/serviceController");

// Créer un service de santé
router.post("/add", addService);

// Obtenir tous les services
router.get("/get_all_service_sante", getAllServices);

// Obtenir un service par ID
router.get("/:idService", getServiceById);

// Mettre à jour un service
router.patch("/update", updateService);

// Supprimer un service
router.delete("/delete", deleteService);

module.exports = router;