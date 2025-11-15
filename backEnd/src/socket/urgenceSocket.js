// socket/urgenceSocket.js
const { v4: uuidv4 } = require("uuid");
const { getIO } = require("../config/socketConfig");
const { db } = require("../config/firebaseConfig");

module.exports = (socket) => {
    // 🆕 Créer une nouvelle urgence
    // socket.on("createUrgence", async (data) => {
    //     console.log("🚑 Nouvelle urgence reçue :", data);

    //     try {
    //         const idUrgence = uuidv4();
    //         const newUrgence = {
    //             idUrgence,
    //             ...data,
    //             statut: "en_attente",
    //             dateCreation: new Date().toISOString(),
    //         };

    //         // 🔹 Enregistrement dans Firebase
    //         await db.collection("urgences").doc(idUrgence).set(newUrgence);

    //         // 🔥 Notifier tous les services de santé
    //         const io = getIO();
    //         io.to("services_sante").emit("urgenceCreated", newUrgence);

    //         // ✅ Confirmer au patient
    //         socket.emit("urgenceCreatedSuccess", newUrgence);
    //         console.log("✅ Urgence créée avec succès :", newUrgence);
    //     } catch (error) {
    //         console.error("❌ Erreur lors de la création de l'urgence :", error);
    //         socket.emit("urgenceCreatedError", error.message);
    //     }
    // });

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

    // 🏥 Service intervient sur une urgence
    socket.on("serviceIntervient", async ({ idUrgence, idService }) => {
        console.log("🚑 [SOCKET] Service intervient sur l'urgence :", idUrgence, "service :", idService);

        try {
            const urgenceDoc = await db.collection("urgences").doc(idUrgence).get();
            if (!urgenceDoc.exists) {
                return socket.emit("serviceIntervientError", { success: false, message: "Urgence introuvable" });
            }

            const urgenceData = urgenceDoc.data();
            if (urgenceData.statut === "en_cours" || urgenceData.statut === "terminee") {
                return socket.emit("serviceIntervientError", { success: false, message: "Urgence déjà prise en charge ou terminée" });
            }

            const serviceDoc = await db.collection("services").doc(idService).get();
            if (!serviceDoc.exists) {
                return socket.emit("serviceIntervientError", { success: false, message: "Service introuvable" });
            }

            const serviceData = serviceDoc.data();

            const updateData = {
                idAssistant: idService,
                statut: "en_cours",
                dateIntervention: new Date().toISOString(),
            };

            await db.collection("urgences").doc(idUrgence).update(updateData);
            console.log("✅ [SOCKET] Service a pris en charge l'urgence :", idUrgence);

            const io = getIO();
            const resultData = {
                idUrgence,
                idService,
                ...updateData,
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
                    longitude: serviceData.longitude,
                },
            };

            io.to(`urgence_${idUrgence}`).emit("urgenceStatusChanged", resultData);
            io.to("services_sante").emit("urgenceRemoved", { idUrgence });

            // 🔔 Créer et envoyer notification au patient
            const notification = {
                idPatient: urgenceData.idPatient,
                idUrgence,
                type: "intervention",
                titre: "Urgence prise en charge",
                message: `Votre urgence a été prise en charge par ${serviceData.nomEtablissement}`,
                timestamp: new Date().toISOString(),
                isRead: false,
            };

            await db.collection("notifications").add(notification);
            io.to(`urgence_${idUrgence}`).emit("notificationNew", notification);

            console.log("📡 [SOCKET] Intervention notifiée patient + service, urgence retirée de la liste globale");
        } catch (error) {
            console.error("❌ [SOCKET] Erreur lors de l'intervention :", error);
            socket.emit("serviceIntervientError", { success: false, message: error.message });
        }
    });
};
