
const admin = require("firebase-admin");
const path = require("path");

// Chemin absolu vers ta clé de service
const serviceAccountPath = path.resolve(__dirname, "./gestion-urgences-medical-acb28-firebase-adminsdk-fbsvc-6b77aceee1.json");

// Initialisation de Firebase
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
});

// Initialisation de Firestore
const db = admin.firestore();

console.log("✅ Connexion à Firebase réussie !");

module.exports = { admin, db };
