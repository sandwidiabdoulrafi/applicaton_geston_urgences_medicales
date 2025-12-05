import { push } from 'expo-router/build/global-state/routing';
import { io, Socket } from 'socket.io-client';

// ⚠️ Remplacez par l'URL de votre backend
// const SOCKET_URL = 'http://192.168.1.132:5000';

const SOCKET_URL = `http://192.168.11.220:5000`; 


const socket = io(SOCKET_URL, {
    autoConnect: false, 
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling']
});

// // Logs de débogage
// socketServiceSanter.on('connect', () => {
//     console.log('✅ Socket connecté:', socketServiceSanter.id);
// });

// socketServiceSanter.on('connect_error', (error) => {
//     console.error('❌ Erreur de connexion Socket:', error.message);
// });

// socketServiceSanter.on('disconnect', (reason) => {
//     console.log('🔴 socketServiceSanter déconnecté:', reason);
// });


// socketServiceSanter.onAny((eventName, ...args) => {
//     console.log(`🔔 Événement Socket reçu : ${eventName}`, args);
// });

// socketServiceSanter.on("succesAdd", (data) => {
//     console.log("🟢 [GLOBAL] succesAdd reçu:", data);
// });

// // socketServiceSanter.on("serviceIntervientError", (data) => {
// //     console.log("🔴 [GLOBAL] serviceIntervientError reçu:", data);
// // });




// // ═══════════════════════════════════════════════════════════
// // LOGS DE TOUS LES ÉVÉNEMENTS ENTRANTS (onAny)
// // ═══════════════════════════════════════════════════════════

// socketServiceSanter.onAny((eventName, ...args) => {
//     console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
//     console.log(`🔔 [SOCKET] Événement reçu: ${eventName}`);
//     console.log(`📦 [SOCKET] Données:`, JSON.stringify(args, null, 2));
//     console.log(`⏰ [SOCKET] Timestamp:`, new Date().toLocaleTimeString());
//     console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
// });

// // ═══════════════════════════════════════════════════════════
// // LOGS SPÉCIFIQUES PAR ÉVÉNEMENT
// // ═══════════════════════════════════════════════════════════

// // Événements de confirmation de room
// socketServiceSanter.on("serviceSanteJoined", ({ socketId }) => {
//     console.log(`✅ [SOCKET] Room service rejointe`);
//     console.log(`   └─ Socket ID: ${socketId}`);
// });

// // Événements d'urgence
// socketServiceSanter.on("urgenceStatusChanged", (data) => {
//     console.log(`🟢 [SOCKET] Urgence mise à jour`);
//     console.log(`   └─ ID: ${data.idUrgence}`);
//     console.log(`   └─ Statut: ${data.statut}`);
//     console.log(`   └─ Service: ${data.serviceInfo?.nomEtablissement || 'N/A'}`);
// });

// socketServiceSanter.on("removeUrgenceFromList", (idUrgence) => {
//     console.log(`🗑️ [SOCKET] Retrait urgence de la liste`);
//     console.log(`   └─ ID: ${idUrgence}`);
// });

// socketServiceSanter.on("succesAdd", (idUrgence) => {
//     console.log(`🎉 [SOCKET] Succès prise en charge`);
//     console.log(`   └─ ID Urgence: ${idUrgence}`);
// });

// // Événements patient
// socketServiceSanter.on("patientInfoForService", (patientData) => {
//     console.log(`👤 [SOCKET] Infos patient reçues`);
//     console.log(`   └─ Nom: ${patientData.nom} ${patientData.prenom}`);
//     console.log(`   └─ Groupe sanguin: ${patientData.groupeSanguin || 'N/A'}`);
// });

// // Événements d'erreur
// socketServiceSanter.on("serviceIntervientError", (data) => {
//     console.log(`❌ [SOCKET] Erreur intervention`);
//     console.log(`   └─ Message: ${data.message}`);
// });

// socketServiceSanter.on("serviceIntervientSuccess", (response) => {
//     console.log(`✅ [SOCKET] Intervention réussie`);
//     console.log(`   └─ ID Urgence: ${response.data?.idUrgence}`);
//     console.log(`   └─ Success: ${response.success}`);
// });

// // Événements de suppression
// socketServiceSanter.on("urgenceRemoved", ({ idUrgence }) => {
//     console.log(`🚫 [SOCKET] Urgence retirée globalement`);
//     console.log(`   └─ ID: ${idUrgence}`);
// });

// const originalEmit = socketServiceSanter.emit;
// socketServiceSanter.emit = function(eventName, ...args) {
//     console.log(`\n📤 [SOCKET] Émission: ${eventName}`);
//     console.log(`   └─ Données:`, JSON.stringify(args, null, 2));
//     return originalEmit.apply(this, [eventName, ...args]);
// };



export default socket;











// il doit ecouter 
            // socket.off('urgence:updated');
            // socket.off('urgence:deleted');  socket.on('urgence:updated', (d) => {
            // console.log("📝 Urgence mise à jour:", d);
        // });

                // socket.on('urgence:deleted', (d) => {
                //     console.log("🗑️ Urgence supprimée:", d);
                // });

                // socket.on('urgence:updated', (d) => {
                //     console.log("📝 Urgence mise à jour:", d);
                // });


                // notifcation push
                // socket.off('notification:new');