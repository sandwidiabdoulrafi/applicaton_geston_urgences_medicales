const { db } = require("../config/firebaseConfig");

const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Ajouter un patient
const addPatient = async (req, res) => {
    try {
        const {
            nom,
            prenom,
            email,
            motDePasse,
            telephone,
            lieuResidence,
            numeroUrgence,
            photoProfil,
            groupeSanguin,
            latitude,
            longitude,
            dateNaissance
        } = req.body;

        console.log(" req.body ", req.body);

        if (!nom || !prenom || !email || !motDePasse || !dateNaissance) {
            return res.status(400).json({
                success: false,
                message: "Champs obligatoires manquants (nom, prenom, email, motDePasse, dateNaissance)"
            });
        }

        // Vérifier si email existe déjà
        const existingPatientSnapshot = await db.collection("patients")
            .where("email", "==", email)
            .get();

        if (!existingPatientSnapshot.empty) {
            return res.status(400).json({
                success: false,
                message: "Un compte avec cet email existe déjà"
            });
        }
        const hashed = await bcrypt.hash(motDePasse, 10);

        const idPatient = uuidv4();

        const newPatient = {
            idPatient,
            nom,
            prenom,
            email,
            motDePasse:hashed, 
            dateNaissance,
            telephone: telephone || "",
            lieuResidence: lieuResidence || "",
            numeroUrgence: numeroUrgence || "",
            photoProfil: photoProfil || "",
            groupeSanguin: groupeSanguin || "",
            latitude: latitude || 0,
            longitude: longitude || 0,
            dateInscription: new Date().toISOString()
        };

        await db.collection("patients").doc(idPatient).set(newPatient);


        

        res.status(201).json({ success: true, message: "Patient ajouté avec succès",});

    } catch (error) {
        console.error("Erreur ajout patient :", error);
        res.status(500).json({ success: false, message: "Erreur ajout patient", error: error.message });
    }
};


