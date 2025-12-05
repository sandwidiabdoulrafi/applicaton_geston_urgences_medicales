import LoadPatientData from "../../Routes/routesBackend/LoadPatientData";
import { getUserPatient } from '@/Routes/routeRoom/roomPatient';
import { getAllUrgenceId, updateForAccptUrgence } from '@/Routes/routeRoom/roomUrgences';
import socket from '@/Routes/socket/socketClient';

import roomMessages, { addMessage } from '../../Routes/routeRoom/roomMessages.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { ActivityIndicator, AppState, Vibration, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from "../contexts/AuthContext";


interface Message {
    id: number | string,
    idUrgence: string,
    sender: 'patient' | 'service'
    text?: string
    status: 'envoi' | 'envoye' | 'erreur' | 'lu',
    idTmp?: string
}

export default function PatientLayout() {
    const [patient, setPatient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [allIdUrgences, setAllIdUrgences] = useState([]);
    const notificationSound = useRef<Audio.Sound>(null);

    // Chargement du son
    useEffect(() => {
        let isMounted = true;

        const loadNotificationSound = async () => {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('@/assets/sound/newMessage.mp3'),
                    { shouldPlay: false }
                );
                if (isMounted) notificationSound.current = sound;
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

    // Initialisation patient + urgences
    useEffect(() => {
        const initializePatient = async () => {
            try {
                const patientData = await getUserPatient();
                const patientObj = Array.isArray(patientData) ? patientData[0] : patientData;

                if (!patientObj || !patientObj.idPatient) {
                    console.warn('⚠️ Aucun patient trouvé');
                    return;
                }

                setPatient(patientObj);

                const response = await getAllUrgenceId();
                if (response.success) {
                    
                    setAllIdUrgences(response.data);
                }

                await AsyncStorage.setItem("userPatient", JSON.stringify(patientData));
                console.log('✅ Patient chargé:', patientObj.idPatient);
            } catch (error) {
                console.error('❌ Erreur chargement patient:', error);
            }
        };

        initializePatient();
    }, []);

    const appState = useRef(AppState.currentState);
    const {userRole, userId} = useAuth()
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", async next => {
            if(next ==='active'){
                if (!userRole || !userId) return;

                if (userRole === "patient") {
                    console.log("📌 Rechargement PATIENT");
                    setIsReloading(true);
                    // LoadPatientData(userId);


                    try {
                        await LoadPatientData(userId);
                    } catch (error) {
                        console.error("❌ Erreur rechargement:", error);
                    } finally {
                        setIsReloading(false); // ✅ Fin du chargement
                    }


                }
            }
        });

        return () => subscription.remove();
    }, [userRole, userId]);

    // Gestion socket
    useEffect(() => {
        if (!patient?.idPatient) {
            console.log('⚠️ Patient non chargé, socket en attente...');
            return;
        }


        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║   INITIALISATION SOCKET PATIENT            ║');
        console.log('╚═══════════════════════════════════════════╝');
        console.log(`👤 Patient ID: ${patient.idPatient}`);

        const handleConnect = () => {
            console.log('🟢 Socket Patient connecté:', socket.id);
            setIsConnected(true);

            // ✅ REJOINDRE LA ROOM PATIENT
            socket.emit('joinPatient', patient.idPatient);
            console.log(`📤 Émission joinPatient: ${patient.idPatient}`);

            // ✅ REJOINDRE TOUTES LES ROOMS D'URGENCES
            if (allIdUrgences && allIdUrgences.length > 0) {
                allIdUrgences.forEach(({ idUrgence }) => {
                    socket.emit('joinUrgence', { idUrgence });
                });
            }
        };

        const handleDisconnect = (reason) => {
            console.log('🔴 Socket Patient déconnecté:', reason);
            setIsConnected(false);
        };

        const handleConnectError = (error) => {
            console.error('❌ Erreur connexion socket:', error);
        };

        // ✅ CONFIRMATION DE ROOM JOINÉE
        const handlePatientJoined = (data) => {
            console.log('✅ Confirmation room patient rejointe:', data);
        };


        // ✅ ÉCOUTER L'ACCEPTATION PAR UN SERVICE
        const handleUrgenceAccepteByService = async (data) => {
            console.log('\n╔═══════════════════════════════════════════╗');
            console.log('║   URGENCE ACCEPTÉE PAR UN SERVICE         ║');
            console.log('╚═══════════════════════════════════════════╝');
            
            
            await playNotificationSound();

            const saveAcceptData = await updateForAccptUrgence(data);
            if(saveAcceptData.success){
                console.log(`URGENCE gerer avec succes`)
            }
            
            // TODO: Afficher une notification push locale
        };
        

        const handleNotifiMessage = async (msg: Message) => {
            console.log('\n╔═══════════════════════════════════════════╗');
            console.log('║   NOUVEAU MESSAGE RECU PAR UN PATIENT         ║');
            console.log('╚═══════════════════════════════════════════╝');
            
            // Jouer le son et vibrer
            await playNotificationSound();
        
            // 1. Sauvegarder le message en base locale
            try {
            
                const responseAdd = await addMessage(msg); 
        
                if (responseAdd.success) {
                    console.log("✅ Message reçu et sauvegardé localement (via Layout). ID:", responseAdd.data?.id);
                } else {
                    console.error("❌ Échec de la sauvegarde locale du message reçu.");
                }
            } catch (error) {
                console.error("❌ Erreur lors de la sauvegarde du message reçu:", error);
            }
        
        };
        







        
        // Events socket
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('patientJoined', handlePatientJoined);
        socket.on("receiveMessage", handleNotifiMessage)
        // socket.on('urgenceJoined', handleUrgenceJoined);
        
        // ✅ ÉCOUTER LES ÉVÉNEMENTS IMPORTANTS
        socket.on('urgenceAccepteByService', handleUrgenceAccepteByService);
        socket.on('urgence:statusChanged', (d) => {
            console.log("🔄 Statut urgence changé:", d);
        });

        
        socket.on('message:new', async (d) => {
            console.log("💬  recu chez patient  Nouveau message:", d);
            await playNotificationSound();
        });
        socket.on('message:statusChanged', (d) => {
            console.log("✓ Statut message changé:", d);
        });
        socket.on('notification:new', async (d) => {
            console.log("🔔 Nouvelle notification:", d);
            await playNotificationSound();
        });

        // Si déjà connecté, rejoindre immédiatement
        if (socket.connected) {
            handleConnect();
        }else {
            socket.connect();
        }

        // Cleanup
        return () => {
            console.log('Nettoyage des listeners socket patient');
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('patientJoined', handlePatientJoined);
            // socket.off('urgenceJoined', handleUrgenceJoined);
            socket.off('urgenceAccepteByService', handleUrgenceAccepteByService);
            socket.off('urgenceStatusChanged');
            socket.off('message:new');
            socket.off('message:statusChanged');
            socket.off('notification:new');
            socket.off("receiveMessage", handleNotifiMessage)

            if (socket.connected) {
                socket.emit('leavePatient', patient.idPatient);
                allIdUrgences.forEach(({ idUrgence }) => {
                    socket.emit('leaveUrgence', { idUrgence });
                });
            }
        };
    }, [patient, allIdUrgences]);

    if (!patient) {
        return null; 
    }








    if (!patient || isReloading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10 }}>
                    {isReloading ? "Actualisation..." : "Chargement..."}
                </Text>
            </View>
        );
    }




    return (
        <Stack 
            screenOptions={{
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen 
                name="(tabs)" 
                options={{ headerShown: false }} 
            />
        </Stack>
    );
}