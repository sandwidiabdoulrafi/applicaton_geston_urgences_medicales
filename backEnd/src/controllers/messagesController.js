
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






const path = require('path');
const fs = require('fs');

const uploadMedia = async (req, res) => {
    try {
        console.log("\n---=-=-=-==-=-====-= Body:", req.body);
        console.log("\n---=-=-=-==-=-====-= File:", req.file);

        const { idUrgence, sender, type } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier reçu" });
        }

        const file = req.file;

        // Créer le dossier uploads/messages si n'existe pas
        const uploadDir = path.join(__dirname, '../uploads/messages');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Nom du fichier final
        const fileName = `${Date.now()}_${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);

        // Sauvegarder le buffer sur le serveur
        fs.writeFileSync(filePath, file.buffer);

        // URL publique (à adapter selon ton serveur)
        const publicUrl = `/uploads/messages/${fileName}`;

        res.status(200).json({
            success: true,
            mediaUrl: publicUrl,
            fileName,
        });

    } catch (err) {
        console.error("Erreur upload:", err);
        res.status(500).json({ message: "Erreur upload", error: err.message });
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










const getAllMessageForUser = async (req, res) => {
    console.log("\n===============================");
    console.log("📥 getAllMessageForUser appelé");
    console.log("===============================");

    console.log("🔍 req.body :", req.body);

    try {
        const { idUrgence } = req.body;

        if (!idUrgence) {
            console.log("❌ idUrgence manquant");
            return res.status(400).json({
                success: false,
                message: "idUrgence est obligatoire"
            });
        }

        console.log("📁 Collection : messages");
        console.log("⏳ Exécution de la requête Firestore...");

        // Requête sans orderBy (pas besoin d'index)
        const query = db
            .collection("messages")
            .where("idUrgence", "==", idUrgence);

        const snapshot = await query.get();

        console.log(`📩 Nombre de messages trouvés : ${snapshot.size}`);

        // Tri côté serveur avec gestion flexible du timestamp
        const messages = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                // ✅ Gestion de différents formats de timestamp
                let timeA, timeB;

                // Si c'est un Firestore Timestamp
                if (a.timestamp?.toMillis) {
                    timeA = a.timestamp.toMillis();
                }
                // Si c'est un nombre (milliseconds)
                else if (typeof a.timestamp === 'number') {
                    timeA = a.timestamp;
                }
                // Si c'est une chaîne ISO
                else if (typeof a.timestamp === 'string') {
                    timeA = new Date(a.timestamp).getTime();
                }
                // Par défaut
                else {
                    timeA = 0;
                }

                // Même logique pour b
                if (b.timestamp?.toMillis) {
                    timeB = b.timestamp.toMillis();
                }
                else if (typeof b.timestamp === 'number') {
                    timeB = b.timestamp;
                }
                else if (typeof b.timestamp === 'string') {
                    timeB = new Date(b.timestamp).getTime();
                }
                else {
                    timeB = 0;
                }

                return timeA - timeB; 
            });

        console.log("✅ Récupération et tri terminés avec succès.");

        return res.status(200).json({
            success: true,
            message: "Messages récupérés avec succès",
            data: messages
        });

    } catch (error) {
        console.error("❌ Erreur getAllMessageForUser :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};




module.exports = {
    uploadMedia,
    addMessage,
    getMessagesByUrgence,
    updateMessageStatus,
    deleteMessage,
    getAllMessageForUser,
};
