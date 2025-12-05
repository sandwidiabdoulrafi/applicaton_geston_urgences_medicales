import serviceSanteRoomService from '@/Routes/routeRoom/serviceSanteRoomService';
import socketServiceSante from '@/Routes/socket/SocketServiceSant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { AppState, Vibration } from 'react-native';
import LoadServiceSantetData from "../../Routes/routesBackend/LoadServiceSantetData";
import { useAuth } from '../contexts/AuthContext';

export default function ServiceUrgenceLayout() {
    const [serviceSante, setServiceSante] = useState(null);
    const [allIdUrgences, setAllIdUrgences] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const notificationSound = useRef<Audio.Sound>(null);


    



    // ═══════════════════════════════════════════════════════════
    // 1️⃣ CHARGEMENT DU SON DE NOTIFICATION
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        let isMounted = true;

        const loadNotificationSound = async () => {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('@/assets/sound/newMessage.mp3'),
                    { shouldPlay: false }
                );
                if (isMounted) notificationSound.current = sound;
                console.log('🔊 Son de notification chargé');
            } catch (error) {
                console.error('❌ Erreur chargement son:', error);
            }
        };

        loadNotificationSound();

        return () => {
            isMounted = false;
            if (notificationSound.current) {
                notificationSound.current.unloadAsync();
            }
        };
    }, []);



    const appState = useRef(AppState.currentState);
    const { userRole, userId } = useAuth();

    useEffect(() => {
        const subscription = AppState.addEventListener("change", next => {

            if(next === 'active'){
                console.log("🔄 L'utilisateur revient sur l'app");

                if (!userRole || !userId) return;
                
                if (userRole === "service") {
                    console.log("📌 Rechargement SERVICE DE SANTÉ");
                    LoadServiceSantetData(userId);
                }
            }
        });

        return () => subscription.remove();
    }, [userRole, userId]);
    






    const playNotificationSound = async () => {
        try {
            if (notificationSound.current) {
                await notificationSound.current.replayAsync();
            }
            Vibration.vibrate(200);
        } catch (error) {
            console.error('❌ Erreur lecture son:', error);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // 2️⃣ CHARGEMENT DU SERVICE DE SANTÉ
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        const initializeService = async () => {
            try {
                console.log('\n╔═══════════════════════════════════════════╗');
                console.log('║   INITIALISATION SERVICE DE SANTÉ         ║');
                console.log('╚═══════════════════════════════════════════╝');

                // Récupérer le service depuis la base locale
                const serviceSanteUser = await serviceSanteRoomService.getUserService();
                const serviceObj = Array.isArray(serviceSanteUser) 
                    ? serviceSanteUser[0] 
                    : serviceSanteUser;

                if (!serviceObj || !serviceObj.idService) {
                    console.warn('⚠️ Aucun service trouvé');
                    return;
                }

                setServiceSante(serviceObj);
                console.log('✅ Service chargé:', serviceObj.idService);
                console.log('   - Nom:', serviceObj.nomEtablissement);
                console.log('   - Type:', serviceObj.typeEtablissement);

                // Récupérer toutes les urgences en cours
                const response = await serviceSanteRoomService.getAllUrgenceId();
                if (response.success) {;
                    setAllIdUrgences(response.data);
                }

                // Stocker dans AsyncStorage
                await AsyncStorage.setItem(
                    "userServiceSante", 
                    JSON.stringify(serviceSanteUser)
                );

                console.log('✅ Service stocké dans AsyncStorage');

            } catch (error) {
                console.error("❌ Erreur initialisation service:", error);
            }
        };

        initializeService();
    }, []);

    // ═══════════════════════════════════════════════════════════
    // 3️⃣ GESTION SOCKET
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!serviceSante?.idService) {
            console.log('⚠️ Service non chargé, socket en attente...');
            return;
        }

        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║   INITIALISATION SOCKET SERVICE           ║');
        console.log('╚═══════════════════════════════════════════╝');
        console.log(`🏥 Service ID: ${serviceSante.idService}`);

        const handleConnect = () => {
            console.log('🟢 Socket Service connecté:', socketServiceSante.id);
            setIsConnected(true);

            // ✅ REJOINDRE LA ROOM SERVICE
            socketServiceSante.emit('joinServiceSante', serviceSante.idService);
            socketServiceSante.emit("join_room", "services_sante");
            console.log(`📤 Émission joinServiceSante: ${serviceSante.idService}`);

            // ✅ REJOINDRE TOUTES LES ROOMS D'URGENCES EN COURS
            if (allIdUrgences && allIdUrgences.length > 0) {
                allIdUrgences.forEach(({ idUrgence }) => {
                    socketServiceSante.emit('joinUrgence', { idUrgence });
                });
            }
        };

        const handleDisconnect = (reason) => {
            console.log('🔴 Socket Service déconnecté:', reason);
            setIsConnected(false);
        };

        const handleNotifiMessage = async(data)=> {
            console.log('\n╔═══════════════════════════════════════════╗');
            console.log('║   NOUVEAU MESSAGE RECU PAR UN PATIENT         ║');
            console.log('╚═══════════════════════════════════════════╝');
            
            
            await playNotificationSound();

            
            // TODO: Afficher une notification push locale
        };
        

        const handleConnectError = (error) => {
            console.error('❌ Erreur connexion socket:', error);
        };

        // ✅ CONFIRMATION DE ROOM JOINÉE
        const handleServiceJoined = (data) => {
            console.log('✅ Confirmation room service rejointe:', data);
        };

        // const handleUrgenceJoined = (data) => {
        //     console.log('✅ Confirmation room urgence rejointe:', data);
        // };

        // ═══════════════════════════════════════════════════════════
        // ÉVÉNEMENTS MÉTIER
        // ═══════════════════════════════════════════════════════════

        // 🎉 Confirmation de prise en charge réussie
        const handleSuccessAdd = (idUrgence) => {
            console.log(`\n┌─────────────────────────────────────────┐`);
            console.log(`│ PRISE EN CHARGE RÉUSSIE                 │`);
            console.log(`└─────────────────────────────────────────┘`);
            console.log(`✅ ID Urgence: ${idUrgence}`);
        };

        // 🔄 Changement de statut d'une urgence
        const handleUrgenceChanged = async (data) => {
            console.log(`\n┌─────────────────────────────────────────┐`);
            console.log(`│ URGENCE MISE À JOUR                     │`);
            console.log(`└─────────────────────────────────────────┘`);
            console.log('📥 Données:', data);
            console.log(`   🆔 ID Urgence: ${data.idUrgence}`);
            console.log(`   📊 Statut: ${data.statut}`);
            console.log(`   📅 Date: ${data.dateIntervention}`);

            try {
                await serviceSanteRoomService.updateStatusToAccep(data);
                console.log('✅ Urgence mise à jour localement');
            } catch (error) {
                console.error('❌ Erreur mise à jour urgence:', error);
            }
        };

        // 👤 Réception des informations patient
        const handlePatientInfo = async (patientData) => {
            console.log(`\n┌─────────────────────────────────────────┐`);
            console.log(`│ INFORMATIONS PATIENT REÇUES             │`);
            console.log(`└─────────────────────────────────────────┘`);
            console.log('📥 Patient:', patientData);
            console.log(`   👤 Nom: ${patientData.nom} ${patientData.prenom}`);
            console.log(`   📞 Tél: ${patientData.telephone}`);
            console.log(`   🩸 Groupe sanguin: ${patientData.groupeSanguin || 'N/A'}`);

            try {
                await serviceSanteRoomService.addPatient(patientData);
                console.log('✅ Patient sauvegardé localement');
            } catch (error) {
                console.error('❌ Erreur sauvegarde patient:', error);
            }
        };

        // ❌ Erreur lors de la prise en charge
        const handleServiceError = (error) => {
            console.error(`\n┌─────────────────────────────────────────┐`);
            console.error(`│ ERREUR SERVICE                          │`);
            console.error(`└─────────────────────────────────────────┘`);
            console.error('❌ Message:', error.message);
        };

        // 💬 Nouveau message
        const handleNewMessage = async (message) => {
            console.log('💬 recu chez service de santer  Nouveau message reçu:', message);
            await playNotificationSound();
        };

        // 🔔 Nouvelle notification
        const handleNewNotification = async (notification) => {
            console.log('🔔 Nouvelle notification:', notification);
            await playNotificationSound();
        };

        // ═══════════════════════════════════════════════════════════
        // ENREGISTREMENT DES LISTENERS
        // ═══════════════════════════════════════════════════════════

        socketServiceSante.on('connect', handleConnect);
        socketServiceSante.on('disconnect', handleDisconnect);
        socketServiceSante.on('connect_error', handleConnectError);
        socketServiceSante.on('serviceSanteJoined', handleServiceJoined);
        socketServiceSante.on("receiveMessage", handleNotifiMessage)
        // socketServiceSante.on('urgenceJoined', handleUrgenceJoined);
        
        // Événements métier
        socketServiceSante.on('succesAdd', handleSuccessAdd);
        socketServiceSante.on('urgenceStatusChanged', handleUrgenceChanged);
        socketServiceSante.on('patientInfoForService', handlePatientInfo);
        socketServiceSante.on('serviceIntervientError', handleServiceError);
        
        // Messages et notifications
        socketServiceSante.on('message:new', handleNewMessage);
        socketServiceSante.on('notification:new', handleNewNotification);
        
        // Autres événements
        socketServiceSante.on('urgence:updated', (d) => {
            console.log('📝 Urgence mise à jour:', d);
        });
        socketServiceSante.on('urgence:deleted', (d) => {
            console.log('🗑️ Urgence supprimée:', d);
        });
        socketServiceSante.on('urgence:removed', (d) => {
            console.log('🚫 Urgence retirée globalement:', d);
        });

        // Si déjà connecté, rejoindre immédiatement
        if (socketServiceSante.connected) {
            handleConnect();
        } else {
            socketServiceSante.connect();
        }

        // ═══════════════════════════════════════════════════════════
        // CLEANUP
        // ═══════════════════════════════════════════════════════════
        return () => {
            console.log('🧹 Nettoyage des listeners socket service');
            
            socketServiceSante.off('connect', handleConnect);
            socketServiceSante.off('disconnect', handleDisconnect);
            socketServiceSante.off('connect_error', handleConnectError);
            socketServiceSante.off('serviceSanteJoined', handleServiceJoined);
            socketServiceSante.off("receiveMessage", handleNotifiMessage)
            // socketServiceSante.off('urgenceJoined', handleUrgenceJoined);
            
            
            socketServiceSante.off('succesAdd', handleSuccessAdd);
            socketServiceSante.off('urgenceStatusChanged', handleUrgenceChanged);
            socketServiceSante.off('patientInfoForService', handlePatientInfo);
            socketServiceSante.off('serviceIntervientError', handleServiceError);
            
            socketServiceSante.off('message:new', handleNewMessage);
            socketServiceSante.off('notification:new', handleNewNotification);
            socketServiceSante.off('urgence:updated');
            socketServiceSante.off('urgence:deleted');
            socketServiceSante.off('urgence:removed');

            if (socketServiceSante.connected) {
                socketServiceSante.emit('leaveService', serviceSante.idService);
                allIdUrgences.forEach(({ idUrgence }) => {
                    socketServiceSante.emit('leaveUrgence', { idUrgence });
                });
            }
        };
    }, [serviceSante, allIdUrgences]);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    if (!serviceSante) {
        return null; // Ou un écran de chargement
    }

    return (
        <Stack 
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#34C759',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerBackTitle: 'Retour',
            }}
        >
            {/* Navigation principale avec tabs */}
            <Stack.Screen 
                name="(tabs)" 
                options={{ 
                    headerShown: false
                }} 
            />
        
            {/* 📋 Détails d'une urgence + Chat + Actions */}
            <Stack.Screen 
                name="urgence-details"
                options={{ 
                    title: 'Détails de l\'urgence',
                    presentation: 'card',
                }} 
            />
            
            {/* 👤 Détails d'un patient + Historique complet */}
            <Stack.Screen 
                name="patient-details"
                options={{ 
                    title: 'Dossier patient',
                    presentation: 'card',
                }} 
            />
        
            {/* 📝 Créer un historique médical (après urgence terminée) */}
            <Stack.Screen 
                name="creer-historique"
                options={{ 
                    title: 'Créer un historique',
                    presentation: 'modal',
                }} 
            />
            
            {/* 📄 Détails d'un historique */}
            <Stack.Screen 
                name="historique-details"
                options={{ 
                    title: 'Détails de l\'historique',
                    presentation: 'card',
                }} 
            />
        
            {/* ✏️ Modifier le profil de l'établissement */}
            <Stack.Screen 
                name="modifier-profil"
                options={{ 
                    title: 'Modifier l\'établissement',
                    presentation: 'card',
                }} 
            />
        
            {/* 🔔 Envoyer une notification à un patient */}
            <Stack.Screen 
                name="envoyer-notification"
                options={{ 
                    title: 'Envoyer une notification',
                    presentation: 'modal',
                }} 
            />
        
            {/* 💬 Chat d'une urgence */}
            <Stack.Screen 
                name="chat"
                options={{ 
                    title: 'Chat',
                    presentation: 'card',
                }} 
            />

            {/* 📊 Statistiques détaillées */}
            <Stack.Screen 
                name="statistiques"
                options={{ 
                    title: 'Statistiques',
                    presentation: 'card',
                }} 
            />
        </Stack>
    );
}