const loginPatient = async (req, res) => {
    try {
        console.log("\n===== 🔵 LOGIN PATIENT =====");

        const { email, motDePasse } = req.body;

        if (!email || !motDePasse) {
            return res.status(400).json({ success: false, message: "Email et mot de passe requis" });
        }

        // Cherche le patient par email
        const snapshot = await db.collection("patients").where("email", "==", email).get();

        if (snapshot.empty) {
            console.log("❌ Email non trouvé");
            return res.status(404).json({ success: false, message: "Identifiants incorrects" });
        }

        const patient = snapshot.docs[0].data();

        if (!patient.motDePasse) {
            return res.status(500).json({ success: false, message: "Mot de passe non défini pour cet utilisateur" });
        }

        // Vérification du mot de passe
        const isMatch = await bcrypt.compare(motDePasse, patient.motDePasse);

        if (!isMatch) {
            console.log("❌ Mot de passe incorrect");
            return res.status(401).json({ success: false, message: "Identifiants incorrects" });
        }

        // Création du token JWT
        const token = jwt.sign({ idPatient: patient.idPatient }, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Récupération des urgences du patient
        const urgencesSnapshot = await db.collection("urgences").where("idPatient", "==", patient.idPatient).get();

        const urgences = await Promise.all(
            urgencesSnapshot.docs.map(async doc => {
                let urgence = doc.data();

                // Récupération des messages liés à l'urgence
                const messageSnapshot = await db.collection("messages")
                    .where("idUrgence", "==", urgence.idUrgence)
                    .get(); // Retrait de orderBy pour éviter l'erreur d'index

                // Tri des messages par timestamp côté serveur
                urgence.messages = messageSnapshot.docs
                    .map(m => m.data())
                    .sort((a, b) => a.timestamp - b.timestamp);

                // Récupération du service de santé lié
                if (urgence.idAssistant) {
                    const serviceSnapshot = await db.collection("servicesSantes")
                        .doc(urgence.idAssistant)
                        .get();
                    urgence.serviceSante = serviceSnapshot.exists ? serviceSnapshot.data() : null;
                } else {
                    urgence.serviceSante = null;
                }

                return urgence;
            })
        );

        // Supprime le mot de passe pour ne pas l'envoyer dans la réponse
        const { motDePasse: _, ...patientSafe } = patient;

        console.log("===== ✅ LOGIN RÉUSSI =====");
        console.log("👤 Patient :", patient.nom, patient.prenom);

        res.status(200).json({
            success: true,
            message: "Connexion réussie",
            token,
            patient: patientSafe,
            urgences
        });

    } catch (error) {
        console.error("❌ Erreur loginPatient:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};














const logoutPatient = async (req, res) => {
    try {
        console.log("\n===== 🔶 LOGOUT PATIENT =====");
        console.log("➡️ Déconnexion demandée à :", new Date().toISOString());

        return res.status(200).json({
            success: true,
            message: "Déconnecté avec succès. Veuillez supprimer le token côté client."
        });

    } catch (error) {
        console.error("❌ Erreur logoutPatient :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur durant la déconnexion"
        });
    }
};






// Suppression

const deleteAccountPatient = async (req, res) => {
    try {
        console.log("\n===== 🔴 SUPPRESSION COMPTE PATIENT =====");

        const idPatient = req.idPatient;

        console.log("➡️ idPatient :", idPatient);

        const ref = db.collection("patients").doc(idPatient);
        const doc = await ref.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: "Compte introuvable"
            });
        }

        // 🔥 Supprimer urgences
        const urgencesSnapshot = await db.collection("urgences")
            .where("idPatient", "==", idPatient)
            .get();

        urgencesSnapshot.forEach(doc => doc.ref.delete());

        // 🔥 Supprimer messages
        const messagesSnapshot = await db.collection("messages")
            .where("senderId", "==", idPatient)
            .get();

        messagesSnapshot.forEach(doc => doc.ref.delete());

        // 🔥 Supprimer compte patient
        await ref.delete();

        console.log("✔ Compte supprimé :", idPatient);

        return res.status(200).json({
            success: true,
            message: "Compte supprimé avec succès"
        });

    } catch (error) {
        console.error("❌ Erreur suppression patient :", error);
        return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};




const updatePatient = async (req, res) => {
    try {
        let { idPatient, ...newData } = req.body;
        console.log("📤 Requête reçue pour update patient :", req.body);

        // Si newData contient un champ "data", on le déstructure
        if (newData.data) {
            newData = { ...newData.data };
        }

        
        

        if (!idPatient) {
            console.warn("⚠️ idPatient manquant !");
            return res.status(400).json({
                success: false,
                message: "idPatient est obligatoire"
            });
        }

        const docRef = db.collection("patients").doc(idPatient);
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            console.warn("⚠️ Patient introuvable :", idPatient);
            return res.status(404).json({
                success: false,
                message: "Patient introuvable"
            });
        }

        const oldData = snapshot.data();
        

        // Filtrer newData pour ne garder que les champs définis et non vides
        const filteredNewData = Object.fromEntries(
            Object.entries(newData).filter(([key, value]) => value !== undefined && value !== null && value !== "")
        );

        
        // Fusionner les données
        const mergedData = {
            ...oldData,
            ...filteredNewData,
            derniereMiseAJour: new Date().toISOString()
        };

        // Mise à jour Firestore
        await docRef.set(mergedData, { merge: true });

        console.log("✅ Patient mis à jour avec succès :", idPatient);

        return res.status(200).json({
            success: true,
            message: "Patient mis à jour avec succès",
            data: mergedData
        });

    } catch (error) {
        console.error("❌ Erreur backend updatePatient :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur mise à jour",
            error: error.message
        });
    }
};




