import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.1.132:5000";

export const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

// Connexion réussie
socket.on("connect", () => {
    console.log("✅ Socket connecté :", socket.id);
});

// Erreur de connexion
socket.on("connect_error", (error) => {
    console.error("❌ Erreur Socket :", error.message);
});

// Déconnexion
socket.on("disconnect", (reason) => {
    console.log("🔴 Socket déconnecté :", reason);
});

export default socket;