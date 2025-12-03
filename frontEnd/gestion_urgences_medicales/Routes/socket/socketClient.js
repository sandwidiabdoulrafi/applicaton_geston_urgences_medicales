import { io, Socket } from 'socket.io-client';

// ⚠️ Remplacez par l'URL de votre backend
const SOCKET_URL = 'http://192.168.1.132:5000';


// const SOCKET_URL = `http://192.168.11.220:5000`; 

const socket = io(SOCKET_URL, {
    autoConnect: false, 
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling']
});


export default socket;