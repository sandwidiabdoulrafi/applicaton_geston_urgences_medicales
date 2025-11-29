import { View, Text, StyleSheet, TouchableOpacity, Platform, Keyboard, ActivityIndicator, TextInput, Alert, FlatList, KeyboardAvoidingView, Animated } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import messageService from '../../../Routes/routeService/messageService'
import socket from "../../../Routes/socket/socketClient"
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Components
import Message from '@/types/Message';
import LoadingAnimation from '@/components/LoadingAnimation';
import TakePhoto from '@/components/chat/TakePhoto';
import PickImage from '@/components/chat/PickImage';
import PickVideo from '@/components/chat/PickVideo';
import PickDocument from '@/components/chat/PickDocument';
import RenderMessage from '@/components/renderMessage';
import DeleteMessage from '@/components/ui/DeleteMessage';
import roomMessages from '@/Routes/routeRoom/roomMessages.js';
import ShowImagePreview from '@/components/chat/ShowImagePreview';
import TypingIndicator from './typingIndicator';
import { UPLOAD_MEDIA_MESSAGE } from '@/Routes/routesBackend/routePath';

export default function ChatUrgence() {

    /** ---------------------------------------------------------
     *  STATES / REFS
     * --------------------------------------------------------*/
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [previewUri, setPreviewUri] = useState('');
    const [showMediaOptions, setShowMediaOptions] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
    const recording = useRef<Audio.Recording | null>(null);
    const recordingInterval = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<TextInput>(null);
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const[isOtherUserTyping, setIsOtherUserTyping]=useState<boolean>()

    const pulseAnim = useRef(new Animated.Value(1)).current;

    const { id, urgenceIntitule } = useLocalSearchParams<{
        id: string;
        urgenceIntitule: string;
    }>();

    const router = useRouter();



    /** ---------------------------------------------------------
     *  LOAD MESSAGES FROM LOCAL DB
     * --------------------------------------------------------*/
    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            const data = await roomMessages.getMessagesByUrgence(id);
            setMessages(data);

            console.log(`✅ ${data.length} messages chargés localement pour urgence ${id}`);

            if (data.length > 0) {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: !isLoading });
                }, 100);
            }
        } catch (e) {
            console.error("❌ Erreur chargement messages:", e);
            Alert.alert('Erreur', 'Impossible de charger les messages');
        } finally {
            setIsLoading(false);
        }
    };



    useEffect(() => {
        console.log("👂 Écoute du signal 'typing' pour urgence", id);

        socket.on("user:typing", ({ idUrgence, isTyping, sender }) => {
            // ✅ Afficher uniquement si c'est l'AUTRE utilisateur qui écrit
            if (idUrgence === parseInt(id) && sender !== 'patient') {
                console.log(`✍️ ${sender} typing: ${isTyping}`);
                setIsOtherUserTyping(isTyping);
            }
        });

        return () => {
            socket.off("user:typing");
        };
    }, [id]);




    /** ---------------------------------------------------------
     *  SEND TEXT MESSAGE
     * --------------------------------------------------------*/
    const sendTextMessage = async () => {
        const trimmed = inputText.trim();
        if (!trimmed || isSending) return;

        setIsSending(true);

        try {
            // 1️⃣ ID temporaire pour affichage optimiste
            const tempId = `temp-${Date.now()}`;
            const timestamp = new Date().toISOString();

            const tempMessage: Message = {
                idMessage: tempId,
                idUrgence: parseInt(id),
                text: trimmed,
                type: 'text',
                sender: 'patient',
                timestamp,
                status: 'envoi'
            };

            // 2️⃣ Afficher immédiatement dans l'UI
            setMessages(prev => [...prev, tempMessage]);
            setInputText('');
            inputRef.current?.blur();

            // 3️⃣ Envoyer au backend via Socket
            socket.emit("message:add", {
                idUrgence: parseInt(id),
                text: trimmed,
                type: 'text',
                sender: 'patient',
                timestamp
            });

            // 4️⃣ Sauvegarder localement (backup)
            const result = await roomMessages.addMessage(tempMessage);

            if (!result.success) {
                // Retirer le message temporaire en cas d'échec local
                setMessages(prev => prev.filter(m => m.idMessage !== tempId));
                Alert.alert('Erreur', "Impossible de sauvegarder localement");
            }

        } catch (e) {
            console.error("❌ Erreur sendTextMessage:", e);
            Alert.alert('Erreur', "Une erreur est survenue");
        } finally {
            setIsSending(false);
        }
    };

    /** ---------------------------------------------------------
     *  SEND MEDIA MESSAGE
     * --------------------------------------------------------*/
    const sendMediaMessage = async (
        asset: any, 
        type: 'image' | 'video' | 'document' | 'audio',
    ) => {
        const tempId = `temp-${Date.now()}`;

        try {
            setIsSending(true);
            const timestamp = new Date().toISOString();
            const fileName = asset.fileName ?? `${type}_${Date.now()}.${getExtension(type)}`;
    
            // 1️⃣ AFFICHER IMMÉDIATEMENT (optimistic UI)
            const tempMessage: Message = {
                idMessage: tempId,
                idUrgence: parseInt(id),
                type,
                uri: asset.uri,           // URI local temporaire
                mediaUrl: null,           // Sera rempli après upload
                fileName,
                duration: asset.duration,
                sender: "patient",
                timestamp,
                status: "envoi"           
            };
    
            setMessages(prev => [...prev, tempMessage]);
            console.log("📤 Message temporaire affiché");
    
            // 2️⃣ UPLOAD VERS LE SERVEUR
            const formData = new FormData();
            formData.append('file', {
                uri: asset.uri,
                type: asset.type || getMimeType(type),
                name: fileName,
            } as any);
            formData.append('idUrgence', id);
            formData.append('sender', 'patient');
            formData.append('type', type);
    
            console.log("🔄 Upload en cours...");

    
            const uploadResponse = await messageService.uploadMedia(formData);


            if (!uploadResponse.data) {
                throw new Error(`Erreur upload: ${uploadResponse?.status}`);
            }
    
            const { mediaUrl, fileName: uploadedFileName } = await uploadResponse.data;
            console.log("✅ Image uploadée:", uploadResponse?.data);
    
            // 3️⃣ ENVOYER VIA SOCKET avec l'URL du serveur
            const messageData = {
                idUrgence: parseInt(id),
                type,
                mediaUrl,              // ✅ URL accessible par tous
                fileName: uploadedFileName || fileName,
                duration: asset.duration,
                sender: "patient",
                timestamp
            };
    
            socket.emit("message:add", messageData);
            console.log("📡 Message envoyé via socket");
    
            // 4️⃣ SAUVEGARDER LOCALEMENT avec l'URL
            const finalMessage: Message = {
                ...tempMessage,
                mediaUrl,             
                uri: null,    
                status: "envoye"
            };
    
            const result = await roomMessages.addMessage(finalMessage);
    
            if (result.success) {
                // 5️⃣ METTRE À JOUR L'UI avec l'URL finale
                setMessages(prev => 
                    prev.map(m => 
                        m.idMessage === tempId 
                            ? { ...m, mediaUrl, status: "envoye" }
                            : m
                    )
                );
                console.log("✅ Message sauvegardé et mis à jour");
            } else {
                throw new Error("Erreur sauvegarde locale");
            }
    
        } catch (error) {
            console.error("❌ Erreur sendMediaMessage:", error);
            
            // Marquer le message comme échoué
            setMessages(prev => 
                prev.map(m => 
                    m.idMessage === tempId 
                        ? { ...m, status: "echec" }
                        : m
                )
            );
            
            Alert.alert(
                'Erreur d\'envoi', 
                "Impossible d'envoyer le fichier. Réessayer ?",
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Réessayer', onPress: () => sendMediaMessage(asset, type) }
                ]
            );
        } finally {
            setIsSending(false);
        }
    };
    
    // Fonctions utilitaires
    const getExtension = (type: string): string => {
        const extensions = {
            image: 'jpg',
            video: 'mp4',
            audio: 'mp3',
            document: 'pdf'
        };
        return extensions[type] || 'bin';
    };
    
    const getMimeType = (type: string): string => {
        const mimeTypes = {
            image: 'image/jpeg',
            video: 'video/mp4',
            audio: 'audio/mpeg',
            document: 'application/pdf'
        };
        return mimeTypes[type] || 'application/octet-stream';
    };
    
    /** ---------------------------------------------------------
     *  DELETE MESSAGE
     * --------------------------------------------------------*/
    const deleteMessage = async () => {
        if (!selectedMessage) return;

        try {
            // Retirer immédiatement de l'UI
            setMessages(prev => prev.filter(msg => msg.idMessage !== selectedMessage));
            setShowDeleteModal(false);

            // Envoyer au backend
            socket.emit("message:delete", { idMessage: selectedMessage });

            // Supprimer localement
            const result = await roomMessages.deleteMessage(selectedMessage);

            if (!result.success) {
                await loadMessages(); // Restaurer en cas d'échec
                Alert.alert('Erreur', 'Impossible de supprimer le message');
            }

            setSelectedMessage(null);

        } catch (e) {
            console.error("❌ Erreur deleteMessage:", e);
            await loadMessages();
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSelectedMessage(null);
    };

    /** ---------------------------------------------------------
     *  KEYBOARD LISTENER
     * --------------------------------------------------------*/
    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            e => setKeyboardHeight(e.endCoordinates.height)
        );

        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    /** ---------------------------------------------------------
     *  RECORDING PULSE ANIMATION
     * --------------------------------------------------------*/
    useEffect(() => {
        if (isRecording) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 600,
                        useNativeDriver: true
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true
                    })
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [isRecording]);

    /** ---------------------------------------------------------
     *  CLEANUP ON UNMOUNT
     * --------------------------------------------------------*/
    useEffect(() => {
        return () => {
            if (recording.current) {
                recording.current.stopAndUnloadAsync().catch(() => {});
                recording.current = null;
            }
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }

            if(typingTimeoutRef.current){
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    /** ---------------------------------------------------------
     *  PERMISSIONS
     * --------------------------------------------------------*/
    const requestPermissions = async () => {
        const camera = await ImagePicker.requestCameraPermissionsAsync();
        const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const audio = await Audio.requestPermissionsAsync();

        if (!camera.granted || !media.granted || !audio.granted) {
            Alert.alert(
                'Permissions requises',
                'Veuillez autoriser la caméra, la galerie et le microphone.'
            );
        }
    };

    /** ---------------------------------------------------------
     *  RECORDING FUNCTIONS
     * --------------------------------------------------------*/
    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true
            });

            const { recording: newRec } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recording.current = newRec;
            setIsRecording(true);
            setRecordingDuration(0);

            recordingInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (e) {
            console.error(e);
            Alert.alert('Erreur', "Impossible de démarrer l'enregistrement");
        }
    };

    const stopRecording = async () => {
        try {
            if (!recording.current) return;

            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }

            const status = await recording.current.getStatusAsync();
            if (status.isRecording) {
                await recording.current.stopAndUnloadAsync();
            }

            const uri = recording.current.getURI();
            recording.current = null;

            if (uri && recordingDuration > 0) {
                await sendMediaMessage(uri, 'audio', 'audio.m4a', recordingDuration);
            }

            setIsRecording(false);
            setRecordingDuration(0);
        } catch (e) {
            console.error(e);
        }
    };

    const cancelRecording = async () => {
        try {
            if (!recording.current) return;

            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }

            const status = await recording.current.getStatusAsync();
            if (status.isRecording) {
                await recording.current.stopAndUnloadAsync();
            }

            recording.current = null;
        } catch (e) {
            console.error(e);
        } finally {
            setIsRecording(false);
            setRecordingDuration(0);
        }
    };

    /** ---------------------------------------------------------
     *  UTILS
     * --------------------------------------------------------*/
    const formatDuration = (sec: number) => {
        const min = Math.floor(sec / 60);
        const s = sec % 60;
        return `${min}:${s.toString().padStart(2, '0')}`;
    };






    // mise en place de notif disant que l'utilisateur est la ecrire 

    const handleTyping = (text: string)=>{

        setInputText(text);
        
        if(text.trim().length>0){
            socket.emit("user:typing",{
                idUrgence: parseInt(id),
                isTyping: true,
                sender: 'patient'
            });

            // Annuler le timeout précédent
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Émettre "typing: false" après 2 secondes d'inactivité
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("user:typing", {
                    idUrgence: parseInt(id),
                    isTyping: false,
                    sender: 'patient'
                });
            }, 2000);

            // Si on efface tout le texte, arrêter immédiatement
            socket.emit("user:typing", {
                idUrgence: parseInt(id),
                isTyping: false,
                sender: 'patient'
            });
        }

    }

    useEffect(() => {
        return () => {
            // ✅ Arrêter le signal typing en quittant la page
            socket.emit("user:typing", {
                idUrgence: parseInt(id),
                isTyping: false,
                sender: 'patient'
            });

            if (recording.current) {
                recording.current.stopAndUnloadAsync().catch(() => {});
                recording.current = null;
            }
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);




    /** ---------------------------------------------------------
     *  RENDER
     * --------------------------------------------------------*/
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* HEADER */}
            <Stack.Screen
                options={{
                    title: urgenceIntitule || 'Discussion',
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ marginLeft: 8 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    )
                }}
            />

            {/* MESSAGES */}
            {isLoading ? (
                <LoadingAnimation />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.idMessage}
                    renderItem={({ item }) => (
                        <RenderMessage
                            item={item}
                            selectedMessage={selectedMessage}
                            setPreviewUri={setPreviewUri}
                            setShowImagePreview={setShowImagePreview}
                            setSelectedMessage={setSelectedMessage}
                            setShowDeleteModal={setShowDeleteModal}
                        />
                    )}
                    contentContainerStyle={styles.messagesListContent}
                    onContentSizeChange={() =>
                        flatListRef.current?.scrollToEnd({ animated: true })
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyMessagesContainer}>
                            <Ionicons
                                name="chatbubble-outline"
                                size={64}
                                color="#BDC3C7"
                            />
                            <Text style={styles.emptyMessagesText}>
                                Aucun message pour l'instant
                            </Text>
                            <Text style={styles.emptyMessagesSubText}>
                                Commencez la conversation
                            </Text>
                        </View>
                    }
                />
            )}


            {isOtherUserTyping && (
                <View style={styles.typingIndicator}>
                    <Text style={styles.typingText}>L'établissement est en train d'écrire</Text>
                    <TypingIndicator dotColor="#2E86C1" dotSize={8} />
                </View>
            )}




            {/* MEDIA OPTIONS */}
            {showMediaOptions && (
                <View
                    style={[
                        styles.mediaOptionsContainer,
                        { bottom: Platform.OS === 'ios' ? 70 + keyboardHeight : 70 }
                    ]}
                >
                    <TakePhoto sendMediaMessage={sendMediaMessage} setShowMediaOptions={setShowMediaOptions} />
                    <PickImage sendMediaMessage={sendMediaMessage} setShowMediaOptions={setShowMediaOptions} />
                    <PickVideo sendMediaMessage={sendMediaMessage} setShowMediaOptions={setShowMediaOptions} />
                    <PickDocument sendMediaMessage={sendMediaMessage} setShowMediaOptions={setShowMediaOptions} />
                </View>
            )}

            {/* RECORDING BAR */}
            {isRecording ? (
                <View style={styles.recordingBar}>
                    <View style={styles.recordingIndicator}>
                        <Animated.View
                            style={[
                                styles.recordingDot,
                                { transform: [{ scale: pulseAnim }] }
                            ]}
                        />
                        <Text style={styles.recordingText}>
                            {formatDuration(recordingDuration)}
                        </Text>
                    </View>

                    <View style={styles.recordingActions}>
                        <TouchableOpacity onPress={cancelRecording} style={styles.recordingButton}>
                            <Ionicons name="close" size={28} color="#FF3B30" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={stopRecording}
                            style={[styles.recordingButton, styles.sendRecordingButton]}
                        >
                            <Ionicons name="send" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                /** INPUT BAR **/
                <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                        <TouchableOpacity
                            style={styles.mediaButton}
                            onPress={() => setShowMediaOptions(!showMediaOptions)}
                            disabled={isSending}
                        >
                            <Ionicons
                                name={showMediaOptions ? 'close' : 'add'}
                                size={26}
                                color={isSending ? '#CCC' : '#007AFF'}
                            />
                        </TouchableOpacity>

                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Écrivez un message..."
                            placeholderTextColor="#999"
                            value={inputText}
                            onChangeText={handleTyping}
                            onFocus={() => setShowMediaOptions(false)}
                            multiline
                            editable={!isSending}
                        />

                        {isSending ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : inputText.trim() ? (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.sendButton]}
                                onPress={sendTextMessage}
                            >
                                <Ionicons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.micButton]}
                                onPress={startRecording}
                            >
                                <Ionicons name="mic" size={22} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* IMAGE PREVIEW */}
            <ShowImagePreview 
                showImagePreview={showImagePreview} 
                setShowImagePreview={setShowImagePreview} 
                previewUri={previewUri}
            />

            {/* DELETE MODAL */}
            <DeleteMessage
                showDeleteModal={showDeleteModal}
                cancelDelete={cancelDelete}
                deleteMessage={deleteMessage}
            />
        </KeyboardAvoidingView>
    );
}

