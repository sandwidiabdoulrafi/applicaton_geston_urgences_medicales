const { db } = require("../config/firebaseConfig");

// ➕ Ajouter un patient
const addPatient = async (req, res) => {
    try {
        const { idPatient, nom, prenom, email, telephone, adresse } = req.body;

        if (!idPatient || !nom || !prenom || !email) {
            return res.status(400).json({ success: false, message: "Champs obligatoires manquants" });
        }

        const newPatient = {
            idPatient,
            nom,
            prenom,
            email,
            telephone: telephone || "",
            adresse: adresse || "",
            dateInscription: new Date().toISOString()
        };

        await db.collection("patients").doc(idPatient).set(newPatient);

        res.status(201).json({ success: true, message: "Patient ajouté avec succès", data: newPatient });

    } catch (error) {
        console.error("❌ Erreur ajout patient :", error);
        res.status(500).json({ success: false, message: "Erreur ajout patient", error: error.message });
    }
};

// 🔄 Mise à jour patient
const updatePatient = async (req, res) => {
    try {
        const { idPatient, ...data } = req.body;
        await db.collection("patients").doc(idPatient).update(data);
        res.status(200).json({ success: true, message: "Patient mis à jour" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur mise à jour", error: error.message });
    }
};

// ❌ Suppression
const deletePatient = async (req, res) => {
    try {
        const { idPatient } = req.body;
        await db.collection("patients").doc(idPatient).delete();
        res.status(200).json({ success: true, message: "Patient supprimé" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur suppression patient", error: error.message });
    }
};

// 📋 Liste patients
const getAllPatients = async (req, res) => {
    try {
        const snapshot = await db.collection("patients").get();
        const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, data: patients });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur récupération patients", error: error.message });
    }
};

module.exports = { addPatient, updatePatient, deletePatient, getAllPatients };
