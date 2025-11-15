// socket/serviceSocket.js
const { db } = require("../config/firebaseConfig");
const { getIO } = require("../config/socketConfig");

module.exports = (socket) => {
    console.log(`🏥 [Socket] serviceSocket chargé pour ${socket.id}`);

    /**
     * ➕ Ajouter un service de santé
     */
    socket.on("addService", async (data) => {
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
            } = data;

            if (!idService || !nomEtablissement || !latitude || !longitude) {
                return socket.emit("addServiceError", {
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

            await db.collection("servicesSantes").doc(idService).set(newService);

            socket.emit("addServiceSuccess", {
                success: true,
                message: "Service ajouté avec succès",
                data: newService
            });

            console.log("✅ [Socket] Nouveau service ajouté :", nomEtablissement);
        } catch (error) {
            console.error("❌ Erreur ajout service :", error);
            socket.emit("addServiceError", {
                success: false,
                message: "Erreur lors de l'ajout du service",
                error: error.message
            });
        }
    });

    /**
     * 🔄 Mettre à jour un service
     */
    socket.on("updateService", async (data) => {
        try {
            const { idService, ...updateData } = data;

            if (!idService) {
                return socket.emit("updateServiceError", {
                    success: false,
                    message: "idService manquant"
                });
            }

            await db.collection("servicesSantes").doc(idService).update({
                ...updateData,
                lastUpdated: new Date().toISOString()
            });

            const io = getIO();

            // 🔹 Notifier uniquement les patients ayant des urgences liées à ce service
            const urgencesSnapshot = await db.collection("urgences")
                .where("idAssistant", "==", idService)
                .get();

            urgencesSnapshot.forEach(doc => {
                const urgence = doc.data();
                io.to(`urgence_${urgence.idUrgence}`).emit("service:updated", {
                    idService,
                    ...updateData,
                    message: "Les informations du service assigné à votre urgence ont été mises à jour"
                });
            });

            socket.emit("updateServiceSuccess", {
                success: true,
                message: "Votre compte a été mis à jour avec succès"
            });

            console.log(`🔄 [Socket] Service ${idService} mis à jour`);
        } catch (error) {
            console.error("❌ Erreur update service :", error);
            socket.emit("updateServiceError", {
                success: false,
                message: "Erreur mise à jour service",
                error: error.message
            });
        }
    });

    /**
     * ❌ Supprimer un service
     */
    socket.on("deleteService", async (idService) => {
        try {
            if (!idService) {
                return socket.emit("deleteServiceError", {
                    success: false,
                    message: "idService manquant"
                });
            }

            await db.collection("servicesSantes").doc(idService).delete();

            const io = getIO();

            // 🔹 Notifier uniquement les patients ayant des urgences liées à ce service
            const urgencesSnapshot = await db.collection("urgences")
                .where("idAssistant", "==", idService)
                .get();

            urgencesSnapshot.forEach(doc => {
                const urgence = doc.data();
                io.to(`urgence_${urgence.idUrgence}`).emit("service:deleted", {
                    idService,
                    message: "Le service assigné à votre urgence a été supprimé"
                });
            });

            socket.emit("deleteServiceSuccess", {
                success: true,
                message: "Votre compte a été supprimé avec succès"
            });

            console.log(`🗑️ [Socket] Service supprimé : ${idService}`);
        } catch (error) {
            console.error("❌ Erreur suppression service :", error);
            socket.emit("deleteServiceError", {
                success: false,
                message: "Erreur suppression service",
                error: error.message
            });
        }
    });

    /**
     * 📋 Récupérer tous les services
     */
    socket.on("getAllServices", async () => {
        try {
            const snapshot = await db.collection("servicesSantes").get();
            const services = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            socket.emit("getAllServicesSuccess", { success: true, data: services });
        } catch (error) {
            console.error("❌ Erreur récupération services :", error);
            socket.emit("getAllServicesError", {
                success: false,
                message: "Erreur lors de la récupération des services",
                error: error.message
            });
        }
    });

    /**
     * 🔍 Récupérer un service par ID
     */
    socket.on("getServiceById", async (idService) => {
        try {
            const doc = await db.collection("servicesSantes").doc(idService).get();

            if (!doc.exists) {
                return socket.emit("getServiceByIdError", {
                    message: "Service introuvable."
                });
            }

            socket.emit("getServiceByIdSuccess", { id: doc.id, ...doc.data() });
        } catch (error) {
            console.error("❌ Erreur récupération service :", error);
            socket.emit("getServiceByIdError", {
                message: "Erreur lors de la récupération du service."
            });
        }
    });
};