/** ---------------------------------------------------------
 *  STYLES (IDENTIQUES)
 * --------------------------------------------------------*/
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    messagesListContent: {
        paddingVertical: 12,
        paddingBottom: 20
    },
    emptyMessagesContainer: {
        marginTop: 100,
        alignItems: 'center',
        paddingHorizontal: 40
    },
    emptyMessagesText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7F8C8D',
        marginTop: 16
    },
    emptyMessagesSubText: {
        fontSize: 13,
        color: '#95A5A6',
        marginTop: 8
    },

    /** Input bar */
    inputWrapper: {
        paddingHorizontal: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 12,
        paddingTop: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 8,
        paddingVertical: 6,
        minHeight: 44
    },
    input: {
        flex: 1,
        fontSize: 15,
        maxHeight: 100,
        paddingHorizontal: 8,
        paddingVertical: 8
    },
    mediaButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4
    },
    sendButton: {
        backgroundColor: '#007AFF'
    },
    micButton: {
        backgroundColor: '#E8E8E8'
    },

    /** Media options */
    mediaOptionsContainer: {
        position: 'absolute',
        bottom: 70,
        left: 16,
        right: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8
    },

    /** Recording bar */
    recordingBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        marginHorizontal: 4,
        marginBottom: 32,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B30',
        marginRight: 12
    },
    recordingText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        fontVariant: ['tabular-nums']
    },
    recordingActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    recordingButton: {
        marginLeft: 16,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    sendRecordingButton: {
        backgroundColor: '#007AFF'
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F0F0F0',
    },
    typingText: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        marginRight: 8,
    },
    lottieTyping: {
        width: 50,
        height: 30,
    },

});