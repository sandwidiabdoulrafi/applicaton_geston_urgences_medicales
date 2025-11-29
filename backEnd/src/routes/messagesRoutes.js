const express = require("express");
const router = express.Router();
const {
    addMessage,
    getMessagesByUrgence,
    updateMessageStatus,
    deleteMessage,
    uploadMedia,
} = require("../controllers/messagesController");

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });



// Ajouter un message
router.post("/ajouter", addMessage);

// Récupérer tous les messages d’une urgence
router.get("/urgence/:idUrgence", getMessagesByUrgence);

//Mettre à jour le statut d’un message
router.put("/:idMessage", updateMessageStatus);

//Supprimer un message
router.delete("/:idMessage", deleteMessage);


// sauvergarde des fichier du message
router.post("/upload",upload.single('file'), uploadMedia);

module.exports = router;
    