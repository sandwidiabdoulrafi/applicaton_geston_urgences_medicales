const express = require("express");
const { addPatient, updatePatient, deletePatient, getAllPatients } = require("../controllers/patientController");

const router = express.Router();

//  Ajouter un patient
router.post("/add", addPatient);

//  Mettre à jour un patient
router.patch("/update", updatePatient);

// Supprimer un patient
router.delete("/delete", deletePatient);

// Récupérer tous les patients
router.get("/get_all", getAllPatients);

module.exports = router;