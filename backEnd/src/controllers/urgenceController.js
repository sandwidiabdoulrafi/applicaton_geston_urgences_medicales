
const { db } = require("../config/firebaseConfig");
const { getIO } = require("../config/socketConfig");
const { v4: uuidv4 } = require("uuid");


//  Ajouter une urgence
const addUrgence = async (req, res) => {

    console.log("🟢 [http] Données reçues du front :", req.body);

    try {
        const { idPatient, idAssistant, intitule, description, statut, priorite, latitude, longitude } = req.body;

        // Vérification des champs obligatoires
        if (!idPatient || !intitule || !latitude || !longitude) {
            const error = {
                success: false,
                message: "Champs obligatoires manquants (idUrgence, idPatient, intitule, latitude, longitude)"
            };
            
            console.log("❌ [http] Validation échouée :", error.message);
            

            
            return res.status(400).json(error);
        }

        const idUrgence = uuidv4();

        const newUrgence = {
            idUrgence,
            idPatient,
            idAssistant: idAssistant || null,
            intitule,
            description: description || "",
            dateCreation: new Date().toISOString(),
            statut: statut || "en_attente",
            priorite: priorite || "normale",
            latitude,
            longitude
        };

        // Enregistrement dans Firestore
        const docRef = await db.collection("urgences").add(newUrgence);
        console.log("✅ [http] Nouvelle urgence ajoutée avec ID Firestore :", docRef.id);
        console.log("\n\n\n\n -=-=-==-=-=-=-=-==-=-=-==-= [http] Nouvelle urgence donner de l'urgence :", newUrgence);

        const result = {
            success: true,
            message: "Urgence ajoutée avec succès",
            data: { firestoreId: docRef.id, ...newUrgence }
        };

        // Émettre via Socket à tous les services de (sante sauf les pharmacie ) connectés


        const io = getIO();
        io.to('services_sante').emit("urgence:added", result.data)
        console.log("📡 [http] Événement 'urgence:added' émis à tous les clients");

        res.status(201).json(result);

    } catch (error) {
        console.error(" [http] Erreur lors de l'ajout de l'urgence :", error);
        
        const errorResponse = {
            success: false,
            message: "Erreur lors de l'ajout de l'urgence",
            error: error.message
        };


        res.status(500).json(errorResponse);
    }
};







//  Supprimer une urgence


const deleteUrgence = async (req, res) => {

    console.log("🔵 http urgence demandant suppresion :", req.body);

    try {
        const { idUrgence, idPatient } = req.body;

        if (!idUrgence || !idPatient) {

            console.log("ID urgence ou patient manquant" , idUrgence ," idPatient :  ", idPatient);
            return res.status(400).json({ success: false, message: "ID urgence ou patient manquant" });
        }

        // Récupérer l'urgence
        const urgencesQuery = await db.collection("urgences").where("idUrgence", "==", idUrgence).where("idPatient", "==", idPatient).get();
    

        if (urgencesQuery.empty) {

            console.log("Urgence non trouvée" , urgenceDoc.exists);
            return res.status(404).json({ success: false, message: "Urgence non trouvée" });
        }

         // Récupérer le premier document correspondant
         const urgenceDoc = urgencesQuery.docs[0]; // QueryDocumentSnapshot
         const urgenceData = urgenceDoc.data();     // Maintenant data() fonctionne
 

        // Vérifier que le patient est bien le propriétaire
        if (urgenceData.idPatient !== idPatient) {

            console.log('Vous ne pouvez supprimer que vos urgences');
            return res.status(403).json({ success: false, message: "Vous ne pouvez supprimer que vos urgences" });
        }

        // Supprimer l'urgence
        await db.collection("urgences").doc(idUrgence).delete();

        // Notifier le patient + service (si assigné)
        const io = getIO();
        io.to(`urgence_${idUrgence}`).emit("urgence:deleted", {
            idUrgence,
            message: "Cette urgence a été supprimée par le patient"
        });

        // Retirer de la liste globale des services
        io.to("services").emit("urgence:removed", { idUrgence });

        console.log('Vous avez supprimer l urgences');

        return res.status(200).json({ success: true, message: "Urgence supprimée avec succès", idUrgence });

    } catch (error) {
        console.error("❌ Erreur lors de la suppression :", error);
        
        return res.status(500).json({ success: false, message: "Erreur interne", error: error.message });
    }
};







// Mettre à jour une urgence
const updateUrgence = async (req, res) => {
    console.log("🔵 [http] Demande de mise à jour :", req.body);

    try {
        const { idUrgence, idPatient, ...data } = req.body;

        console.log(`Urgence id : ${idUrgence } idPatient : ${idPatient}\n\n\n`);

        if (!idUrgence || !idPatient) {
            const error = { success: false, message: "ID urgence ou ID patient manquant" };
            console.log("❌ [http] Validation échouée :", error.message);
            return res.status(400).json(error);
        }

        // Récupérer l'urgence
        const urgencesQuery = await db.collection("urgences")
            .where("idUrgence", "==", idUrgence)
            .where("idPatient", "==", idPatient)
            .get();

            console.log(`urgencesQuery : ${urgencesQuery } \n\n\n`);

        if (urgencesQuery.empty) {
            const error = { success: false, message: "Urgence non trouvée" };
            return res.status(404).json(error);
        }

        const urgenceDoc = urgencesQuery.docs[0]; 
        const urgenceData = urgenceDoc.data();

        // Vérifier que le patient est bien le propriétaire
        if (urgenceData.idPatient !== idPatient) {
            return res.status(403).json({ success: false, message: "Vous ne pouvez mettre à jour que vos urgences" });
        }
        
        // Mettre à jour l'urgence
        await db.collection("urgences").doc(urgenceDoc.id).update(data);


        console.log("✅ [http] Urgence mise à jour :", idUrgence);


        
        const result = { success: true, message: "Urgence mise à jour avec succès", data: { idUrgence, ...data } };
        const io = getIO();

        // 🔹 Notifier uniquement le patient + service assigné
        io.to(`urgence_${idUrgence}`).emit("urgence:updated", { idUrgence, ...data });

        // 🔹 Si le statut change et que l'urgence passe en cours, la retirer de la liste globale
        if (data.statut === "en_cours") {
            io.to("services").emit("urgence:removed", { idUrgence });
            console.log(`📡 Urgence ${idUrgence} retirée de la liste globale des services`);
        }

        res.status(200).json(result);

    } catch (error) {
        console.error("❌ [http] Erreur lors de la mise à jour :", error);

        const errorResponse = {
            success: false,
            message: "Erreur lors de la mise à jour",
            error: error.message
        };

        res.status(500).json(errorResponse);
    }
};















