const express = require("express");
const { addPatient, changePasswordPatient, getPatientsForUrgence,  loginPatient,logoutPatient, updatePatient,deleteAccountPatient, getAllPatients } = require("../controllers/patientController");

const router = express.Router();

//  Ajouter un patient
router.post("/add", addPatient);


router.post("/login", loginPatient);

//  Mettre à jour un patient
router.patch("/update", updatePatient);


// deconnecter un patient
router.post("/logout", logoutPatient);

// chanf=ger le mot de passs d' un patient

router.post("/change_password", changePasswordPatient);


// Récupérer tous les patients associés à une urgence

router.post("/patient/:idPatient", getPatientsForUrgence);

// Supprimer un patient
router.delete("/delete", deleteAccountPatient);

// Récupérer tous les patients
router.get("/get_all", getAllPatients);

module.exports = router;



