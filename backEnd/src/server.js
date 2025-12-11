require('dotenv').config();
const http = require('http');
const express = require('express');

// ✅ IMPORTANT : Importer app depuis ./app.js
const app = require('./app');

// Import de la configuration Socket.IO
const { initializeSocket } = require("./config/socketConfig");

// Import des handlers Socket.IO
const urgenceSocket = require('./socket/urgenceSocket');
const notificationSocket = require('./socket/notificationSocket');
const messageSocket = require('./socket/messageSocket');
const patientSocket = require('./socket/patientSocket');
const serviceSocket = require('./socket/serviceSocket');

// ✅ Vérification que app est bien une instance Express
if (typeof app !== 'function') {
    console.error('❌ ERREUR: app n\'est pas une fonction Express valide');
    console.error('Valeur de app:', app);
    process.exit(1);
}

// Création du serveur HTTP avec l'app Express
const server = http.createServer(app);

// Initialisation de Socket.IO avec tous les handlers
const io = initializeSocket(server, {
    urgence: urgenceSocket,
    notification: notificationSocket,
    message: messageSocket,
    patient: patientSocket,
    service: serviceSocket
});

// ✅ Maintenant app.set devrait fonctionner
app.set('io', io);

// Configuration du port et de l'hôte
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Démarrage du serveur
server.listen(PORT, HOST, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 SERVEUR DE GESTION DES URGENCES MÉDICALES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Express API:      http://localhost:${PORT}/api`);
    console.log(`✅ Socket.IO:        ws://${HOST}:${PORT}`);
    console.log(`✅ Health Check:     http://localhost:${PORT}/health`);
    console.log(`✅ Environnement:    ${process.env.NODE_ENV || 'development'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse non gérée:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non capturée:', error);
    process.exit(1);
});

// Arrêt gracieux du serveur
process.on('SIGTERM', () => {
    console.log('⚠️  Signal SIGTERM reçu, arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

// Export pour tests ou utilisation externe
module.exports = { app, server, io };