


const { db } = require("../config/firebaseConfig");

const messageSocket = (socket) => {
    console.log("💬 [Socket] messageSocket chargé pour", socket.id);

    // ═══════════════════════════════════════════════════════════
    // RÉCEPTION D'UN MESSAGE (UNIVERSEL)
    // ═══════════════════════════════════════════════════════════
    socket.on("send_message", async (messageData) => {
        try {
            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📨 send_message - Données reçues:");
            console.log("   • ID Urgence:", messageData.idUrgence);
            console.log("   • Sender:", messageData.sender);
            console.log("   • Text:", messageData.text);
            console.log("   • Type:", messageData.type);
            console.log("   • Timestamp:", messageData.timestamp);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // ✅ Validation des données
            if (!messageData.idUrgence || !messageData.type || !messageData.sender) {
                console.error("❌ Champs obligatoires manquants");
                socket.emit("messageError", {
                    message: "Champs obligatoires manquants",
                    error: "idUrgence, type et sender sont requis"
                });
                return;
            }

            // ✅ Sauvegarder dans Firebase
            const docRef = await db.collection("messages").add({
                ...messageData,
                timestamp: messageData.timestamp || new Date().toISOString(),
                status: messageData.status || "envoye",
            });

            console.log(`✅ Document Firebase créé avec ID: ${docRef.id}\n`);

            // ✅ Préparer le message complet avec l'ID Firebase
            const completeMessage = {
                id: docRef.id,
                ...messageData,
                status: "envoye",
            };

            // ✅ Diffuser à TOUS les clients dans la room (SAUF l'émetteur)
            const roomName = `urgence_${messageData.idUrgence}`;
            console.log("📤 Diffusion du message à la room:", roomName);
            console.log("   • Message ID:", docRef.id);
            console.log("   • Texte:", messageData.text);
            
            socket.to(roomName).emit("receiveMessage", completeMessage);
            console.log("✅ Message diffusé à tous les clients de la room (sauf émetteur)");

            // ✅ Confirmer à l'émetteur que son message a été sauvegardé
            socket.emit("messageSuccess", {
                success: true,
                message: "Message ajouté avec succès.",
                data: completeMessage
            });

            
            console.log("✅ Confirmation envoyée à l'émetteur\n");

            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("✅ Traitement terminé avec succès");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

        } catch (error) {
            console.error("\n❌ Erreur lors du traitement du message:", error);
            socket.emit("messageError", {
                message: "Erreur lors de l'ajout du message",
                error: error.message
            });
        }
    });

    // ═══════════════════════════════════════════════════════════
    // MISE À JOUR DU STATUT D'UN MESSAGE
    // ═══════════════════════════════════════════════════════════
    socket.on("updateMessageStatus", async ({ idMessage, status, idUrgence }) => {
        try {
            console.log(`\n🔄 Mise à jour statut message ${idMessage} → ${status}`);

            const validStatus = ["envoi", "envoye", "erreur", "lu"];
            if (!validStatus.includes(status)) {
                console.error("❌ Statut invalide:", status);
                return;
            }

            await db.collection("messages").doc(idMessage).update({
                status,
                timestamp: new Date().toISOString(),
            });

            // Notifier tous les clients de la room
            socket.to(`urgence_${idUrgence}`).emit("message:statusChanged", {
                id: idMessage,
                status
            });

            console.log("✅ Statut mis à jour et diffusé\n");

        } catch (error) {
            console.error("❌ Erreur mise à jour statut:", error);
        }
    });

    // ═══════════════════════════════════════════════════════════
    // SUPPRESSION D'UN MESSAGE
    // ═══════════════════════════════════════════════════════════
    socket.on("deleteMessage", async ({ idMessage, idUrgence }) => {
        try {
            console.log(`\n🗑️ Suppression message ${idMessage}`);

            const doc = await db.collection("messages").doc(idMessage).get();
            if (!doc.exists) {
                console.error("❌ Message introuvable");
                return;
            }

            await db.collection("messages").doc(idMessage).delete();

            // Notifier tous les clients
            socket.to(`urgence_${idUrgence}`).emit("message:deleted", {
                id: idMessage
            });

            console.log("✅ Message supprimé et diffusé\n");

        } catch (error) {
            console.error("❌ Erreur suppression:", error);
        }
    });
};

module.exports = messageSocket;