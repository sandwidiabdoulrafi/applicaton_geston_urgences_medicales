import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import roomMessages from '@/Routes/routeRoom/roomMessages.js';
import roomUrgences from '@/Routes/routeRoom/roomUrgences';

// Configure le comportement de la notification lorsque l'application est au premier plan
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Interface pour le format des données de la notification
interface NotificationData {
    idUrgence: string;
    // Vous pouvez ajouter d'autres champs de données ici si nécessaire
}

/**
 * 🔔 Fonction utilitaire pour enregistrer le jeton d'appareil (token)
 * et demander les permissions de notification.
 */
async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('new-messages', {
            name: 'Nouveaux Messages',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#58D68D',
        });
    }

    if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.error('❌ Échec de l\'obtention des permissions de notification !');
            return;
        }
        
        // Obtient le jeton Expo pour les notifications push
        try {
            token = (await Notifications.getExpoPushTokenAsync({ 
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            })).data;
            
            console.log('✅ Expo Push Token:', token);
        } catch (error) {
            console.error('❌ Erreur obtention token:', error);
        }

    } else {
        console.warn('⚠️ L\'utilisation des notifications push nécessite un appareil physique.');
    }

    return token;
}

/**
 * 📲 Fonction pour afficher une notification push locale immédiatement.
 */
export async function showLocalNotification(title: string, body: string, data: NotificationData) {
    // Vérifie les permissions avant d'envoyer
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
        console.warn('⚠️ Permissions de notification non accordées. Notification non envoyée.');
        return;
    }
    
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            data: data,
            sound: true,
        },
        trigger: null,
    });
    
    console.log('📲 Notification locale envoyée:', title);
}


export default function NotificationPush() {

    const router = useRouter();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);


    useEffect(() => {
        // 1. Demander les permissions
        registerForPushNotificationsAsync();
    
        // 2. Listener clic sur notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
    
                const data = response.notification.request.content.data as Partial<NotificationData>;
                console.log("🔔 Notification cliquée. Données:", data);
    
                if (!data.idUrgence) return;
    
                try {
                    // 🔍 1. Récupérer l'urgence depuis SQLite
                    const urgence = await roomUrgences.getUrgenceById(data.idUrgence);
    
                    const intitule = urgence?.intitule ?? "Discussion Urgente";
                    console.log("📌 Nom urgence récupéré:", intitule);
    
                    
                    router.push({
                        pathname: `/patient/chat/[id]`,
                        params: {
                            id: data.idUrgence,
                            idUrgence: data.idUrgence,
                            intitule: intitule,
                        },
                    });
    
                } catch (err) {
                    console.error("❌ Erreur récupération urgence:", err);
    
                    // Fallback
                    router.push({
                        pathname: `/patient/chat/[id]`,
                        params: {
                            id: data.idUrgence,
                            idUrgence: data.idUrgence,
                            intitule: "Discussion Urgente",
                        },
                    });
                }
            }
        );
    
        // 3. Listener réception notification au premier plan
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log("🔔 Notification reçue en avant-plan:", 
                    notification.request.content.title
                );
            }
        );
    
        // 🔄 Nettoyage listeners
        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    
    }, []);
    

    // Ce composant ne rend rien visuellement, il est uniquement fonctionnel.
    return null; 
}