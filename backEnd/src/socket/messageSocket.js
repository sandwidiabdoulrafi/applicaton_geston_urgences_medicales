// socket/messageSocket.js
const { db } = require("../config/firebaseConfig");
const { getIO } = require("../config/socketConfig");

module.exports = (socket) => {
    console.log(`💬 [Socket] messageSocket chargé pour ${socket.id}`);

    /**
     * ➕ Ajouter un nouveau message
     */
    socket.on("newMessage", async (newMessage) => {
        try {
            if (!newMessage.idUrgence || !newMessage.type || !newMessage.sender) {
                return socket.emit("newMessageError", { message: "Champs obligatoires manquants." });
            }

            const validTypes = ["text", "image", "video", "document", "audio"];
            const validSenders = ["patient", "assistant"];

            if (!validTypes.includes(newMessage.type)) {
                return socket.emit("newMessageError", { message: "Type de message invalide." });
            }

            if (!validSenders.includes(newMessage.sender)) {
                return socket.emit("newMessageError", { message: "Sender invalide." });
            }

            const timestamp = new Date().toISOString();

            const docRef = await db.collection("messages").add({
                ...newMessage,
                timestamp,
                status: newMessage.status || "envoi",
            });

            const messageData = {
                id: docRef.id,
                ...newMessage,
                timestamp,
                status: newMessage.status || "envoi",
            };

            // 🔹 Diffuser le message à la salle de l'urgence (patient + service de santé)
            const io = getIO();
            io.to(`urgence_${newMessage.idUrgence}`).emit("message:new", messageData);

            // 🔸 Confirmer au client émetteur
            socket.emit("newMessageSuccess", {
                success: true,
                message: "Message ajouté avec succès.",
                data: messageData,
            });

            console.log(`📩 Message ajouté pour urgence_${newMessage.idUrgence}`);
        } catch (error) {
            console.error("Erreur ajout message :", error);
            socket.emit("newMessageError", { message: "Erreur lors de l'ajout du message." });
        }
    });

    /**
     * 📥 Récupérer les messages d’une urgence
     */
    socket.on("getMessagesByUrgence", async (idUrgence) => {
        try {
            const snapshot = await db
                .collection("messages")
                .where("idUrgence", "==", idUrgence)
                .orderBy("timestamp", "asc")
                .get();

            const messages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            socket.emit("getMessagesByUrgenceSuccess", messages);
        } catch (error) {
            console.error("Erreur récupération messages :", error);
            socket.emit("getMessagesByUrgenceError", {
                message: "Erreur lors de la récupération des messages.",
            });
        }
    });

    /**
     * 🔄 Mettre à jour le statut d’un message
     */
    socket.on("updateMessageStatus", async ({ idMessage, status }) => {
        try {
            const validStatus = ["envoi", "envoye", "erreur", "lu"];
            if (!validStatus.includes(status)) {
                return socket.emit("updateMessageStatusError", { message: "Statut invalide." });
            }

            const docRef = db.collection("messages").doc(idMessage);
            const doc = await docRef.get();

            if (!doc.exists) {
                return socket.emit("updateMessageStatusError", { message: "Message introuvable." });
            }

            const idUrgence = doc.data().idUrgence;

            await docRef.update({
                status,
                timestamp: new Date().toISOString(),
            });

            // Notifier uniquement la salle concernée
            const io = getIO();
            io.to(`urgence_${idUrgence}`).emit("message:statusChanged", { id: idMessage, status });

            socket.emit("updateMessageStatusSuccess", {
                success: true,
                message: "Statut mis à jour.",
                data: { id: idMessage, status },
            });
        } catch (error) {
            console.error("Erreur mise à jour message :", error);
            socket.emit("updateMessageStatusError", {
                message: "Erreur lors de la mise à jour du message.",
            });
        }
    });

    /**
     * 🗑️ Supprimer un message
     */
    socket.on("deleteMessage", async (idMessage) => {
        try {
            const docRef = db.collection("messages").doc(idMessage);
            const doc = await docRef.get();

            if (!doc.exists) {
                return socket.emit("deleteMessageError", { message: "Message introuvable." });
            }

            const idUrgence = doc.data().idUrgence;
            await docRef.delete();

            // Informer uniquement la salle liée
            const io = getIO();
            io.to(`urgence_${idUrgence}`).emit("message:deleted", { id: idMessage });

            socket.emit("deleteMessageSuccess", {
                success: true,
                message: "Message supprimé avec succès.",
            });
        } catch (error) {
            console.error("Erreur suppression message :", error);
            socket.emit("deleteMessageError", {
                message: "Erreur lors de la suppression du message.",
            });
        }
    });
};









// socket.on("newMessage", async (data) => {
//     try{

//     }catch(error){

//     }
// });


// socket.on("newMessage", async (data) => {
//     try{

//     }catch(error){

//     }
// });
