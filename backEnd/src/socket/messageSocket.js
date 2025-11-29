// socket/messageSocket.js
const { db, bucket } = require("../config/firebaseConfig");
const { getIO } = require("../config/socketConfig");

module.exports = (socket) => {
    console.log(`💬 [Socket] messageSocket chargé pour ${socket.id}`);

    /**
     * ➕ Ajouter un nouveau message
     */
    
    
    socket.on("message:add", async (newMessage) => {
        console.log(`📨 [message:add] Données reçues:`, newMessage);

        try {
            // ✅ Validation des champs obligatoires
            if (!newMessage.idUrgence || !newMessage.type || !newMessage.sender) {
                return socket.emit("message:error", { 
                    message: "Champs obligatoires manquants.",
                    field: !newMessage.idUrgence ? 'idUrgence' : !newMessage.type ? 'type' : 'sender'
                });
            }

            const validTypes = ["text", "image", "video", "document", "audio"];
            const validSenders = ["patient", "assistant"];

            if (!validTypes.includes(newMessage.type)) {
                return socket.emit("message:error", { 
                    message: `Type de message invalide: ${newMessage.type}. Types valides: ${validTypes.join(', ')}` 
                });
            }

            if (!validSenders.includes(newMessage.sender)) {
                return socket.emit("message:error", { 
                    message: `Sender invalide: ${newMessage.sender}. Valeurs valides: ${validSenders.join(', ')}` 
                });
            }

            // ✅ Ajouter timestamp côté serveur (plus fiable)
            const timestamp = new Date().toISOString();

            // ✅ Sauvegarder dans Firebase
            const docRef = await db.collection("messages").add({
                idUrgence: newMessage.idUrgence,
                type: newMessage.type,
                sender: newMessage.sender,
                text: newMessage.text || null,
                uri: newMessage.uri || null,
                fileName: newMessage.fileName || null,
                duration: newMessage.duration || null,
                timestamp,
                status: "envoye", 
            });

            // ✅ Message complet avec ID Firebase
            const messageData = {
                idMessage: docRef.id,
                idUrgence: newMessage.idUrgence,
                type: newMessage.type,
                sender: newMessage.sender,
                text: newMessage.text || null,
                uri: newMessage.uri || null,
                fileName: newMessage.fileName || null,
                duration: newMessage.duration || null,
                timestamp,
                status: "envoye",
            };

            // 🔹 Diffuser à TOUTE la salle de l'urgence
            const io = getIO();
            io.to(`urgence_${newMessage.idUrgence}`).emit("message:new", messageData);

            // 🔸 Confirmer au client émetteur
            socket.emit("message:success", {
                success: true,
                message: "Message ajouté avec succès.",
                data: messageData,
            });

            console.log(`\n\n\n\n\n\n =-=-=-=-=-=-=-=-=-=-=-=-=-==Les data inscrit sont :  `, messageData);

            console.log(`✅ Message ajouté: ${docRef.id} pour urgence_${newMessage.idUrgence}`);
        } catch (error) {
            console.error("❌ Erreur ajout message:", error);
            socket.emit("message:error", { 
                message: "Erreur lors de l'ajout du message.",
                error: error.message 
            });
        }
    });

    /**
     * 📥 Récupérer les messages d’une urgence
     */
    socket.on("message:getByUrgence", async (idUrgence) => {
        console.log(`📥 [message:getByUrgence] idUrgence:`, idUrgence);

        try {
            const snapshot = await db
                .collection("messages")
                .where("idUrgence", "==", parseInt(idUrgence))
                .orderBy("timestamp", "asc")
                .get();

            const messages = snapshot.docs.map((doc) => ({
                idMessage: doc.id,
                ...doc.data(),
            }));

            socket.emit("message:list", messages);
            console.log(`✅ ${messages.length} messages récupérés pour urgence ${idUrgence}`);
        } catch (error) {
            console.error("❌ Erreur récupération messages:", error);
            socket.emit("message:error", {
                message: "Erreur lors de la récupération des messages.",
                error: error.message
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

    socket.on("message:updateStatus", async ({ idMessage, status }) => {
        console.log(`🔄 [message:updateStatus] ${idMessage} -> ${status}`);

        try {
            const validStatus = ["envoi", "envoye", "erreur", "lu"];
            if (!validStatus.includes(status)) {
                return socket.emit("message:error", { 
                    message: `Statut invalide: ${status}. Valeurs valides: ${validStatus.join(', ')}` 
                });
            }

            const docRef = db.collection("messages").doc(idMessage);
            const doc = await docRef.get();

            if (!doc.exists) {
                return socket.emit("message:error", { message: "Message introuvable." });
            }

            const idUrgence = doc.data().idUrgence;

            await docRef.update({ status });

            // Notifier toute la salle
            const io = getIO();
            io.to(`urgence_${idUrgence}`).emit("message:statusChanged", { 
                idMessage, 
                status 
            });

            socket.emit("message:success", {
                success: true,
                message: "Statut mis à jour.",
                data: { idMessage, status },
            });

            console.log(`✅ Statut mis à jour: ${idMessage} -> ${status}`);
        } catch (error) {
            console.error("❌ Erreur mise à jour message:", error);
            socket.emit("message:error", {
                message: "Erreur lors de la mise à jour du message.",
                error: error.message
            });
        }
    });

    /**
     * 🗑️ Supprimer un message
     */

    socket.on("message:delete", async (data) => {
        const idMessage = data.idMessage || data;
        console.log(`🗑️  [message:delete] idMessage:`, idMessage);

        try {
            const docRef = db.collection("messages").doc(idMessage);
            const doc = await docRef.get();

            if (!doc.exists) {
                return socket.emit("message:error", { message: "Message introuvable." });
            }

            const messageData = doc.data().idUrgence;
            const id = messageData.idUrgence ; 



            if (messageData.fileUrl && messageData.type !== 'text') {
                try {
                    const fileName = messageData.fileUrl.split('/').pop().split('?')[0];
                    const filePath = `messages/${idUrgence}/${decodeURIComponent(fileName)}`;
                    await bucket.file(filePath).delete();
                    console.log(`🗑️  Fichier supprimé: ${filePath}`);
                } catch (fileError) {
                    console.error("⚠️  Erreur suppression fichier:", fileError.message);
                }
            }


            await docRef.delete();

            // Informer toute la salle
            const io = getIO();
            io.to(`urgence_${idUrgence}`).emit("message:deleted", idMessage);

            socket.emit("message:success", {
                success: true,
                message: "Message supprimé avec succès.",
                data: { idMessage }
            });

            console.log(`✅ Message supprimé: ${idMessage}`);
        } catch (error) {
            console.error("❌ Erreur suppression message:", error);
            socket.emit("message:error", {
                message: "Erreur lors de la suppression du message.",
                error: error.message
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
