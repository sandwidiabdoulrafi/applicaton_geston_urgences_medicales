import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Socket } from 'socket.io-client'

interface MessageInputProps {
    onSend: (text: string) => void
    id: string
    userRole: 'patient' | 'service',
    socket :Socket

}

export default function MessageInput({ id, userRole, onSend, socket }: MessageInputProps) {
    const [text, setText] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // ✅ Émettre le signal typing quand l'utilisateur tape
    useEffect(() => {
        
        if (text.trim().length > 0 && !isTyping) {
            setIsTyping(true)
            socket.emit("user:typing", { 
                idUrgence: id, 
                isTyping: true, 
                sender: userRole 
            })
            console.log("✍️ Émission typing=true", { id, userRole })
        } else if (text.trim().length === 0 && isTyping) {
            setIsTyping(false)
            socket.emit("user:typing", { 
                idUrgence: id, 
                isTyping: false, 
                sender: userRole 
            })
            console.log("✍️ Émission typing=false", { id, userRole })
        }
    }, [text, id, userRole, isTyping])

    // ✅ Arrêter le typing après 3 secondes d'inactivité
    useEffect(() => {
        if (!isTyping) return

        const timeout = setTimeout(() => {
            setIsTyping(false)
            socket.emit("user:typing", { 
                idUrgence: id, 
                isTyping: false, 
                sender: userRole 
            })
            console.log("⏱️ Timeout - typing=false", { id, userRole })
        }, 3000)

        return () => clearTimeout(timeout)
    }, [text, isTyping, id, userRole])

    const handleSend = () => {
        if (!text.trim()) return
        
        // ✅ Arrêter le typing avant d'envoyer
        if (isTyping) {
            socket.emit("user:typing", { 
                idUrgence: id, 
                isTyping: false, 
                sender: userRole 
            })
            setIsTyping(false)
            console.log("📤 Envoi message - typing=false", { id, userRole })
        }
        
        onSend(text)
        setText('')
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
        paddingVertical: 8,
        marginBottom: 14
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