// 🚑 Service intervient sur une urgence
const serviceIntervient = async (req, res) => {
    console.log("🚑 [http] Service intervient sur urgence :", req.body);

    try {
        const { idUrgence, idService } = req.body;

        if (!idUrgence || !idService) {
            const error = { 
                success: false, 
                message: "idUrgence et idService sont obligatoires" 
            };
            console.log("❌ [http] Validation échouée :", error.message);
            return res.status(400).json(error);
        }

        // Récupérer l'urgence
        const urgenceDoc = await db.collection("urgences").doc(idUrgence).get();

        if (!urgenceDoc.exists) {
            const error = { success: false, message: "Urgence introuvable" };
            console.log("❌ [http] Urgence introuvable :", idUrgence);
            return res.status(404).json(error);
        }




        const urgenceData = urgenceDoc.data();

        // Vérifier si l'urgence est déjà prise en charge
        if (urgenceData.statut === "en cours" || urgenceData.statut === "termine") {
            const error = { 
                success: false, 
                message: "Cette urgence est déjà prise en charge ou terminée" 
            };
            console.log("⚠️ [http] Urgence déjà prise en charge :", idUrgence);
            return res.status(400).json(error);
        }

        // 🔹 Récupérer les infos du service depuis Firestore
        const serviceDoc = await db.collection("services").doc(idService).get();

        if (!serviceDoc.exists) {
            const error = { success: false, message: "Service introuvable" };
            console.log("❌ [http] Service introuvable :", idService);
            return res.status(404).json(error);
        }

        const serviceData = serviceDoc.data();

        // Mettre à jour l'urgence avec le service intervenant
        const updateData = {
            idAssistant: idService,
            statut: "en cours",
            dateIntervention: new Date().toISOString()
        };

        await db.collection("urgences").doc(idUrgence).update(updateData);
        console.log("✅ [http] Service a pris en charge l'urgence :", idUrgence);

        const resultData = { idUrgence, idService, ...updateData };
        const io = getIO();

        // 🔹 Notifier uniquement le patient + le service assigné
        io.to(`urgence_${idUrgence}`).emit("urgence:statusChanged", resultData);

        // 🔹 Retirer l'urgence de la liste d'attente globale des services
        io.to("services").emit("urgence:removed", { idUrgence });

        // 🔹 Créer une notification Firestore pour le patient
        const notification = {
            idPatient: urgenceData.idPatient,
            idUrgence,
            type: "intervention",
            titre: "Urgence prise en charge",
            message: `Votre urgence a été prise en charge par ${serviceData.nomEtablissement}`,
            timestamp: new Date().toISOString(),
            isRead: false,
            serviceInfo: {
                id: idService,
                nomEtablissement: serviceData.nomEtablissement,
                typeEtablissement: serviceData.typeEtablissement,
                telephone: serviceData.telephone,
                adresse: serviceData.adresse,
                ville: serviceData.ville,
                heureOuverture: serviceData.heureOuverture,
                heureFermeture: serviceData.heureFermeture,
                description: serviceData.description,
                photoProfil: serviceData.photoProfil,
                latitude: serviceData.latitude,
                longitude: serviceData.longitude
            }
        };

        await db.collection("notifications").add(notification);

        // 🔹 Émettre la notification en temps réel au patient
        io.to(`urgence_${idUrgence}`).emit("notification:new", notification);

        res.status(200).json({
            success: true,
            message: "Service a pris en charge l'urgence avec succès",
            data: resultData
        });

        console.log("📡 [http] Intervention notifiée patient + service, urgence retirée de la liste globale");

    } catch (error) {
        console.error("❌ [http] Erreur lors de l'intervention :", error);

        const errorResponse = {
            success: false,
            message: "Erreur lors de la prise en charge",
            error: error.message
        };

        // Notifier uniquement la room urgence concernée
        const io = getIO();
        if (req.body.idUrgence) {
            io.to(`urgence_${req.body.idUrgence}`).emit("urgence:error", errorResponse);
        }

        res.status(500).json(errorResponse);
    }
};




// 📋 Récupérer toutes les urgences de l'utilisateur 
const getAllUrgence = async (req, res) => {
    try {

        const snapshot = await db
            .collection("urgences")
            .where("statut", "==", "en_attente")
            .get();


        const urgences = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({
            success: true,
            message: "Urgences récupérées avec succès",
            data: urgences
        });

    } catch (error) {
        console.error("❌ Erreur lors de la récupération :", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des urgences",
            error: error.message
        });
    }
};










module.exports = { addUrgence, deleteUrgence, updateUrgence, getAllUrgence, serviceIntervient};













