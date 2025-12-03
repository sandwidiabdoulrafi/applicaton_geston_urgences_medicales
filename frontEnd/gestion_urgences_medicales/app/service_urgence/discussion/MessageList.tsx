import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

interface Message {
    id: number,
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

interface MessageListProps {
    messages: Message[]
    userRole: 'patient' | 'service'
    currentUserId: number
    onRetry?: (id: number) => void
}

export default function MessageList({ messages, userRole, onRetry }: MessageListProps) {





    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender === userRole
        
        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessage : styles.theirMessage
                ]}>
                    <Text style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : styles.theirMessageText
                    ]}>
                        {item.text}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[
                            styles.timestamp,
                            isMyMessage ? styles.myTimestamp : styles.theirTimestamp
                        ]}>
                            {formatTime(item.timestamp)}
                        </Text>
                        {isMyMessage && (
                            <View style={styles.statusContainer}>
                                {item.status === 'envoi' && (
                                    <Ionicons name="time-outline" size={16} color="#1A1A1A" />
                                )}
                                {item.status === 'envoye' && (
                                    <Ionicons name="checkmark-done" size={14} color="#0B3D91" />
                                )}
                                {item.status === 'lu' && (
                                    <Ionicons name="checkmark-done" size={14} color="#1A1A1A" />
                                )}
                                {item.status === 'erreur' && (
                                    <TouchableOpacity onPress={() => onRetry?.(item.id)}>
                                        <Ionicons name="alert-circle" size={14} color="#C0392B" />
                                    </TouchableOpacity>
                                )}
                            </View>

                        )}
                    </View>
                </View>
            </View>
        )
    }

    return (
        <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            inverted={false}
        />
    )
}

function formatTime(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const styles = StyleSheet.create({
    listContent: {
        paddingVertical: 16,
        paddingHorizontal: 12
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: '80%'
    },
    myMessageContainer: {
        alignSelf: 'flex-end'
    },
    theirMessageContainer: {
        alignSelf: 'flex-start'
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16
    },
    myMessage: {
        backgroundColor: '#58D68D',
        borderBottomRightRadius: 4
    },
    theirMessage: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20
    },
    myMessageText: {
        color: '#fff'
    },
    theirMessageText: {
        color: '#2c3e50'
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4
    },
    timestamp: {
        fontSize: 11,
        fontWeight: '500'
    },
    myTimestamp: {
        color: '#e8f5e9'
    },
    theirTimestamp: {
        color: '#95a5a6'
    },
    statusContainer: {
        marginLeft: 4
    }
})