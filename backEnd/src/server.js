// const http = require('http');
// const { initializeSocket } = require("./config/socketConfig");
// require('dotenv').config();

// // Import de l'application Express configurée
// const app = require('./app');

// // Import des handlers Socket.IO
// const urgenceSocket = require('./socket/urgenceSocket');
// const notificationSocket = require('./socket/notificationSocket');
// const messageSocket = require('./socket/messageSocket');
// const patientSocket = require('./socket/patientSocket');
// const serviceSocket = require('./socket/serviceSocket');

// // ✅ Création du serveur HTTP avec Express
// const server = http.createServer(app);

// // ❗ Ici on initialise correctement Socket.IO
// const io = initializeSocket(server);

// // ✅ Middleware Socket.IO pour authentification (optionnel)
// io.use((socket, next) => {
//     const token = socket.handshake.auth.token;
//     // Ajouter ici votre logique d'authentification si nécessaire
//     console.log('🔌 Tentative de connexion:', socket.id);
//     next();
// });

// // ✅ Gestion des connexions Socket.IO
// io.on('connection', (socket) => {
//     console.log('✅ Client connecté:', socket.id);
    
//     // Informations de connexion
//     socket.emit('connected', { 
//         socketId: socket.id,
//         timestamp: new Date().toISOString()
//     });
    
//     // Initialiser tous les handlers Socket
//     urgenceSocket(io, socket);
//     notificationSocket(io, socket);
//     messageSocket(io, socket);
//     patientSocket(io, socket);
//     serviceSocket(io, socket);
    
//     // Gestion de la déconnexion
//     socket.on('disconnect', (reason) => {
//         console.log('❌ Client déconnecté:', socket.id, '- Raison:', reason);
//     });
    
//     // Gestion des erreurs Socket
//     socket.on('error', (error) => {
//         console.error('❌ Erreur socket:', socket.id, error);
//     });
// });

// // ✅ Rendre Socket.IO accessible dans les controllers Express
// app.set('io', io);

// // ✅ Démarrage du serveur
// const PORT = process.env.PORT || 3000;
// const HOST = process.env.HOST || '0.0.0.0';

// server.listen(PORT, HOST, () => {
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//     console.log('🚀 SERVEUR DE GESTION DES URGENCES MÉDICALES');
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//     console.log(`✅ Express API:      http://localhost:${PORT}/api`);
//     console.log(`✅ Socket.IO:        ws://${HOST}:${PORT}`);
//     console.log(`✅ Health Check:     http://localhost:${PORT}/health`);
//     console.log(`✅ Environnement:    ${process.env.NODE_ENV || 'development'}`);
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
// });

// // ✅ Gestion des erreurs non capturées
// process.on('unhandledRejection', (reason, promise) => {
//     console.error('❌ Promesse non gérée:', reason);
// });

// process.on('uncaughtException', (error) => {
//     console.error('❌ Exception non capturée:', error);
//     process.exit(1);
// });

// // ✅ Gestion de l'arrêt gracieux
// process.on('SIGTERM', () => {
//     console.log('⚠️  Signal SIGTERM reçu, arrêt du serveur...');
//     server.close(() => {
//         console.log('✅ Serveur arrêté proprement');
//         process.exit(0);
//     });
// });

// module.exports = { app, server, io };












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
    // urgence: urgenceSocket,
    // notification: notificationSocket,
    // message: messageSocket,
    // patient: patientSocket,
    // service: serviceSocket
});

// ✅ Maintenant app.set devrait fonctionner
app.set('io', io);

// Configuration du port et de l'hôte
const PORT = process.env.PORT || 3000;
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