const { db } = require("../config/firebaseConfig");

// ➕ Ajouter un service de santé
const addService = async (req, res) => {
    try {
        const {
            idService,
            nomEtablissement,
            email,
            motDePasse,
            telephone,
            typeEtablissement,
            adresse,
            ville,
            latitude,
            longitude,
            heureOuverture,
            heureFermeture,
            ouvert24h,
            description,
            photoProfil,
            distance,
            isActive
        } = req.body;

        // Vérification des champs obligatoires
        if (!idService || !nomEtablissement || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Champs obligatoires manquants (idService, nomEtablissement, latitude, longitude)"
            });
        }

        const newService = {
            idService,
            nomEtablissement,
            email: email || "",
            motDePasse: motDePasse || "",
            telephone: telephone || "",
            typeEtablissement: typeEtablissement || "",
            adresse: adresse || "",
            ville: ville || "",
            latitude,
            longitude,
            heureOuverture: heureOuverture || "",
            heureFermeture: heureFermeture || "",
            ouvert24h: ouvert24h || false,
            description: description || "",
            photoProfil: photoProfil || "",
            distance: distance || null,
            isActive: isActive ?? true,
            lastUpdated: new Date().toISOString()
        };

        // Ajout dans Firestore
        await db.collection("servicesSantes").doc(idService).set(newService);

        res.status(201).json({
            success: true,
            message: "Service de santé ajouté avec succès",
            data: newService
        });

    } catch (error) {
        console.error("❌ Erreur ajout service de santé :", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'ajout du service de santé",
            error: error.message
        });
    }
};

// 🔄 Mise à jour
const updateService = async (req, res) => {
    try {
        const { idService, ...data } = req.body;

        if (!idService) {
            return res.status(400).json({ success: false, message: "idService manquant" });
        }

        await db.collection("servicesSantes").doc(idService).update({
            ...data,
            lastUpdated: new Date().toISOString()
        });

        res.status(200).json({ success: true, message: "Service mis à jour avec succès" });
    } catch (error) {
        console.error("❌ Erreur update service :", error);
        res.status(500).json({ success: false, message: "Erreur mise à jour service", error: error.message });
    }
};

// ❌ Suppression
const deleteService = async (req, res) => {
    try {
        const { idService } = req.body;

        if (!idService) {
            return res.status(400).json({ success: false, message: "idService manquant" });
        }

        await db.collection("servicesSantes").doc(idService).delete();

        res.status(200).json({ success: true, message: "Service supprimé avec succès" });
    } catch (error) {
        console.error("❌ Erreur suppression service :", error);
        res.status(500).json({ success: false, message: "Erreur suppression service", error: error.message });
    }
};

// 📋 Liste de tous les services
const getAllServices = async (req, res) => {
    try {
        const snapshot = await db.collection("servicesSantes").get();

        const services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, data: services });
    } catch (error) {
        console.error("❌ Erreur récupération services :", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des services",
            error: error.message
        });
    }
};




// 🔍 Récupérer un service par ID
const getServiceById = async (req, res) => {
    try {
        const { idService } = req.params;
        const doc = await db.collection("servicesSantes").doc(idService).get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Service introuvable." });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Erreur récupération service :", error);
        res.status(500).json({ message: "Erreur lors de la récupération du service." });
    }
};



module.exports = {
    addService,
    updateService,
    deleteService,
    getAllServices,
    getServiceById
};