const changePasswordPatient = async (req, res) => {
    console.log("\n\n========= 🔐 CHANGE PASSWORD PATIENT CALLED 🔐 =========");
    console.log("📥 Données reçues :", req.body);

    try {
        let { email, currentPassword, newPassword } = req.body;

        // Validation
        if (!email || !currentPassword || !newPassword) {
            console.warn("⚠️ Champs manquants :", { email, currentPassword, newPassword });
            return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
        }

        // Normalisation de l'email
        email = email.trim().toLowerCase();
        console.log("🔎 Recherche du patient avec email normalisé :", email);

        const snapshot = await db.collection("patients")
            .where("email", "==", email)
            .get();

        console.log("📄 Résultat Firestore => snapshot.empty =", snapshot.empty);

        if (snapshot.empty) {
            console.warn("❌ Aucun patient trouvé avec cet email. Liste des patients pour debug :");
            const allPatients = await db.collection("patients").get();
            allPatients.forEach(doc => console.log(doc.data()));
            return res.status(404).json({ success: false, message: "Patient non trouvé" });
        }

        const patientDoc = snapshot.docs[0];
        const patient = patientDoc.data();

        console.log("📘 Patient trouvé :", {
            email: patient.email,
            motDePasse: patient.motDePasse ? "HASH_PRESENT" : "UNDEFINED",
            derniereMiseAJour: patient.derniereMiseAJour
        });

        if (!patient.motDePasse) {
            return res.status(500).json({ success: false, message: "Mot de passe non défini" });
        }

        const isMatch = await bcrypt.compare(currentPassword, patient.motDePasse);
        if (!isMatch) {
            console.warn("❌ Mot de passe actuel incorrect pour :", email);
            return res.status(400).json({ success: false, message: "Mot de passe actuel incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        console.log("📤 Mise à jour du mot de passe...");
        await patientDoc.ref.update({
            motDePasse: hashedNewPassword,
            derniereMiseAJour: new Date().toISOString()
        });

        console.log(`✅ Mot de passe modifié avec succès pour ${email}`);
        return res.status(200).json({ success: true, message: "Mot de passe modifié avec succès" });

    } catch (error) {
        console.error("❌ ERREUR SERVER DURING CHANGE PASSWORD PATIENT:", error);
        return res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    }
};



// Liste patients
const getAllPatients = async (req, res) => {
    try {
        const snapshot = await db.collection("patients").get();
        const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, data: patients });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur récupération patients", error: error.message });
    }
};


const getPatientsForUrgence = async (req, res) => {
    console.log("📌 Début getPatientsForUrgence");
    console.log("📥 Requête reçue :", req.query);
    
    try {
        const { idUrgence } = req.query; // optionnel : si fourni, filtre les patients liés à cette urgence
        console.log("🔹 idUrgence :", idUrgence);
    
        let patientsSnapshot;
        let patients = [];
    
        if (idUrgence) {
            console.log("🔎 Recherche de l'urgence avec ID :", idUrgence);
            const urgenceDoc = await db.collection("urgences").doc(idUrgence).get();
    
            if (!urgenceDoc.exists) {
                console.warn("⚠️ Urgence introuvable :", idUrgence);
                return res.status(404).json({
                    success: false,
                    message: "Urgence introuvable"
                });
            }
    
            const urgenceData = urgenceDoc.data();
            console.log("✅ Urgence trouvée :", urgenceData);
    
            const patientId = urgenceData.idPatient;
            console.log("🔹 ID du patient lié :", patientId);
    
            const patientDoc = await db.collection("patients").doc(patientId).get();
            if (!patientDoc.exists) {
                console.warn("⚠️ Patient lié à l'urgence introuvable :", patientId);
                return res.status(404).json({
                    success: false,
                    message: "Patient lié à l'urgence introuvable"
                });
            }
    
            const patientData = { id: patientDoc.id, ...patientDoc.data() };
            console.log("✅ Patient récupéré :", patientData);
            patients.push(patientData);
    
        } else {
            console.log("🔎 Récupération de tous les patients");
            patientsSnapshot = await db.collection("patients").get();
            patients = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`✅ ${patients.length} patients récupérés`);
        }
    
        console.log("📤 Envoi des données au client");
        return res.status(200).json({
            success: true,
            message: "Patients récupérés avec succès",
            data: patients
        });
    
    } catch (error) {
        console.error("❌ Erreur getPatientsForUrgence :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
    
    };



module.exports = {
    deleteAccountPatient,
    logoutPatient,
    loginPatient,
    addPatient,
    updatePatient,
    getAllPatients,
    changePasswordPatient,
    getPatientsForUrgence
};

