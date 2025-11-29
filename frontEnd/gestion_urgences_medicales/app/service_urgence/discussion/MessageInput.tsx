import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

interface MessageInputProps {
    onSend: (text: string) => void
}

export default function MessageInput({ onSend }: MessageInputProps) {
    const [text, setText] = useState('')

    const handleSend = () => {
        if (text.trim()) {
            onSend(text)
            setText('')
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachButton}>
                    <Ionicons name="add-circle-outline" size={28} color="#58D68D" />
                </TouchableOpacity>
                
                <TextInput
                    style={styles.input}
                    placeholder="Écrivez votre message..."
                    placeholderTextColor="#95a5a6"
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={1000}
                />
                
                <TouchableOpacity 
                    style={[
                        styles.sendButton,
                        !text.trim() && styles.sendButtonDisabled
                    ]}
                    onPress={handleSend}
                    disabled={!text.trim()}
                >
                    <Ionicons 
                        name="send" 
                        size={22} 
                        color={text.trim() ? '#fff' : '#bdc3c7'} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    attachButton: {
        padding: 4
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        color: '#2c3e50'
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#58D68D',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendButtonDisabled: {
        backgroundColor: '#ecf0f1'
    }
})