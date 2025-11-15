// socket/patientSocket.js
const { db } = require("../config/firebaseConfig");
const { getIO } = require("../config/socketConfig");
const { v4: uuidv4 } = require("uuid");

module.exports = (socket) => {
    console.log(`🧑‍⚕️ [Socket] patientSocket chargé pour ${socket.id}`);

    /**
     * ➕ Ajouter un patient (création de compte)
     * Seuls les champs de base sont demandés : nom, prenom, email, telephone, adresse
     */
    socket.on("addPatient", async (data) => {
        try {
            const { nom, prenom, email, telephone, adresse } = data;

            if (!nom || !prenom || !email) {
                return socket.emit("addPatientError", {
                    success: false,
                    message: "Champs obligatoires manquants : nom, prenom, email"
                });
            }

            // Générer un idPatient unique
            const idPatient = uuidv4();

            const newPatient = {
                idPatient,
                nom,
                prenom,
                email,
                motDePasse: "", // peut être défini plus tard
                telephone: telephone || "",
                lieuResidence: adresse || "",
                numeroUrgence: "",
                photoProfil: "",
                groupeSanguin: "",
                taille: "",
                poids: "",
                maladieChronique: false,
                latitude: null,
                longitude: null,
                dateInscription: new Date().toISOString(),
                derniereMiseAJour: new Date().toISOString()
            };

            await db.collection("patients").doc(idPatient).set(newPatient);

            socket.emit("addPatientSuccess", {
                success: true,
                message: "Patient ajouté avec succès",
                data: newPatient
            });

            console.log(`✅ [Socket] Nouveau patient ajouté : ${nom} ${prenom}`);
        } catch (error) {
            console.error("❌ Erreur ajout patient :", error);
            socket.emit("addPatientError", {
                success: false,
                message: "Erreur ajout patient",
                error: error.message
            });
        }
    });

    /**
     * 🔄 Mise à jour patient
     */
    socket.on("updatePatient", async (data) => {
        try {
            const { idPatient, ...updateData } = data;

            if (!idPatient) {
                return socket.emit("updatePatientError", {
                    success: false,
                    message: "idPatient manquant"
                });
            }

            updateData.derniereMiseAJour = new Date().toISOString();

            await db.collection("patients").doc(idPatient).update(updateData);

            // 🔹 Notifier uniquement les services en relation avec les urgences du patient
            const snapshot = await db.collection("urgences").where("idPatient", "==", idPatient).get();
            const io = getIO();
            snapshot.docs.forEach(doc => {
                const urgence = doc.data();
                if (urgence.idService) {
                    io.to(`service_${urgence.idService}`).emit("patient:updated", { idPatient, ...updateData });
                }
            });

            socket.emit("updatePatientSuccess", {
                success: true,
                message: "Patient mis à jour avec succès",
                data: { idPatient, ...updateData }
            });

        } catch (error) {
            console.error("❌ Erreur mise à jour patient :", error);
            socket.emit("updatePatientError", {
                success: false,
                message: "Erreur mise à jour patient",
                error: error.message
            });
        }
    });

    socket.on("deletePatient", async (idPatient) => {
        try {
            if (!idPatient) {
                return socket.emit("deletePatientError", {
                    success: false,
                    message: "idPatient manquant"
                });
            }

            // 🔹 Notifier les services liés aux urgences avant suppression
            const snapshot = await db.collection("urgences").where("idPatient", "==", idPatient).get();
            const io = getIO();
            snapshot.docs.forEach(doc => {
                const urgence = doc.data();
                if (urgence.idService) {
                    io.to(`service_${urgence.idService}`).emit("patient:deleted", { idPatient });
                }
            });

            // Supprimer le patient
            await db.collection("patients").doc(idPatient).delete();

            socket.emit("deletePatientSuccess", {
                success: true,
                message: "Patient supprimé avec succès",
                idPatient
            });

        } catch (error) {
            console.error("❌ Erreur suppression patient :", error);
            socket.emit("deletePatientError", {
                success: false,
                message: "Erreur suppression patient",
                error: error.message
            });
        }
    });

    /**
     * 📋 Récupérer tous les patients
     */
    socket.on("getAllPatients", async () => {
        try {
            const snapshot = await db.collection("patients").get();
            const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            socket.emit("getAllPatientsSuccess", {
                success: true,
                data: patients
            });
        } catch (error) {
            console.error("❌ Erreur récupération patients :", error);
            socket.emit("getAllPatientsError", {
                success: false,
                message: "Erreur lors de la récupération des patients",
                error: error.message
            });
        }
    });
};
