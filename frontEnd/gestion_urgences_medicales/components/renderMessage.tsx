import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo } from 'react';
import Message from '../types/Message';

interface RenderMessageProps {
    item: Message;
    selectedMessage: string | null;
    setShowImagePreview: (show: boolean) => void;
    setSelectedMessage: (id: string) => void;
    setShowDeleteModal: (show: boolean) => void;
    setPreviewUri: (uri: string) => void;
}

function RenderMessage({
    item,
    selectedMessage,
    setShowImagePreview,
    setSelectedMessage,
    setShowDeleteModal,
    setPreviewUri
}: RenderMessageProps) {
    const isPatient = item.sender === 'patient';
    const isSelected = selectedMessage === item.idMessage;

    // 📌 Mémoisation des fonctions de formatage
    const formatTime = useCallback((timestamp: string): string => {
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }, []);

    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }, []);

    const formatDuration = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const getStatusIcon = useCallback((status: string): keyof typeof Ionicons.glyphMap => {
        switch (status) {
            case 'envoye': return 'checkmark-done';
            case 'lu': return 'checkmark-done-circle';
            case 'erreur': return 'alert-circle';
            default: return 'time-outline';
        }
    }, []);

    // 📌 Handlers mémorisés
    const handleLongPress = useCallback(() => {
        if (isPatient) {
            setSelectedMessage(item.idMessage);
            setShowDeleteModal(true);
        }
    }, [isPatient, item.idMessage, setSelectedMessage, setShowDeleteModal]);

    const handleImagePress = useCallback(() => {
        if (item.uri) {
            setPreviewUri(item.uri);
            setShowImagePreview(true);
        }
    }, [item.uri, setPreviewUri, setShowImagePreview]);

    // 📌 Valeurs calculées mémorisées
    const formattedTime = useMemo(() => formatTime(item.timestamp), [formatTime, item.timestamp]);
    const statusIcon = useMemo(() => getStatusIcon(item.status), [getStatusIcon, item.status]);

    // 📌 Composants de contenu
    const renderMessageFooter = useCallback(() => (
        <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isPatient && styles.messageTimePatient]}>
                {formattedTime}
            </Text>
            {isPatient && (
                <Ionicons
                    name={statusIcon}
                    size={14}
                    color="#fff"
                    style={styles.statusIcon}
                />
            )}
        </View>
    ), [formattedTime, isPatient, statusIcon]);

    const renderTextMessage = useCallback(() => (
        <View style={[styles.messageBubble, isPatient ? styles.bubblePatient : styles.bubbleAssistant]}>
            <Text style={[styles.messageText, isPatient ? styles.textPatient : styles.textAssistant]}>
                {item.text}
            </Text>
            {renderMessageFooter()}
        </View>
    ), [item.text, isPatient, renderMessageFooter]);

    const renderImageMessage = useCallback(() => (
        <TouchableOpacity
            style={styles.mediaContainer}
            onPress={handleImagePress}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: item.uri }}
                style={styles.imageMessage}
                resizeMode="cover"
            />
            <Text style={[styles.messageTime, styles.mediaTime]}>
                {formattedTime}
            </Text>
        </TouchableOpacity>
    ), [item.uri, handleImagePress, formattedTime]);

    const renderVideoMessage = useCallback(() => (
        <View style={styles.mediaContainer}>
            <View style={styles.videoPlaceholder}>
                <Ionicons name="play-circle" size={48} color="#fff" />
                <Text style={styles.videoLabel}>
                    {item.duration ? formatDuration(Math.floor(item.duration / 1000)) : 'Vidéo'}
                </Text>
            </View>
            <Text style={[styles.messageTime, styles.mediaTime]}>
                {formattedTime}
            </Text>
        </View>
    ), [item.duration, formatDuration, formattedTime]);

    const renderDocumentMessage = useCallback(() => (
        <View style={[
            styles.messageBubble,
            styles.documentBubble,
            isPatient ? styles.bubblePatient : styles.bubbleAssistant
        ]}>
            <Ionicons
                name="document-text"
                size={32}
                color={isPatient ? '#fff' : '#007AFF'}
            />
            <View style={styles.documentInfo}>
                <Text
                    style={[styles.documentName, { color: isPatient ? '#fff' : '#333' }]}
                    numberOfLines={1}
                >
                    {item.fileName || 'Document'}
                </Text>
                {item.fileSize && (
                    <Text style={[
                        styles.fileSize,
                        { color: isPatient ? 'rgba(255,255,255,0.7)' : '#666' }
                    ]}>
                        {formatFileSize(item.fileSize)}
                    </Text>
                )}
                <Text style={[styles.messageTime, isPatient && styles.messageTimePatient]}>
                    {formattedTime}
                </Text>
            </View>
        </View>
    ), [item.fileName, item.fileSize, isPatient, formatFileSize, formattedTime]);

    const renderAudioMessage = useCallback(() => (
        <View style={[
            styles.messageBubble,
            styles.audioBubble,
            isPatient ? styles.bubblePatient : styles.bubbleAssistant
        ]}>
            <Ionicons
                name="play-circle"
                size={32}
                color={isPatient ? '#fff' : '#007AFF'}
            />
            <View style={styles.audioInfo}>
                <View style={styles.waveform} />
                <Text style={[styles.audioDuration, { color: isPatient ? '#fff' : '#333' }]}>
                    {formatDuration(Math.floor(item.duration || 0))}
                </Text>
            </View>
            <Text style={[styles.messageTime, isPatient && styles.messageTimePatient]}>
                {formattedTime}
            </Text>
        </View>
    ), [item.duration, isPatient, formatDuration, formattedTime]);

    // 📌 Sélection du contenu à afficher
    const renderContent = useCallback(() => {
        switch (item.type) {
            case 'text': return renderTextMessage();
            case 'image': return renderImageMessage();
            case 'video': return renderVideoMessage();
            case 'document': return renderDocumentMessage();
            case 'audio': return renderAudioMessage();
            default: return null;
        }
    }, [item.type, renderTextMessage, renderImageMessage, renderVideoMessage, renderDocumentMessage, renderAudioMessage]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={handleLongPress}
            delayLongPress={400}
        >
            <View style={[
                styles.messageContainer,
                isPatient ? styles.messagePatientContainer : styles.messageAssistantContainer,
                isSelected && styles.messageSelected
            ]}>
                {renderContent()}
            </View>
        </TouchableOpacity>
    );
}

