const express = require("express");
const multer = require("multer");
const { uploadMedia } = require("../controllers/messagesController");

const router = express.Router();

// Multer en mémoire (pas de fichier local)
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("media"), uploadMedia);

module.exports = router;
