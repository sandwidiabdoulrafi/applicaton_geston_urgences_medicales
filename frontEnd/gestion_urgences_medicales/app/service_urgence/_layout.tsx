import { getUserPatient } from '@/Routes/routeRoom/roomPatient';
import serviceSanteRoomService from '@/Routes/routeRoom/serviceSanteRoomService';
import socketServiceSanter from '@/Routes/socket/SocketServiceSant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
// import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function ServiceUrgenceLayout() {



    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const checkRole = async () => {
            try {
                console.log("🔄 === DÉBUT DE L'INITIALISATION ===");

                
                
                console.log("🏥 Init DB ServiceSante...");
                await serviceSanteRoomService.initServiceSante();

                
                
                // 🔴 CHANGEMENT ICI : serviceSanteRoom au lieu de serviceSanteRoomService
                const serviceSanteUser = await serviceSanteRoomService.getUserService();


                // 4️⃣ Stocker dans AsyncStorage
                await AsyncStorage.setItem(
                    "userServiceSante", 
                    JSON.stringify(serviceSanteUser)
                );
                
                


            } catch (error) {
                console.error("❌ === ERREUR D'INITIALISATION ===");
                console.error(error);
            }
        };

        checkRole();
    }, []);









    const [userService, setUserService] = useState(null);

    // 🔌 Connexion socket au démarrage
    useEffect(() => {
        socketServiceSanter.connect();
        return () =>{ socketServiceSanter.disconnect()};
    }, []);

    // 📂 Charger le service depuis AsyncStorage
    useEffect(() => {
        const loadUserService = async () => {
            try {
                const data = await AsyncStorage.getItem("userServiceSante");
                if (data) {
                    setUserService(JSON.parse(data));
                    // console.log("👤 Service chargé:", JSON.parse(data)[0]?.idService);
                }
            } catch (error) {
                console.error("❌ Erreur AsyncStorage:", error);
            }
        };
        loadUserService();
    }, []);

    // 🏥 Rejoindre la room + Écouter les événements
    useEffect(() => {
        if (!userService?.[0]?.idService) return;

        const idService = userService[0].idService;
        

        // Rejoindre la room
        socketServiceSanter.emit("joinServiceSante", idService);

        const handleUrgenceChanged = async (data) => {
            console.log(`📥 Urgence mise à jour: ${data.dateIntervention}`);
            await serviceSanteRoomService.updateStatusToAccep(data);
        };

        const handlePatientInfo = async (patientData) => {
            console.log(`📥 Patient reçu: ${patientData.nom}`);
            await serviceSanteRoomService.addPatient(patientData);
        };

        socketServiceSanter.on("urgenceStatusChanged", handleUrgenceChanged);
        socketServiceSanter.on("patientInfoForService", handlePatientInfo);

        // Nettoyage
        return () => {
            
            socketServiceSanter.off("urgenceStatusChanged", handleUrgenceChanged);
            socketServiceSanter.off("patientInfoForService", handlePatientInfo);
        };
    }, [userService]);



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
                        headerShown: false // Les tabs ont leur propre header
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
