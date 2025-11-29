const { db } = require("../config/firebaseConfig");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ➕ Ajouter un service de santé
const addService = async (req, res) => {
    try {
        console.log("\n===== 🔹 ADD SERVICE START =====");
        console.log("🔹 req.body:", JSON.stringify(req.body, null, 2));

        const {
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

        // Vérification champs obligatoires
        if (!nomEtablissement || latitude === undefined || longitude === undefined) {
            console.warn("⚠️ Champs obligatoires manquants :", { idService, nomEtablissement, latitude, longitude });
            return res.status(400).json({
                success: false,
                message: "Champs obligatoires manquants (idService, nomEtablissement, latitude, longitude)"
            });
        }

        // Vérifier si l'email existe déjà
        if (email) {
            const existingServiceSnapshot = await db.collection("servicesSantes")
                .where("email", "==", email)
                .get();
            
            if (!existingServiceSnapshot.empty) {
                console.warn("⚠️ Email déjà utilisé :", email);
                return res.status(400).json({
                    success: false,
                    message: "Un service avec cet email existe déjà"
                });
            }
        }
        const idService = uuidv4();

        // Hasher le mot de passe
        let hashed = "";
        if (motDePasse) {
            hashed = await bcrypt.hash(motDePasse, 10);
            console.log("🔹 Mot de passe hashé :", hashed);
        }

        const newService = {
            idService,
            nomEtablissement,
            email: email || "",
            motDePasse: hashed,
            telephone: telephone || "",
            typeEtablissement: typeEtablissement || "",
            adresse: adresse || "",
            ville: ville || "",
            latitude,
            longitude,
            heureOuverture: heureOuverture || "",
            heureFermeture: heureFermeture || "",
            ouvert24h: ouvert24h ?? false,
            description: description || "",
            photoProfil: photoProfil || "",
            distance: distance ?? null,
            isActive: isActive ?? true,
            dateCreation: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        console.log("🔹 Objet service à insérer :", JSON.stringify(newService, null, 2));

        await db.collection("servicesSantes").doc(idService).set(newService);

        console.log("✅ Service ajouté avec succès :", idService);
        console.log("===== 🔹 ADD SERVICE END =====\n");

        res.status(201).json({
            success: true,
            message: "Service de santé ajouté avec succès",
            data: newService
        });

    } catch (error) {
        console.error("❌ Erreur addService :", error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur lors de l'ajout du service",
            error: error.message
        });
    }
};




    const deleteAccountService = async (req, res) => {
        try {
            console.log("\n===== 🔴 SUPPRESSION COMPTE SERVICE =====");
    
            const idService = req.idService; // 🔐 récupéré depuis le JWT
    
            console.log("➡️ idService :", idService);
    
            const ref = db.collection("servicesSantes").doc(idService);
            const doc = await ref.get();
    
            if (!doc.exists) {
                return res.status(404).json({
                    success: false,
                    message: "Compte service introuvable"
                });
            }
    
            // 🔥 Supprimer urgences assignées à ce service
            const urgencesSnapshot = await db.collection("urgences")
                .where("idAssistant", "==", idService)
                .get();
    
            urgencesSnapshot.forEach(doc => doc.ref.delete());
    
            // 🔥 Supprimer messages envoyés par ce service
            const messagesSnapshot = await db.collection("messages")
                .where("senderId", "==", idService)
                .get();
    
            messagesSnapshot.forEach(doc => doc.ref.delete());
    
            // 🔥 Supprimer le compte service
            await ref.delete();
    
            console.log("✔ Compte service supprimé :", idService);
    
            return res.status(200).json({
                success: true,
                message: "Compte service supprimé avec succès"
            });
    
        } catch (error) {
            console.error("❌ Erreur suppression compte service :", error);
            return res.status(500).json({ success: false, message: "Erreur serveur" });
        }
    };
    

    const loginService = async (req, res) => {
        try {
            console.log("\n===== 🔵 LOGIN SERVICE =====");
    
            const { email, motDePasse } = req.body;
    
            if (!email || !motDePasse) {
                return res.status(400).json({ success: false, message: "Email et mot de passe requis" });
            }
    
            // Recherche du service par email
            const snapshot = await db.collection("servicesSantes").where("email", "==", email).get();
    
            if (snapshot.empty) {
                console.log("❌ Email service non trouvé");
                return res.status(404).json({ success: false, message: "Identifiants incorrects" });
            }
    
            const service = snapshot.docs[0].data();
    
            if (!service.motDePasse) {
                return res.status(500).json({ success: false, message: "Mot de passe non défini pour ce service" });
            }
    
            // Vérification du mot de passe
            const isMatch = await bcrypt.compare(motDePasse, service.motDePasse);
    
            if (!isMatch) {
                console.log("❌ Mot de passe incorrect");
                return res.status(401).json({ success: false, message: "Identifiants incorrects" });
            }
    
            // Génération du JWT
            const token = jwt.sign(
                { idService: service.idService },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
    
            // Récupérer les urgences assignées à ce service
            const urgencesSnapshot = await db.collection("urgences")
                .where("idAssistant", "==", service.idService)
                .get();
    
            const urgences = await Promise.all(
                urgencesSnapshot.docs.map(async doc => {
                    let urgence = doc.data();
    
                    // Messages liés à l'urgence
                    const messageSnapshot = await db.collection("messages")
                        .where("idUrgence", "==", urgence.idUrgence)
                        .orderBy("timestamp", "asc")
                        .get();
    
                    urgence.messages = messageSnapshot.docs.map(m => m.data());
    
                    // Patient lié à l'urgence
                    const patientSnapshot = await db.collection("patients")
                        .doc(urgence.idPatient)
                        .get();
    
                    urgence.patient = patientSnapshot.exists ? patientSnapshot.data() : null;
    
                    return urgence;
                })
            );
    
            
            const { motDePasse: _, ...serviceSafe } = service;
    
            console.log("===== ✅ LOGIN SERVICE RÉUSSI =====");
            console.log("🏥 Service :", service.nomEtablissement);
    
            res.status(200).json({
                success: true,
                message: "Connexion réussie",
                token,
                service: serviceSafe,
                urgences
            });
    
        } catch (error) {
            console.error("❌ Erreur loginService:", error);
            res.status(500).json({ success: false, message: "Erreur serveur" });
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
const getAllServices_proxy = async (req, res) => {
    console.log("================================================\n========================================\n=================================");

    console.log("position coord du patient : ", req.body)
    try {
        const snapshot = await db.collection("servicesSantes").get();

        const services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // console.log("\n\nn\n les services de sante retourner au font end : ", services)

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

const logoutService = async (req, res) => {
    try {
        console.log("\n===== 🔶 LOGOUT SERVICE =====");
        console.log("➡️ Déconnexion demandée à :", new Date().toISOString());

        return res.status(200).json({
            success: true,
            message: "Déconnecté avec succès. Veuillez supprimer le token côté client."
        });

    } catch (error) {
        console.error("❌ Erreur logoutService :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur durant la déconnexion"
        });
    }
};




const changePasswordService = async (req, res) => {

    console.log("\n\n========= 🔐 CHANGE PASSWORD SERVICE CALLED 🔐 =========");
    console.log("📥 Données reçues du frontend :", req.body);

    try {
        const { email, currentPassword, newPassword } = req.body;

        // Validation
        if (!email || !currentPassword || !newPassword) {
            console.log("⚠️ Champs manquants :", { email, currentPassword, newPassword });
            return res.status(400).json({ 
                success: false, 
                message: "Tous les champs sont requis" 
            });
        }

        console.log(`🔎 Recherche du service avec email: ${email}`);

        // Recherche Firestore
        const snapshot = await db.collection("servicesSantes")
            .where("email", "==", email)
            .get();

        console.log("📄 Résultat Firestore => snapshot.empty =", snapshot.empty);

        if (snapshot.empty) {
            console.log("❌ Aucun service trouvé avec cet email");
            return res.status(404).json({ 
                success: false, 
                message: "Service non trouvé" 
            });
        }

        const serviceDoc = snapshot.docs[0];
        const service = serviceDoc.data();

        console.log("📘 Service trouvé :", {
            email: service.email,
            motDePasse: service.motDePasse ? "HASH_PRESENT" : "UNDEFINED",
            lastUpdated: service.lastUpdated
        });

        if (!service.motDePasse) {
            
            return res.status(500).json({ 
                success: false, 
                message: "Mot de passe non défini pour ce service" 
            });
        }

        
        const passwordsToTest = ['Patient2025', 'Patient2026', 'patient2025', 'service123'];
        
        for (const testPassword of passwordsToTest) {
            const testMatch = await bcrypt.compare(testPassword, service.motDePasse);
        
        }
        

        // Vérification du mot de passe
        
        const isMatch = await bcrypt.compare(currentPassword, service.motDePasse);

        
        
        // ⚠️ BYPASS TEMPORAIRE - À SUPPRIMER EN PRODUCTION
        if (!isMatch) {
            
            
            
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Mise à jour Firestore
            await serviceDoc.ref.update({
                motDePasse: hashedNewPassword,
                lastUpdated: new Date().toISOString()
            });

            console.log(`✅ Mot de passe modifié avec succès pour ${email} (BYPASS MODE)`);

            return res.status(200).json({
                success: true,
                message: "Mot de passe modifié avec succès (mode bypass - temporaire)"
            });
        }
        // ⚠️ FIN BYPASS TEMPORAIRE

        // Hash du nouveau mot de passe
        console.log("🆕 Hash du nouveau mot de passe...");
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Mise à jour Firestore
        console.log("📤 Mise à jour du mot de passe dans Firestore...");
        await serviceDoc.ref.update({
            motDePasse: hashedNewPassword,
            lastUpdated: new Date().toISOString()
        });

        console.log(`✅ Mot de passe modifié avec succès pour ${email}`);

        return res.status(200).json({
            success: true,
            message: "Mot de passe modifié avec succès"
        });

    } catch (error) {
        console.error("❌ ERREUR SERVER DURING CHANGE PASSWORD:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur durant le changement du mot de passe"
        });
    }
};

module.exports = { changePasswordService };


module.exports = {
    deleteAccountService,
    logoutService,
    addService,
    loginService,
    updateService,
    deleteService,
    getAllServices_proxy,
    getServiceById,
    changePasswordService
};

