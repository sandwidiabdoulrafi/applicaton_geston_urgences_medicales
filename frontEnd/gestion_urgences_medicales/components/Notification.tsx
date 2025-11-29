// Notification.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Nous configurons ici le comportement global des notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        // Avec le nouvel SDK d’Expo, nous devons aussi préciser ces propriétés
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface NotificationComponentProps {
    onNotificationReceived?: (notification: Notifications.Notification) => void;
    onNotificationTapped?: (data: any) => void;
}

export default function NotificationComponent({
    onNotificationReceived,
    onNotificationTapped
}: NotificationComponentProps) {

    // Nous stockons le token Expo push ici
    const [expoPushToken, setExpoPushToken] = useState<string>('');

    // Nous créons des références pour écouter les notifications reçues
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        initializeNotifications();
    
        // Listener quand une notification arrive
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('📬 Notification reçue (app ouverte):', notification.request.content.title);
            onNotificationReceived?.(notification);
        });
    
        // Listener quand l'utilisateur clique sur la notif
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('👆 Notification cliquée:', response.notification.request.content.title);
            const data = response.notification.request.content.data;
            onNotificationTapped?.(data);
        });
    
        // Nettoyage
        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);    

    // Nous obtenons le token et demandons la permission
    const initializeNotifications = async () => {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            setExpoPushToken(token);
            console.log('✅ Token push obtenu:', token);
            // Ici nous pourrons envoyer le token au backend si nécessaire
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.status}>
                {expoPushToken ? '✅ Notifications activées' : '⏳ Initialisation...'}
            </Text>
        </View>
    );
}

// Nous demandons les permissions et récupérons le token
async function registerForPushNotificationsAsync() {
    let token;

    // Sur Android, nous configurons le canal de notification
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // Nous vérifions si l'utilisateur utilise un device physique (obligatoire pour les push)
    if (!Device.isDevice) {
        console.warn('⚠️ Les notifications push nécessitent un appareil physique');
        return;
    }

    // Nous vérifions et demandons la permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    // Si l'utilisateur refuse, nous l'informons
    if (finalStatus !== 'granted') {
        Alert.alert(
            'Permissions requises',
            'Les notifications sont nécessaires pour recevoir les alertes d’urgence'
        );
        return;
    }

    // Nous récupérons enfin le token Expo
    try {
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
        })).data;
    } catch (error) {
        console.error('Erreur lors de l’obtention du token:', error);
    }

    return token;
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    status: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'center',
    },
});

// Nous exposons ici des fonctions utilitaires pour envoyer des notifications
export const NotificationService = {
    // Nous envoyons une notification locale instantanée
    sendLocal: async (title: string, body: string, data?: any) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
        });
    },

    // Nous programmons une notification locale
    schedule: async (title: string, body: string, seconds: number, data?: any) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                seconds,
                repeats: false
            }
            
        });
    },

    // Nous envoyons une notification push via le serveur Expo
    sendPush: async (token: string, title: string, body: string, data?: any) => {
        const message = {
            to: token,
            sound: 'default',
            title,
            body,
            data: data || {},
            priority: 'high',
        };

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            console.log('Push notification envoyée:', result);
            return result;
        } catch (error) {
            console.error('Erreur envoi push:', error);
            throw error;
        }
    },

    // Nous annulons toutes les notifications programmées
    cancelAll: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
    },
};
