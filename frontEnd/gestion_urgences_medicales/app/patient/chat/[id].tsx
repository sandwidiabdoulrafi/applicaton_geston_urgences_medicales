import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    TextInput, KeyboardAvoidingView, Platform, Image, 
    ActivityIndicator, Alert, Animated, Modal, Keyboard
} from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import roomMessages from '@/Routes/routeRoom/roomMessages.js';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import Message from '@/types/Message';
import RenderMessage from '@/components/renderMessage';
import DeleteMessage from '@/components/ui/DeleteMessage';

export default function ChatUrgence() {
    const { id, urgenceIntitule } = useLocalSearchParams<{
        id: string;
        urgenceIntitule: string;
    }>();
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [showMediaOptions, setShowMediaOptions] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [previewUri, setPreviewUri] = useState<string>('');
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const recording = useRef<Audio.Recording | null>(null);
    const recordingInterval = useRef<NodeJS.Timeout | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadMessages();
        requestPermissions();
        
        // Écouter les événements du clavier pour  Fermer les options quand le clavier apparaît
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
                setShowMediaOptions(false); 
            }
        );
        
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );
        
        // Polling pour les nouveaux messages (temps réel basique)
        const pollInterval = setInterval(() => {
            loadMessages();
        }, 3000); // Rafraîchir toutes les 3 secondes

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
            clearInterval(pollInterval);
            if (recording.current) {
                recording.current.stopAndUnloadAsync();
            }
        };
    }, [id]);

    useEffect(() => {
        if (isRecording) {
            startPulseAnimation();
        }
    }, [isRecording]);

    const requestPermissions = async () => {
        // Permissions pour la caméra
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        // Permissions pour la galerie
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        // Permissions pour le microphone
        const audioPermission = await Audio.requestPermissionsAsync();
        
        if (!cameraPermission.granted || !mediaPermission.granted || !audioPermission.granted) {
            Alert.alert(
                'Permissions requises',
                'L\'application a besoin d\'accéder à votre caméra, galerie et microphone.'
            );
        }
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const loadMessages = async () => {
        try {
            if (isLoading) {
                setIsLoading(true);
            }
            const data = await roomMessages.getMessagesByUrgence(id);
            setMessages(data);
            
            if (flatListRef.current && data.length > 0) {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: !isLoading });
                }, 100);
            }
        } catch (error) {
            console.error('Erreur chargement messages:', error);
            if (isLoading) {
                Alert.alert('Erreur', 'Impossible de charger les messages');
            }
        } finally {
            setIsLoading(false);
        }
    };


    const sendTextMessage = async () => {
        const trimmedText = inputText.trim();
        if (!trimmedText || isSending) return;

        try {
            setIsSending(true);
            
            if (trimmedText.length > 5000) {
                Alert.alert('Erreur', 'Le message est trop long (max 5000 caractères)');
                return;
            }

            const result = await roomMessages.addMessage({
                idUrgence: parseInt(id),
                text: trimmedText,
                type: 'text',
                sender: 'patient',
                timestamp: new Date().toISOString(),
                status: 'envoi'
            });

            if (result.success) {
                setInputText('');
                await loadMessages();
                inputRef.current?.blur();
            } else {
                Alert.alert('Erreur', 'Impossible d\'envoyer le message');
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi');
        } finally {
            setIsSending(false);
        }
    };

    const sendMediaMessage = async (
        uri: string, 
        type: 'image' | 'video' | 'document' | 'audio',
        fileName?: string,
        duration?: number
    ) => {
        try {
            setIsSending(true);
            setUploadProgress(0);

            // Obtenir la taille du fichier
            const fileInfo = await FileSystem.getInfoAsync(uri);
            const fileSize = fileInfo.exists ? fileInfo.size : 0;

            // Vérifier la taille (limite à 10MB)
            if (fileSize > 10 * 1024 * 1024) {
                Alert.alert('Erreur', 'Le fichier est trop volumineux (max 10MB)');
                return;
            }

            // Simuler la progression de l'upload
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const result = await roomMessages.addMessage({
                idUrgence: parseInt(id),
                type,
                uri,
                fileName,
                fileSize,
                duration,
                sender: 'patient',
                timestamp: new Date().toISOString(),
                status: 'envoi'
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result.success) {
                await loadMessages();
                setTimeout(() => setUploadProgress(0), 500);
            } else {
                Alert.alert('Erreur', 'Impossible d\'envoyer le fichier');
            }
        } catch (error) {
            console.error('Erreur envoi média:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi');
        } finally {
            setIsSending(false);
        }
    };

    const takePhoto = async () => {
        setShowMediaOptions(false);
        Keyboard.dismiss(); // Fermer le clavier
        
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
        });

        if (!result.canceled && result.assets[0]) {
            await sendMediaMessage(result.assets[0].uri, 'image');
        }
    };

    const pickImage = async () => {
        setShowMediaOptions(false);
        Keyboard.dismiss(); // Fermer le clavier
        
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
            await sendMediaMessage(result.assets[0].uri, 'image');
        }
    };

    const pickVideo = async () => {
        setShowMediaOptions(false);
        Keyboard.dismiss(); // Fermer le clavier
        
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await sendMediaMessage(
                result.assets[0].uri, 
                'video',
                undefined,
                result.assets[0].duration
            );
        }
    };

    const pickDocument = async () => {
        setShowMediaOptions(false);
        Keyboard.dismiss(); // Fermer le clavier
        
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                await sendMediaMessage(
                    result.uri, 
                    'document',
                    result.name
                );
            }
        } catch (error) {
            console.error('Erreur sélection document:', error);
        }
    };

    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            
            recording.current = newRecording;
            setIsRecording(true);
            setRecordingDuration(0);

            // Compteur de durée
            recordingInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Erreur démarrage enregistrement:', error);
            Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
        }
    };

    const stopRecording = async () => {
        try {
            if (!recording.current) return;

            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }

            await recording.current.stopAndUnloadAsync();
            const uri = recording.current.getURI();
            
            setIsRecording(false);
            
            if (uri && recordingDuration > 0) {
                await sendMediaMessage(uri, 'audio', 'Enregistrement vocal', recordingDuration);
            }
            
            recording.current = null;
            setRecordingDuration(0);
        } catch (error) {
            console.error('Erreur arrêt enregistrement:', error);
            Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement');
        }
    };

    const cancelRecording = async () => {
        try {
            if (recording.current) {
                await recording.current.stopAndUnloadAsync();
                recording.current = null;
            }
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }
            setIsRecording(false);
            setRecordingDuration(0);
        } catch (error) {
            console.error('Erreur annulation enregistrement:', error);
        }
    };

    
        const formatDuration = useCallback((seconds: number): string => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }, []);
    



    const deleteMessage = async () => {
        if (!selectedMessage) return;

        try {
            const result = await roomMessages.deleteMessage(selectedMessage);
            
            if (result.success) {
                setMessages(prevMessages => 
                    prevMessages.filter(msg => msg.idMessage !== selectedMessage)
                );
                setShowDeleteModal(false);
                setSelectedMessage(null);
            } else {
                Alert.alert('Erreur', 'Impossible de supprimer le message');
            }
        } catch (error) {
            console.error('Erreur suppression message:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSelectedMessage(null);
    };

    

   


    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{ 
                    title: urgenceIntitule || 'Discussion',
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
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

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2E86C1" />
                    <Text style={styles.loadingText}>Chargement des messages...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.idMessage}
                    renderItem={({ item }) => (
                        <RenderMessage
                        
                            item={item}
                            selectedMessage={selectedMessage}
                            setShowImagePreview={setShowImagePreview}
                            setSelectedMessage={setSelectedMessage}
                            setShowDeleteModal={setShowDeleteModal}
                            setPreviewUri={setPreviewUri}
                        />
                    )}
                    contentContainerStyle={styles.messagesListContent}
                    onContentSizeChange={() => 
                        flatListRef.current?.scrollToEnd({ animated: true })
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyMessagesContainer}>
                            <Ionicons name="chatbubble-outline" size={64} color="#BDC3C7" />
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

            {/* Barre de progression upload */}
            {uploadProgress > 0 && uploadProgress < 100 && (
                <View style={styles.uploadProgressContainer}>
                    <View style={styles.uploadProgressBar}>
                        <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
                    </View>
                    <Text style={styles.uploadProgressText}>Envoi en cours... {uploadProgress}%</Text>
                </View>
            )}

            {/* Options média */}
            {showMediaOptions && !isRecording && (
                <View style={[
                    styles.mediaOptionsContainer,
                    { bottom: Platform.OS === 'ios' ? 70 + keyboardHeight : 70 }
                ]}>
                    <TouchableOpacity 
                        style={styles.mediaOption}
                        onPress={takePhoto}
                    >
                        <View style={styles.mediaOptionIcon}>
                            <Ionicons name="camera" size={24} color="#fff" />
                        </View>
                        <Text style={styles.mediaOptionText}>Caméra</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.mediaOption}
                        onPress={pickImage}
                    >
                        <View style={[styles.mediaOptionIcon, { backgroundColor: '#FF9500' }]}>
                            <Ionicons name="images" size={24} color="#fff" />
                        </View>
                        <Text style={styles.mediaOptionText}>Galerie</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.mediaOption}
                        onPress={pickVideo}
                    >
                        <View style={[styles.mediaOptionIcon, { backgroundColor: '#FF3B30' }]}>
                            <Ionicons name="videocam" size={24} color="#fff" />
                        </View>
                        <Text style={styles.mediaOptionText}>Vidéo</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.mediaOption}
                        onPress={pickDocument}
                    >
                        <View style={[styles.mediaOptionIcon, { backgroundColor: '#5856D6' }]}>
                            <Ionicons name="document" size={24} color="#fff" />
                        </View>
                        <Text style={styles.mediaOptionText}>Document</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Barre d'input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.inputWrapper}
            >
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
                            <TouchableOpacity 
                                onPress={cancelRecording} 
                                style={styles.recordingButton}
                            >
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
                    <View style={styles.inputContainer}>
                        <TouchableOpacity 
                            style={styles.mediaButton}
                            onPress={() => {
                                Keyboard.dismiss();
                                setTimeout(() => {
                                    setShowMediaOptions(!showMediaOptions);
                                }, 100);
                            }}
                            disabled={isSending}
                        >
                            <Ionicons 
                                name={showMediaOptions ? "close" : "add"} 
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
                            onChangeText={setInputText}
                            onFocus={() => setShowMediaOptions(false)}
                            multiline
                            maxLength={5000}
                            editable={!isSending}
                        />

                        {isSending ? (
                            <View style={styles.actionButton}>
                                <ActivityIndicator size="small" color="#007AFF" />
                            </View>
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
                )}
            </KeyboardAvoidingView>

            {/* Modal de prévisualisation d'image */}
            <Modal
                visible={showImagePreview}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImagePreview(false)}
            >
                <View style={styles.imagePreviewModal}>
                    <TouchableOpacity 
                        style={styles.closePreviewButton}
                        onPress={() => setShowImagePreview(false)}
                    >
                        <Ionicons name="close" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Image 
                        source={{ uri: previewUri }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                </View>
            </Modal>

            {/* Modal de confirmation de suppression */}
            <DeleteMessage showDeleteModal={showDeleteModal} cancelDelete={cancelDelete} deleteMessage={deleteMessage}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },

    
    messagesListContent: {
        paddingVertical: 12,
        paddingBottom: 80,
    },
    emptyMessagesContainer: {
        marginTop: 100,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyMessagesText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7F8C8D',
        marginTop: 16,
    },
    emptyMessagesSubText: {
        fontSize: 13,
        color: '#95A5A6',
        marginTop: 8,
    },
    uploadProgressContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    uploadProgressBar: {
        height: 4,
        backgroundColor: '#E8E8E8',
        borderRadius: 2,
        overflow: 'hidden',
    },
    uploadProgressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    uploadProgressText: {
        fontSize: 12,
        color: '#666',
        marginTop: 6,
        textAlign: 'center',
    },
    inputWrapper: { 
        paddingHorizontal: 12, 
        paddingBottom: 8,
        paddingTop: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F5F5F5', 
        borderRadius: 24, 
        paddingHorizontal: 8, 
        paddingVertical: 6,
        minHeight: 44,
    },
    input: { 
        flex: 1, 
        fontSize: 15,
        maxHeight: 100,
        paddingHorizontal: 8,
        paddingVertical: 8,
        lineHeight: 20,
    },
    mediaButton: { 
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    sendButton: { 
        backgroundColor: '#007AFF',
    },
    micButton: { 
        backgroundColor: '#E8E8E8',
    },
    recordingBar: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 12, 
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
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
        marginRight: 12,
    },
    recordingText: { 
        fontSize: 16, 
        color: '#333', 
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    recordingActions: { 
        flexDirection: 'row', 
        alignItems: 'center',
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
        elevation: 3,
    },
    sendRecordingButton: {
        backgroundColor: '#34C759',
        padding: 10,
    },
    mediaOptionsContainer: {
        position: 'absolute',
        bottom: 70,
        left: 16,
        right: 16,
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
        elevation: 8,
    },
    mediaOption: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    mediaOptionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    mediaOptionText: {
        fontSize: 12,
        color: '#333',
        marginTop: 4,
        fontWeight: '500',
    },
    imagePreviewModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closePreviewButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
});