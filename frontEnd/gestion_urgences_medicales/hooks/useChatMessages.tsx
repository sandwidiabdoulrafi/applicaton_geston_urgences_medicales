
import { useState, useEffect, RefObject } from 'react';
import { FlatList, Alert } from 'react-native';
import roomMessages from '@/Routes/routeRoom/roomMessages.js';
import Message from '@/types/Message';

export function useChatMessages(urgenceId: string, flatListRef: RefObject<FlatList>) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMessages();

        // Polling pour les nouveaux messages (toutes les 3 secondes)
        const pollInterval = setInterval(() => {
            loadMessages(false);
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [urgenceId]);

    const loadMessages = async (showLoader = true) => {
        try {
            if (showLoader) {
                setIsLoading(true);
            }
            
            const data = await roomMessages.getMessagesByUrgence(urgenceId);
            setMessages(data);
            
            // Scroll vers le bas après chargement
            if (flatListRef.current && data.length > 0) {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: !showLoader });
                }, 100);
            }
        } catch (error) {
            console.error('Erreur chargement messages:', error);
            if (showLoader) {
                Alert.alert('Erreur', 'Impossible de charger les messages');
            }
        } finally {
            if (showLoader) {
                setIsLoading(false);
            }
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            const result = await roomMessages.deleteMessage(messageId);
            
            if (result.success) {
                setMessages(prevMessages => 
                    prevMessages.filter(msg => msg.idMessage !== messageId)
                );
                return { success: true };
            } else {
                Alert.alert('Erreur', 'Impossible de supprimer le message');
                return { success: false };
            }
        } catch (error) {
            console.error('Erreur suppression message:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
            return { success: false };
        }
    };

    return {
        messages,
        isLoading,
        loadMessages,
        deleteMessage
    };
}