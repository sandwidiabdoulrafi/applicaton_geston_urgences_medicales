import { io, Socket } from 'socket.io-client';

// ⚠️ Remplacez par l'URL de votre backend
const SOCKET_URL = 'http://192.168.1.132:5000';

const socket = io(SOCKET_URL, {
    autoConnect: false, 
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling']
});

// Logs de débogage
socket.on('connect', () => {
    console.log('✅ Socket connecté:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion Socket:', error.message);
});

socket.on('disconnect', (reason) => {
    console.log('🔴 Socket déconnecté:', reason);
});

export default socket;