const express = require("express");
const router = express.Router();
const {
    addMessage,
    getMessagesByUrgence,
    updateMessageStatus,
    deleteMessage,
} = require("../controllers/messagesController");

// Ajouter un message
router.post("/ajouter", addMessage);

// Récupérer tous les messages d’une urgence
router.get("/urgence/:idUrgence", getMessagesByUrgence);

//Mettre à jour le statut d’un message
router.put("/:idMessage", updateMessageStatus);

//Supprimer un message
router.delete("/:idMessage", deleteMessage);

module.exports = router;
