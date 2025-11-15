
const { getIO } = require("../config/socketConfig");

const sendNotification = (notification) => {
    const io = getIO();

    try {
        if (notification.cible === "all_services") {
            // Envoie à tous les services de santé
            io.to("services_sante").emit("nouvelleNotification", notification);
            console.log(`📢 Notification envoyée à tous les services :`, notification);
        } else if (notification.cible?.startsWith("urgence_")) {
            // Envoie dans une salle d’urgence spécifique
            io.to(notification.cible).emit("nouvelleNotification", notification);
            console.log(`📢 Notification envoyée à ${notification.cible} :`, notification);
        } else if (notification.cible) {
            // Envoie à un socket ID ou une salle spécifique
            io.to(notification.cible).emit("nouvelleNotification", notification);
            console.log(`📢 Notification envoyée à ${notification.cible} :`, notification);
        } else {
            console.warn("⚠️ Aucune cible précisée pour la notification :", notification);
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de la notification :", error);
    }
};

module.exports = { sendNotification };
