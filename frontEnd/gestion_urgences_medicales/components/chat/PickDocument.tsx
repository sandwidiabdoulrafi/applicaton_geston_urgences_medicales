import { View, Text, TouchableOpacity, StyleSheet, Keyboard } from 'react-native'
import React from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons'

export default function PickDocument({setShowMediaOptions, sendMediaMessage }) {



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



    return (
        <TouchableOpacity 
            style={styles.mediaOption}
            onPress={pickDocument}
        >
            <View style={[styles.mediaOptionIcon, { backgroundColor: '#5856D6' }]}>
                <Ionicons name="document" size={24} color="#fff" />
            </View>
            <Text style={styles.mediaOptionText}>Document</Text>
        </TouchableOpacity>
    )
}


const styles = StyleSheet.create({
    
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
})