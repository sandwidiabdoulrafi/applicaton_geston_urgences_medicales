// const { db } = require("../config/firebaseConfig");

// // ➕ Ajouter un message
// const addMessage = async (req, res) => {
//     try {
//         const newMessage = req.body;

//         // Vérification basique des champs obligatoires
//         if (!newMessage.idUrgence || !newMessage.type || !newMessage.sender) {
//             return res.status(400).json({ message: "Champs obligatoires manquants." });
//         }

//         // Vérification des valeurs valides
//         const validTypes = ["text", "image", "video", "document", "audio"];
//         const validSenders = ["patient", "assistant"];
//         const validStatus = ["envoi", "envoye", "erreur", "lu"];

//         if (!validTypes.includes(newMessage.type)) {
//             return res.status(400).json({ message: "Type de message invalide." });
//         }

//         if (!validSenders.includes(newMessage.sender)) {
//             return res.status(400).json({ message: "Sender invalide." });
//         }

//         const ref = await db.collection("messages").add({
//             ...newMessage,
//             timestamp: new Date().toISOString(),
//             status: newMessage.status || "envoi",
//         });

//         res.status(201).json({
//             success: true,
//             message: "Message ajouté avec succès.",
//             id: ref.id,
//         });
//     } catch (error) {
//         console.error("Erreur ajout message :", error);
//         res.status(500).json({ message: "Erreur lors de l'ajout du message." });
//     }
// };

// // 📋 Récupérer tous les messages d’une urgence
// const getMessagesByUrgence = async (req, res) => {
//     try {
//         const { idUrgence } = req.params;
//         const snapshot = await db.collection("messages")
//             .where("idUrgence", "==", idUrgence)
//             .orderBy("timestamp", "asc")
//             .get();

//         const messages = snapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         res.status(200).json(messages);
//     } catch (error) {
//         console.error("Erreur récupération messages :", error);
//         res.status(500).json({ message: "Erreur lors de la récupération des messages." });
//     }
// };

// // 🔍 Récupérer un message précis
// const getMessageById = async (req, res) => {
//     try {
//         const { idMessage } = req.params;
//         const doc = await db.collection("messages").doc(idMessage).get();

//         if (!doc.exists) {
//         return res.status(404).json({ message: "Message introuvable." });
//         }

//         res.status(200).json({ id: doc.id, ...doc.data() });
//     } catch (error) {
//         console.error("Erreur récupération message :", error);
//         res.status(500).json({ message: "Erreur lors de la récupération du message." });
//     }
// };

// // ✏️ Mettre à jour le statut d’un message
// const updateMessageStatus = async (req, res) => {
//     try {
//         const { idMessage } = req.params;
//         const { status } = req.body;

//         const validStatus = ["envoi", "envoye", "erreur", "lu"];
//         if (!validStatus.includes(status)) {
//         return res.status(400).json({ message: "Statut invalide." });
//         }

//         await db.collection("messages").doc(idMessage).update({
//         status,
//         timestamp: new Date().toISOString(),
//         });

//         res.status(200).json({ success: true, message: "Statut mis à jour." });
//     } catch (error) {
//         console.error("Erreur mise à jour message :", error);
//         res.status(500).json({ message: "Erreur lors de la mise à jour du message." });
//     }
// };

// // 🗑️ Supprimer un message
// const deleteMessage = async (req, res) => {
//     try {
//         const { idMessage } = req.params;
//         await db.collection("messages").doc(idMessage).delete();

//         res.status(200).json({ success: true, message: "Message supprimé avec succès." });
//     } catch (error) {
//         console.error("Erreur suppression message :", error);
//         res.status(500).json({ message: "Erreur lors de la suppression du message." });
//     }
// };























const { db } = require("../config/firebaseConfig");
const { getIO } = require("../config/socketConfig");

// Ajouter un message
const addMessage = async (req, res) => {
    try {
        const newMessage = req.body;

        if (!newMessage.idUrgence || !newMessage.type || !newMessage.sender) {
            return res.status(400).json({ message: "Champs obligatoires manquants." });
        }

        const validTypes = ["text", "image", "video", "document", "audio"];
        const validSenders = ["patient", "assistant"];
        if (!validTypes.includes(newMessage.type)) return res.status(400).json({ message: "Type de message invalide." });
        if (!validSenders.includes(newMessage.sender)) return res.status(400).json({ message: "Sender invalide." });

        const docRef = await db.collection("messages").add({
            ...newMessage,
            timestamp: new Date().toISOString(),
            status: newMessage.status || "envoi",
        });

        const messageData = { id: docRef.id, ...newMessage, timestamp: new Date().toISOString(), status: newMessage.status || "envoi" };

        // 🔹 Socket.IO : notifier tous les clients dans la salle de l'urgence
        const io = getIO(); 
        io.to(`urgence_${newMessage.idUrgence}`).emit("message:new", messageData);

        res.status(201).json({
            success: true,
            message: "Message ajouté avec succès.",
            data: messageData
        });

    } catch (error) {
        console.error("Erreur ajout message :", error);
        res.status(500).json({ message: "Erreur lors de l'ajout du message." });
    }
};

// Récupérer tous les messages d’une urgence
const getMessagesByUrgence = async (req, res) => {
    try {
        const { idUrgence } = req.params;
        const snapshot = await db.collection("messages")
            .where("idUrgence", "==", idUrgence)
            .orderBy("timestamp", "asc")
            .get();

        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(messages);
    } catch (error) {
        console.error("Erreur récupération messages :", error);
        res.status(500).json({ message: "Erreur lors de la récupération des messages." });
    }
};

// Mettre à jour le statut d’un message
const updateMessageStatus = async (req, res) => {
    try {
        const { idMessage } = req.params;
        const { status } = req.body;
        const validStatus = ["envoi", "envoye", "erreur", "lu"];
        if (!validStatus.includes(status)) return res.status(400).json({ message: "Statut invalide." });

        await db.collection("messages").doc(idMessage).update({
            status,
            timestamp: new Date().toISOString(),
        });

        const updatedMessage = await db.collection("messages").doc(idMessage).get();

        // 🔹 Socket.IO : notifier la salle de l'urgence du changement de statut
        const io = getIO();
        io.to(`urgence_${updatedMessage.data().idUrgence}`).emit("message:statusChanged", { id: idMessage, status });

        res.status(200).json({ success: true, message: "Statut mis à jour.", data: { id: idMessage, status } });
    } catch (error) {
        console.error("Erreur mise à jour message :", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du message." });
    }
};

// Supprimer un message
const deleteMessage = async (req, res) => {
    try {
        const { idMessage } = req.params;
        const doc = await db.collection("messages").doc(idMessage).get();
        if (!doc.exists) return res.status(404).json({ message: "Message introuvable." });

        await db.collection("messages").doc(idMessage).delete();

        // 🔹 Socket.IO : notifier la salle de l'urgence
        const io = getIO();
        io.to(`urgence_${doc.data().idUrgence}`).emit("message:deleted", { id: idMessage });

        res.status(200).json({ success: true, message: "Message supprimé avec succès." });
    } catch (error) {
        console.error("Erreur suppression message :", error);
        res.status(500).json({ message: "Erreur lors de la suppression du message." });
    }
};

module.exports = {
    addMessage,
    getMessagesByUrgence,
    updateMessageStatus,
    deleteMessage,
};