// 📌 Mémoisation du composant pour éviter les re-renders inutiles
export default memo(RenderMessage, (prevProps, nextProps) => {
    return (
        prevProps.item.idMessage === nextProps.item.idMessage &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.selectedMessage === nextProps.selectedMessage
    );
});

const styles = StyleSheet.create({
    messageContainer: {
        marginVertical: 4,
        maxWidth: '80%',
        paddingHorizontal: 12,
    },
    messageSelected: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    messagePatientContainer: {
        alignSelf: 'flex-end',
    },
    messageAssistantContainer: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        padding: 10,
        borderRadius: 16,
    },
    bubblePatient: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
        backgroundColor: '#F2F3F4',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    textPatient: {
        color: '#fff',
    },
    textAssistant: {
        color: '#2E4053',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        justifyContent: 'flex-end',
    },
    messageTime: {
        fontSize: 10,
        color: '#7F8C8D',
    },
    messageTimePatient: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    statusIcon: {
        marginLeft: 4,
    },
    mediaContainer: {
        marginVertical: 4,
        position: 'relative',
    },
    mediaTime: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    imageMessage: {
        width: 200,
        height: 200,
        borderRadius: 12,
    },
    videoPlaceholder: {
        width: 200,
        height: 200,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    videoLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
    documentBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
    },
    documentInfo: {
        marginLeft: 12,
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    fileSize: {
        fontSize: 11,
        marginBottom: 2,
    },
    audioBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
    },
    audioInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        flex: 1,
    },
    waveform: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        marginRight: 8,
    },
    audioDuration: {
        fontSize: 12,
        fontWeight: '500',
    },
});