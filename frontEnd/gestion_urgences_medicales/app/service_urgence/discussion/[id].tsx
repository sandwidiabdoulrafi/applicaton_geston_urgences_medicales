import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import socketServiceSanter from '@/Routes/socket/SocketServiceSant'
import { addNewMessage, getAllMessageById, updateMessageStatut } from '@/Routes/routeRoom/serviceSanteRoomService'
import { Ionicons } from '@expo/vector-icons'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import TypingIndicator from '@/components/typingIndicator'

interface Message {
    id: number | string,
    idUrgence: string,
    sender: 'patient' | 'service'
    text?: string
    type: 'text' | 'image' | 'video' | 'document' | 'audio'
    uri?: string
    fileName?: string
    duration?: number
    timestamp: string
    status: 'envoi' | 'envoye' | 'erreur' | 'lu',
    idTmp?: string
}

export default function Chat() {
    const { id, intitule, priorite, idPatient } = useLocalSearchParams()
    const [load, setLoad] = useState<boolean>(false)
    const [discussions, setDiscussions] = useState<Message[]>([])
    const discussionsRef = useRef<Message[]>([]) // ✅ REF pour accéder au state actuel
    const [urgenceTitle, setUrgenceTitle] = useState<string>('')
    const [userRole] = useState<'patient' | 'service'>('service')
    const [currentUserId] = useState<number>(1)
    const router = useRouter();
    const [isOtherUserTyping, setIsOtherUserTyping] = useState<boolean>(false);

    // ✅ Synchroniser la ref avec le state
    useEffect(() => {
        discussionsRef.current = discussions;
    }, [discussions]);

    // ═══════════════════════════════════════════════════════════
    // 1️⃣ CHARGEMENT INITIAL + SETUP SOCKET
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!id) {
            console.error("❌ ID d'urgence manquant");
            return;
        }

        const fetchDiscussion = async () => {
            try {
                setLoad(true)
                const response = await getAllMessageById(id)

                if (response.success && response.data) {
                    console.log(`✅ ${response.data.length} messages chargés`);
                    console.log(`\n\n\n============ messages chargés: `,response.data);
                    setDiscussions(response.data)
                } else {
                    console.warn("⚠️ Aucun message trouvé");
                    if (intitule) {
                        setUrgenceTitle(intitule as string)
                    }
                }
            } catch (error) {
                console.error("❌ Erreur chargement messages:", error)
            } finally {
                setLoad(false)
            }
        }

        fetchDiscussion()

        // ✅ REJOINDRE LA ROOM DE L'URGENCE
        console.log(`📤 Émission joinUrgence: ${id}`);
        socketServiceSanter.emit("joinUrgence", { idUrgence: id })

        // ✅ DÉFINIR LES HANDLERS (qui utilisent la ref)
        const handleIncomingMessage = async (msg: Message) => {
            console.log("\n┌─────────────────────────────────────────┐");
            console.log("│ 📥 SERVICE - MESSAGE REÇU               │");
            console.log("└─────────────────────────────────────────┘");
            console.log("   • De:", msg.sender);
            console.log("   • Texte:", msg.text);
            console.log("   • ID Urgence:", msg.idUrgence);
            console.log("   • idTmp :", msg.idTmp);
            console.log("   • Mon urgence:", id);
            
            // ✅ Vérifier que c'est pour CETTE urgence
            if (msg.idUrgence !== id) {
                console.log("⚠️ Message ignoré: urgence différente");
                return
            }

            // ✅ Ignorer nos propres messages
            if (msg.sender === userRole) {
                console.log("⚠️ Message ignoré: c'est le mien");
                return
            }

            try {
                // Sauvegarder localement
                console.log("✅ avant que le Message soit sauvegardé localement msg == ", msg)
                const responseAdd = await addNewMessage(msg)

                if(responseAdd.success){
                    console.log("✅ Message sauvegardé localement")
                }
                
                // Ajouter à la liste (éviter doublons)
                setDiscussions(prev => {
                    const exists = prev.some(m => m.idTmp === msg.idTmp)
                    if (exists) {
                        console.log("⚠️ Doublon évité");
                        return prev
                    }
                    console.log("✅ Message ajouté à l'UI");
                    return [...prev, msg]
                })


                if (msg.id) {
                    // 🚨 CHANGEMENT : Marquer comme lu pour l'émetteur (le patient)
                    // 1. Mettre à jour SQLite
                    await updateMessageStatut(msg.id, 'lu'); 

                    // 2. Émettre au socket
                    socketServiceSanter.emit("updateMessageStatus", {
                        idMessage: msg.id,
                        status: 'lu',
                        idUrgence: id,
                    });
                    
                   // 3. Mettre à jour l'UI
                    setDiscussions(prev =>
                        prev.map(m =>
                            m.id === msg.id
                                ? { ...m, status: 'lu' }
                                : m
                        )
                    );
                }

            } catch (error) {
                console.error("❌ Erreur réception:", error)
            }
        }

        const handleMessageSuccess = async (response: any) => {
            console.log("\n🎉 CONFIRMATION SERVEUR");
            console.log("   • ID Firebase:", response.data?.id);
            console.log("   • ID Tmp:", response.data?.idTmp);
            console.log("   • Discussions actuelles:", discussionsRef.current.length); // ✅ DEBUG
        
            const idFirebase = response.data?.id;
            const idTmp = response.data?.idTmp;
        
            if (!idFirebase || !idTmp) {
                console.log("⚠️ Impossible de traiter la confirmation, données manquantes.");
                return;
            }
        
            // 1️⃣ Chercher le message dans la REF (pas dans le state)
            const message = discussionsRef.current.find(m => m.idTmp === idTmp);
            
            if (!message) {
                console.log(`⚠️ Message ${idTmp} introuvable dans discussions`);
                console.log("📋 IDs disponibles:", discussionsRef.current.map(m => m.idTmp));
                return;
            }

            console.log("✅ Message trouvé dans discussions:", message.text);

            // 2️⃣ Mettre à jour le state avec id Firebase ET status 'lu' en une seule fois
            setDiscussions(prev =>
                prev.map(msg =>
                    msg.idTmp === idTmp
                        ? { ...msg, id: idFirebase, status: 'lu' }
                        : msg
                )
            );

            // 3️⃣ Mettre à jour SQLite avec idTmp
            try {
                const res = await updateMessageStatut(idTmp, 'lu');

                if (!res.success) {
                    console.log("❌ Erreur SQLite:", res.error);
                    return;
                }

                // 4️⃣ Émettre au socket
                socketServiceSanter.emit("updateMessageStatus", {
                    idMessage: idFirebase,
                    idTmp: idTmp,
                    status: 'lu',
                    idUrgence: id,
                });

                console.log(`✔️ Message ${idTmp} marqué 'lu'`);
            } catch (err) {
                console.log("❌ Exception handleMessageSuccess:", err);
            }
        };

        const handleMessageError = (error: any) => {
            console.error("\n❌ ERREUR SERVEUR:", error);
        }

        const handleTyping = ({ idUrgence, isTyping, sender }: any) => {
            console.log(`📨 Typing reçu:`, {
                idUrgence,
                myUrgence: id,
                isTyping,
                sender,
                myRole: userRole
            });
            
            // ✅ Afficher uniquement si c'est l'AUTRE utilisateur
            if (idUrgence === id && sender !== userRole) {
                console.log(`✍️ ${sender} est en train d'écrire: ${isTyping}`);
                setIsOtherUserTyping(isTyping);
            }
        }

        // ✅ ÉCOUTER LES ÉVÉNEMENTS SOCKET
        socketServiceSanter.on("receiveMessage", handleIncomingMessage)
        socketServiceSanter.on("messageSuccess", handleMessageSuccess)
        socketServiceSanter.on("messageError", handleMessageError)
        socketServiceSanter.on("user:typing", handleTyping)

        // Cleanup
        return () => {
            console.log("🧹 Nettoyage listeners service chat");
            socketServiceSanter.off("receiveMessage", handleIncomingMessage)
            socketServiceSanter.off("messageSuccess", handleMessageSuccess)
            socketServiceSanter.off("messageError", handleMessageError)
            socketServiceSanter.off("user:typing", handleTyping)
            socketServiceSanter.emit("leaveUrgence", { idUrgence: id })
        }
    }, [id])

    // ═══════════════════════════════════════════════════════════
    // 5️⃣ ENVOI D'UN MESSAGE
    // ═══════════════════════════════════════════════════════════
    const sendMessage = async (text: string) => {
        if (!text.trim()) return

        const urgenceId = id?.toString();
        if (!urgenceId) {
            console.error("❌ ID urgence manquant pour l'envoi");
            return;
        }

        const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const newMessage: Message = {
            id: 0,
            idUrgence: urgenceId,
            sender: userRole,
            text: text.trim(),
            type: 'text',
            timestamp: new Date().toISOString(),
            status: 'envoi',
            idTmp: uuid,
        }

        try {
            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📤 SERVICE - ENVOI MESSAGE");
            console.log("   • Texte:", newMessage.text);
            console.log("   • ID Urgence:", newMessage.idUrgence);
            console.log("   • idTmp:", newMessage.idTmp);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // Ajouter localement (optimistic UI)
            const localMessage = { ...newMessage, id: uuid, idTmp: uuid }
            setDiscussions(prev => [...prev, localMessage])

            // Sauvegarder en base locale
            const result = await addNewMessage(newMessage)

            if (result.success) {
                console.log("✅ Sauvegarde locale OK");

                const messageWithRealId = {
                    ...newMessage,
                    id: result.data?.id || uuid
                }

                // ✅ ENVOYER VIA SOCKET
                console.log("📤 Émission send_message via socket");
                socketServiceSanter.emit("send_message", messageWithRealId)
                
                // Mettre à jour le statut
                setDiscussions(prev => 
                    prev.map(msg => 
                        msg.idTmp === uuid
                            ? { ...messageWithRealId, status: 'envoye' } 
                            : msg
                    )
                )
                
                console.log("✅ Message envoyé");
            } else {
                console.error("❌ Échec sauvegarde locale");
                setDiscussions(prev => 
                    prev.map(msg => 
                        msg.idTmp === uuid
                            ? { ...msg, status: 'erreur' } 
                            : msg
                    )
                )
            }
        } catch (error) {
            console.error("❌ Erreur envoi:", error)
            setDiscussions(prev => 
                prev.map(msg => 
                    msg.idTmp === uuid
                        ? { ...msg, status: 'erreur' } 
                        : msg
                )
            )
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 6️⃣ RÉESSAYER L'ENVOI
    // ═══════════════════════════════════════════════════════════
    const retryMessage = async (messageId: number | string) => {
        const messageToRetry = discussions.find(m => m.id === messageId)
        if (!messageToRetry) return

        console.log("🔄 Renvoi du message:", messageId)

        setDiscussions(prev => 
            prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, status: 'envoi' } 
                    : msg
            )
        )

        try {
            socketServiceSanter.emit("send_message", messageToRetry)
            setDiscussions(prev => 
                prev.map(msg => 
                    msg.id === messageId 
                        ? { ...msg, status: 'envoye' } 
                        : msg
                )
            )
        } catch (error) {
            console.error("❌ Erreur renvoi:", error)
            setDiscussions(prev => 
                prev.map(msg => 
                    msg.id === messageId 
                        ? { ...msg, status: 'erreur' } 
                        : msg
                )
            )
        }
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
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

                    {isOtherUserTyping && (
                        <View style={{flexDirection:'row', justifyContent:'flex-start', marginBottom: 8, paddingLeft:8, backgroundColor:'transparent'}}>
                            <View style={styles.typingIndicator}>
                                <TypingIndicator dotColor="#2E86C1" dotSize={8} />
                            </View>
                        </View>
                    )} 
                    
                    <MessageInput 
                        onSend={sendMessage} 
                        id={id?.toString() || ''} 
                        userRole={userRole} 
                        socket={socketServiceSanter} 
                    />
                </>
            )}
        </KeyboardAvoidingView>
    )
}

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
        backgroundColor: '#f5f7fa',
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
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomEndRadius:8,
        borderTopLeftRadius:8,
        backgroundColor: '#fab346',
    },
})