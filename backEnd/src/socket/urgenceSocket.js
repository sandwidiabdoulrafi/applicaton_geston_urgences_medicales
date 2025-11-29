// socket/urgenceSocket.js
const { v4: uuidv4 } = require("uuid");
const { getIO } = require("../config/socketConfig");
const { db } = require("../config/firebaseConfig");

module.exports = (socket) => {

    // 🗑️ Supprimer une urgence
    socket.on("deleteUrgence", async ({ idUrgence, idPatient }) => {
        console.log("🔵 [SOCKET] Demande de suppression de l'urgence :", idUrgence, "par le patient :", idPatient);

        try {
            if (!idUrgence || !idPatient) {
                return socket.emit("deleteUrgenceError", { success: false, message: "ID urgence ou patient manquant" });
            }

            const urgenceDoc = await db.collection("urgences").doc(idUrgence).get();
            if (!urgenceDoc.exists) {
                return socket.emit("deleteUrgenceError", { success: false, message: "Urgence non trouvée" });
            }

            const urgenceData = urgenceDoc.data();
            if (urgenceData.idPatient !== idPatient) {
                return socket.emit("deleteUrgenceError", { success: false, message: "Vous ne pouvez supprimer que vos urgences" });
            }

            await db.collection("urgences").doc(idUrgence).delete();

            const io = getIO();
            io.to(`urgence_${idUrgence}`).emit("urgenceDeleted", {
                idUrgence,
                message: "Cette urgence a été supprimée par le patient",
            });

            io.to("services_sante").emit("urgenceRemoved", { idUrgence });

            socket.emit("deleteUrgenceSuccess", {
                success: true,
                message: "Urgence supprimée avec succès",
                idUrgence,
            });

            console.log("✅ [SOCKET] Urgence supprimée :", idUrgence);
        } catch (error) {
            console.error("❌ Erreur lors de la suppression :", error);
            socket.emit("deleteUrgenceError", { success: false, message: error.message });
        }
    });

    // ✏️ Mettre à jour une urgence
    socket.on("updateUrgence", async (data) => {
        console.log("🔵 [SOCKET] Demande de mise à jour :", data);
        const { idUrgence, idPatient } = data;

        try {
            if (!idUrgence || !idPatient) {
                return socket.emit("updateUrgenceError", { success: false, message: "ID urgence ou patient manquant" });
            }

            const urgenceDoc = await db.collection("urgences").doc(idUrgence).get();
            if (!urgenceDoc.exists) {
                return socket.emit("updateUrgenceError", { success: false, message: "Urgence non trouvée" });
            }

            const urgenceData = urgenceDoc.data();
            if (urgenceData.idPatient !== idPatient) {
                return socket.emit("updateUrgenceError", { success: false, message: "Vous ne pouvez modifier que vos urgences" });
            }

            await db.collection("urgences").doc(idUrgence).update(data);
            console.log("✅ [SOCKET] Urgence mise à jour :", idUrgence);

            const io = getIO();
            io.to(`urgence_${idUrgence}`).emit("urgenceUpdated", { idUrgence, ...data });

            // 🔹 Si le statut change et que l'urgence passe "en_cours", la retirer de la liste globale
            if (data.statut === "en_cours") {
                io.to("services_sante").emit("urgenceRemoved", { idUrgence });
            }

            socket.emit("updateUrgenceSuccess", { success: true, idUrgence });
        } catch (error) {
            console.error("❌ [SOCKET] Erreur lors de la mise à jour :", error);
            socket.emit("updateUrgenceError", { success: false, message: error.message });
        }
    });












// 🏥 Service intervient sur une urgence - VERSION OPTIMISÉE
socket.on("serviceIntervient", async ({ idUrgence, idService }) => {
    console.log(`🚑 Service ${idService} intervient sur urgence ${idUrgence}`);

    try {
        // 1️⃣ Récupérer l'urgence
        const urgenceQuery = await db
            .collection("urgences")
            .where("idUrgence", "==", idUrgence)
            .limit(1)
            .get();

        if (urgenceQuery.empty) {
            return socket.emit("serviceIntervientError", { 
                success: false, 
                message: "Urgence introuvable" 
            });
        }

        const urgenceDoc = urgenceQuery.docs[0];
        const urgenceData = urgenceDoc.data();

        // 2️⃣ Vérifier le statut
        if (["en_cours", "terminee"].includes(urgenceData.statut)) {
            return socket.emit("serviceIntervientError", { 
                success: false, 
                message: "Urgence déjà prise en charge ou terminée" 
            });
        }

        // 3️⃣ Récupérer le service de santé
        const serviceQuery = await db
            .collection("servicesSantes")
            .where("idService", "==", idService)
            .select(
                "idService", "nomEtablissement", "email", "telephone",
                "typeEtablissement", "adresse", "ville", "latitude", 
                "longitude", "heureOuverture", "heureFermeture", 
                "ouvert24h", "description", "photoProfil", "isActive"
            )
            .limit(1)
            .get();

        if (serviceQuery.empty) {
            return socket.emit("serviceIntervientError", { 
                success: false, 
                message: "Service introuvable" 
            });
        }

        const serviceData = serviceQuery.docs[0].data();

        // 4️⃣ Récupérer les infos du patient (AVANT la mise à jour)
        const patientQuery = await db
            .collection("patients")
            .where("idPatient", "==", urgenceData.idPatient)
            .select(
                "idPatient","dateNaissance", "email", "groupeSanguin", "lieuResidence",
                "maladieChronique", "nom", "numeroUrgence", "photoProfil",
                "poids", "prenom", "role", "taille", "telephone"
            )
            .limit(1)
            .get();

        if (patientQuery.empty) {
            console.warn(`⚠️ Patient ${urgenceData.idPatient} introuvable`);
            // Continuer quand même, mais avec infos limitées
        }

        const patientData = patientQuery.empty ? null : patientQuery.docs[0].data();

        // 5️⃣ Mettre à jour l'urgence en base
        const now = new Date().toISOString();
        const updateData = {
            idAssistant: idService,
            statut: "en_cours",
            dateIntervention: now,
        };

        await db.collection("urgences").doc(urgenceDoc.id).update(updateData);

        // 6️⃣ Préparer les données complètes
        const io = getIO();
        const interventionData = {
            idUrgence,
            idService,
            ...updateData,
            serviceInfo: serviceData,
        };

        // 7️⃣ Créer la notification
        const notification = {
            idPatient: urgenceData.idPatient,
            idUrgence,
            type: "intervention",
            titre: "Urgence prise en charge",
            message: `Votre urgence a été prise en charge par ${serviceData.nomEtablissement}`,
            timestamp: now,
            isRead: false,
        };

        await db.collection("notifications").add(notification);


        // ═══════════════════════════════════════════════════════════
        // ÉMISSIONS ORGANISÉES PAR DESTINATION
        // ═══════════════════════════════════════════════════════════

        // 1️⃣ Pour la page index.tsx (liste d'attente)
        // → Retirer l'urgence de la liste
        io.to(`service_${idService}`).emit("removeUrgenceFromList", idUrgence);
        console.log(`📤 removeUrgenceFromList → service_${idService} : ${idUrgence}`);

        // 2️⃣ Pour le modal DetailUrgence.jsx
        // → Confirmer la prise en charge et fermer le modal
        io.to(`service_${idService}`).emit("succesAdd", idUrgence);
        console.log(`📤 succesAdd → service_${idService} : ${idUrgence}`);

        // 3️⃣ Pour le Layout (ServiceUrgenceLayout.tsx)
        // → Sauvegarder l'urgence comme "urgence en cours"
        io.to(`service_${idService}`).emit("urgenceStatusChanged", updateData);
        console.log(`📤 urgenceStatusChanged → service_${idService}`);

        // 4️⃣ Informations du patient pour le service
        if (patientData) {
            io.to(`service_${idService}`).emit("patientInfoForService", patientData);
        }

        // Envoyer au patient 

        io.to(`patient_${interventionData.idPatient}`).emit("urgenceAccepteByService", interventionData);
        console.log(`📤 urgenceAccepteByService → patient_${interventionData.idPatient}`);

        // 5️⃣ Retirer de la room globale des services disponibles
        io.to("services_sante").emit("urgenceRemoved", { idUrgence });



        console.log(`✅ Intervention réussie: ${idService} → ${idUrgence}`);

    } catch (error) {
        console.error("❌ Erreur intervention:", error.message);
        socket.emit("serviceIntervientError", { 
            success: false, 
            message: error.message 
        });
    }
});

// // 📌 Note : Assurez-vous que le service s'abonne à sa room lors de la connexion
// socket.on("serviceConnected", ({ idService }) => {
//     socket.join(`service_${idService}`);
//     console.log(`✅ Service ${idService} connecté à sa room`);
// });
    
};














