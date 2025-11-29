import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import socketServiceSanter from '@/Routes/socket/SocketServiceSant'
import { addNewMessage, getAllMessageById } from '@/Routes/routeRoom/serviceSanteRoomService'
import { Ionicons } from '@expo/vector-icons'
import { v4 as uuidv4 } from 'uuid'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

interface Message {
    id: number
    idMessage: string
    idUrgence: string
    idEmeteur: number
    idRecepteur: number
    sender: 'patient' | 'service'
    text?: string
    type: 'text' | 'image' | 'video' | 'document' | 'audio'
    uri?: string
    fileName?: string
    duration?: number
    timestamp: string
    status: 'envoi' | 'envoye' | 'erreur' | 'lu'
    intitule?: string
}

export default function Chat() {
    const { id, intitule, priorite, idPatient } = useLocalSearchParams()
    const [load, setLoad] = useState<boolean>(false)
    const [discussions, setDiscussions] = useState<Message[]>([])
    const [urgenceTitle, setUrgenceTitle] = useState<string>('')
    const [userRole] = useState<'patient' | 'service'>('service')
    const [currentUserId] = useState<number>(1) // ID du service/assistant connecté
    const router = useRouter()

    useEffect(() => {
        const fetchDiscussion = async () => {
            try {
                setLoad(true)
                const response = await getAllMessageById(id)

                if (response.success && response.data) {
                    setDiscussions(response.data)
                    
                    // Récupérer le titre de l'urgence
                    if (response.data.length > 0 && response.data[0].intitule) {
                        setUrgenceTitle(response.data[0].intitule)
                    } else if (intitule) {
                        setUrgenceTitle(intitule as string)
                    }
                } else {
                    console.warn("Aucun message trouvé pour cette urgence")
                    if (intitule) {
                        setUrgenceTitle(intitule as string)
                    }
                }
            } catch (error) {
                console.error("❌ Erreur lors de la récupération des messages:", error)
            } finally {
                setLoad(false)
            }
        }

        fetchDiscussion()

        // Écouter les messages entrants via socket
        socketServiceSanter.on("receiveMessage", handleIncomingMessage)

        // Joindre la room de cette urgence
        socketServiceSanter.emit("joinUrgence", { idUrgence: id })

        return () => {
            socketServiceSanter.off("receiveMessage", handleIncomingMessage)
            socketServiceSanter.emit("leaveUrgence", { idUrgence: id })
        }
    }, [id])

    const handleIncomingMessage = async (msg: Message) => {
        // Vérifier que le message appartient à cette urgence
        if (msg.idUrgence !== id) return

        // Ne pas ajouter si c'est notre propre message
        if (msg.idEmeteur === currentUserId) return

        try {
            // Sauvegarder le message reçu
            await addNewMessage(msg)
            
            // Ajouter à la liste des discussions
            setDiscussions(prev => {
                // Éviter les doublons
                const exists = prev.some(m => m.idMessage === msg.idMessage)
                if (exists) return prev
                return [...prev, msg]
            })
        } catch (error) {
            console.error("❌ Erreur lors de la réception du message:", error)
        }
    }

    const sendMessage = async (text: string) => {
        if (!text.trim()) return

        const newMessage: Message = {
            id: 0,
            idMessage:null , //genere par le backend 
            idUrgence: id as string,
            idEmeteur: currentUserId,
            idRecepteur: parseInt(idPatient as string) || 0,
            sender: userRole,
            text: text.trim(),
            type: 'text',
            timestamp: new Date().toISOString(),
            status: 'envoi'
        }

        try {
            // Ajouter le message localement immédiatement (optimistic UI)
            setDiscussions(prev => [...prev, newMessage])

            // Sauvegarder en base de données locale
            const result = await addNewMessage(newMessage)

            if (result.success) {
                // Envoi via socket au serveur
                socketServiceSanter.emit("sendMessage", newMessage)
                
                // Mettre à jour le statut à "envoye" après succès
                setDiscussions(prev => 
                    prev.map(msg => 
                        msg.idMessage === newMessage.idMessage 
                            ? { ...msg, status: 'envoye' } 
                            : msg
                    )
                )
            } else {
                // En cas d'erreur, marquer le message comme erreur
                console.error("❌ Échec de la sauvegarde du message")
                setDiscussions(prev => 
                    prev.map(msg => 
                        msg.idMessage === newMessage.idMessage 
                            ? { ...msg, status: 'erreur' } 
                            : msg
                    )
                )
            }
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi du message:", error)
            
            // Marquer comme erreur
            setDiscussions(prev => 
                prev.map(msg => 
                    msg.idMessage === newMessage.idMessage 
                        ? { ...msg, status: 'erreur' } 
                        : msg
                )
            )
        }
    }

    const retryMessage = async (messageId: string) => {
        const messageToRetry = discussions.find(m => m.idMessage === messageId)
        if (!messageToRetry) return

        // Mettre à jour le statut à "envoi"
        setDiscussions(prev => 
            prev.map(msg => 
                msg.idMessage === messageId 
                    ? { ...msg, status: 'envoi' } 
                    : msg
            )
        )

        try {
            // Réessayer l'envoi
            socketServiceSanter.emit("sendMessage", messageToRetry)
            
            // Mettre à jour le statut à "envoye"
            setDiscussions(prev => 
                prev.map(msg => 
                    msg.idMessage === messageId 
                        ? { ...msg, status: 'envoye' } 
                        : msg
                )
            )
        } catch (error) {
            console.error("❌ Erreur lors du renvoi du message:", error)
            setDiscussions(prev => 
                prev.map(msg => 
                    msg.idMessage === messageId 
                        ? { ...msg, status: 'erreur' } 
                        : msg
                )
            )
        }
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            <Stack.Screen
                options={{
                    title: urgenceTitle || intitule || "Discussion",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <View style={styles.headerRight}>
                            {priorite && (
                                <View style={[
                                    styles.priorityBadge,
                                    { backgroundColor: getPriorityColor(priorite as string) }
                                ]}>
                                    <Text style={styles.priorityText}>
                                        {priorite}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )
                }}
            />

            {load ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#58D68D" />
                    <Text style={styles.loadingText}>Chargement des messages...</Text>
                </View>
            ) : (
                <>
                    <MessageList 
                        messages={discussions} 
                        userRole={userRole}
                        currentUserId={currentUserId}
                        onRetry={retryMessage}
                    />
                    <MessageInput onSend={sendMessage} />
                </>
            )}
        </KeyboardAvoidingView>
    )
}

// Fonction utilitaire pour la couleur de priorité
function getPriorityColor(priorite: string): string {
    switch (priorite.toLowerCase()) {
        case 'haute':
        case 'urgente':
            return '#e74c3c'
        case 'moyenne':
            return '#f39c12'
        case 'basse':
            return '#3498db'
        default:
            return '#95a5a6'
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa'
    },
    backButton: {
        marginLeft: 8,
        padding: 4
    },
    headerRight: {
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center'
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    priorityText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#7f8c8d'
    }
})