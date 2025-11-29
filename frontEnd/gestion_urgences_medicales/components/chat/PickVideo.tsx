import { View, Text, StyleSheet, TouchableOpacity, Keyboard } from 'react-native'
import React from 'react'
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons'

export default function PickVideo({setShowMediaOptions, sendMediaMessage }) {


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



    return (
        <TouchableOpacity 
            style={styles.mediaOption}
            onPress={pickVideo}
        >
            <View style={[styles.mediaOptionIcon, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="videocam" size={24} color="#fff" />
            </View>
            <Text style={styles.mediaOptionText}>Vidéo</Text>
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