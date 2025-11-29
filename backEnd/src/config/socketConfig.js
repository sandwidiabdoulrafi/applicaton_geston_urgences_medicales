
const socketIO = require("socket.io");

let io;

const initializeSocket = (server, handlers = {}) => {
    // Création de l'instance Socket.IO
    io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // // Middleware d'authentification (optionnel)
    // io.use((socket, next) => {
    //     const token = socket.handshake.auth.token;
    //     // TODO: Ajouter validation JWT si nécessaire
    //     console.log('🔌 Tentative de connexion:', socket.id);
    //     next();
    // });



    // Gestion des connexions
    io.on("connection", (socket) => {
        console.log("✅ Nouveau client connecté :", socket.id);

        // Événement de connexion initiale
        socket.emit('connected', { 
            message: "Connexion réussie au serveur Socket.IO",
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });

        socket.on("user:typing", ({ idUrgence, isTyping, sender }) => {
            console.log(`✍️ ${sender} typing dans urgence ${idUrgence}: ${isTyping}`);
            
            // Diffuser à tous SAUF l'émetteur
            socket.to(`urgence_${idUrgence}`).emit("user:typing", {
                idUrgence,
                isTyping,
                sender
            });
        });


        
        try {
            // Handler Urgence
            if (handlers.urgence && typeof handlers.urgence === 'function') {
                handlers.urgence(socket);
                console.log(`   📋 Handler 'urgence' chargé pour ${socket.id}`);
            }

            // Handler Notification
            if (handlers.notification && typeof handlers.notification === 'function') {
                handlers.notification(socket);
                console.log(`   🔔 Handler 'notification' chargé pour ${socket.id}`);
            }

            // Handler Message
            if (handlers.message && typeof handlers.message === 'function') {
                handlers.message(socket);
                console.log(`   💬 Handler 'message' chargé pour ${socket.id}`);
            }

            // Handler Patient
            if (handlers.patient && typeof handlers.patient === 'function') {
                handlers.patient(socket);
                console.log(`   👤 Handler 'patient' chargé pour ${socket.id}`);
            }

            // Handler Service
            if (handlers.service && typeof handlers.service === 'function') {
                handlers.service(socket);
                console.log(`   🏥 Handler 'service' chargé pour ${socket.id}`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du chargement des handlers pour ${socket.id}:`, error);
        }



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