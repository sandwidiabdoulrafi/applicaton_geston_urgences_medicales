const express = require("express");
const router = express.Router();
const {
    addService,
    updateService,
    deleteAccountService,
    getAllServices_proxy,
    getServiceById,
    loginService,
    logoutService,
    changePasswordService,
    getServicesForUrgence   
} = require("../controllers/serviceController");

// Créer un service de santé
router.post("/add", addService);


// connexion d' un service de santé
router.post("/login", loginService);

// connexion d' un service de santé
router.post("/change_password", changePasswordService);

// Obtenir tous les services
router.get("/get_all_service_sante_proxy", getAllServices_proxy);

// Obtenir un service par ID
router.get("/:idService", getServiceById);

// Mettre à jour un service
router.patch("/update", updateService);

// Supprimer un service
router.delete("/delete", deleteAccountService);

router.post("/logout", logoutService);

//Récupérer tous les services associés à une urgence
router.post("/service/:idUrgence", getServicesForUrgence);

module.exports = router;


