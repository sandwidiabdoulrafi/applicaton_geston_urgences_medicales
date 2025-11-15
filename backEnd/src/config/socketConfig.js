// // config/socketConfig.js
// const socketIO = require("socket.io");

// let io;

// const initializeSocket = (server) => {
//     // creation d'une instance socket
//     io = socketIO(server, {
//         cors: {
//             origin: "*", // À adapter selon vos besoins
//             methods: ["GET", "POST", "PUT", "DELETE"]
//         }
//     });

//     // Gestion des connexions
//     io.on("connection", (socket) => {
//         console.log("✅ Nouveau client connecté :", socket.id);

//         // Gestion de la déconnexion
//         socket.on("disconnect", () => {
//             console.log("❌ Client déconnecté :", socket.id);
//         });

//         // Rejoindre une salle spécifique (pour les urgences par exemple)
//         socket.on("joinUrgence", (idUrgence) => {
//             socket.join(`urgence_${idUrgence}`);
//             console.log(`🔗 Socket ${socket.id} a rejoint la salle urgence_${idUrgence}`);
//         });


//         // rejoindre la salle des urgences en attent qui qui son vue par les service de santer
        
//         socket.on("joinServiceSante", () => {
//             socket.join("services_sante");
//             console.log(`🏥 Service de santé connecté : ${socket.id} a rejoint la salle 'services_sante'`);
//         });



//         socket.on("leaveUrgence", (idUrgence) => {
//             socket.leave(`urgence_${idUrgence}`);
//             console.log(`🔓 Socket ${socket.id} a quitté la salle urgence_${idUrgence}`);
//         });
//     });

//     console.log("🚀 Socket.IO initialisé avec succès");
//     return io;
// };

// const getIO = () => {
//     if (!io) {
//         throw new Error("Socket.IO n'est pas initialisé. Appelez initializeSocket() d'abord.");
//     }
//     return io;
// };

// module.exports = { initializeSocket, getIO };




















// config/socketConfig.js
const socketIO = require("socket.io");

let io;

const initializeSocket = (server, handlers = {}) => {
    // Création de l'instance Socket.IO
    io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Middleware d'authentification (optionnel)
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        // TODO: Ajouter validation JWT si nécessaire
        console.log('🔌 Tentative de connexion:', socket.id);
        next();
    });

    // Gestion des connexions
    io.on("connection", (socket) => {
        console.log("✅ Nouveau client connecté :", socket.id);

        // Événement de connexion initiale
        socket.emit('connected', { 
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });

        // ═══════════════════════════════════════════
        // GESTION DES SALLES (ROOMS)
        // ═══════════════════════════════════════════

        // Rejoindre une salle d'urgence spécifique
        socket.on("joinUrgence", (idUrgence) => {
            socket.join(`urgence_${idUrgence}`);
            console.log(`🔗 Socket ${socket.id} a rejoint urgence_${idUrgence}`);
            socket.emit("urgenceJoined", { idUrgence, socketId: socket.id });
        });

        // Rejoindre la salle des services de santé
        socket.on("joinServiceSante", (serviceId) => {
            socket.join("services_sante");
            if (serviceId) {
                socket.join(`service_${serviceId}`);
            }
            console.log(`🏥 Service de santé ${socket.id} connecté`);
            socket.emit("serviceSanteJoined", { socketId: socket.id });
        });

        // Rejoindre une salle de patient
        socket.on("joinPatient", (patientId) => {
            socket.join(`patient_${patientId}`);
            console.log(`👤 Socket ${socket.id} a rejoint patient_${patientId}`);
        });

        // Quitter une salle d'urgence
        socket.on("leaveUrgence", (idUrgence) => {
            socket.leave(`urgence_${idUrgence}`);
            console.log(`🔓 Socket ${socket.id} a quitté urgence_${idUrgence}`);
        });

        // Quitter une salle de service
        socket.on("leaveService", (serviceId) => {
            socket.leave(`service_${serviceId}`);
            console.log(`🔓 Socket ${socket.id} a quitté service_${serviceId}`);
        });

        // ═══════════════════════════════════════════
        // INITIALISATION DES HANDLERS MÉTIER
        // ═══════════════════════════════════════════

        // Appeler tous les handlers passés en paramètre
        if (handlers.urgence) handlers.urgence(io, socket);
        if (handlers.notification) handlers.notification(io, socket);
        if (handlers.message) handlers.message(io, socket);
        if (handlers.patient) handlers.patient(io, socket);
        if (handlers.service) handlers.service(io, socket);

        // ═══════════════════════════════════════════
        // GESTION DE LA DÉCONNEXION
        // ═══════════════════════════════════════════

        socket.on("disconnect", (reason) => {
            console.log(`❌ Client déconnecté : ${socket.id} - Raison: ${reason}`);
        });

        // Gestion des erreurs
        socket.on("error", (error) => {
            console.error(`❌ Erreur socket ${socket.id}:`, error);
        });
    });

    console.log("🚀 Socket.IO initialisé avec succès");
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO n'est pas initialisé. Appelez initializeSocket() d'abord.");
    }
    return io;
};

module.exports = { initializeSocket, getIO };