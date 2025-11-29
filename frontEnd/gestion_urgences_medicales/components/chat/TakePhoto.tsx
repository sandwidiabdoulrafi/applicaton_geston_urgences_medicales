import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function TakePhoto({setShowMediaOptions, sendMediaMessage}) {


        const takePhoto = async()=>{
            setShowMediaOptions(false);
    
            const photo = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [4, 3],
            });
    
            if (!photo.canceled && photo.assets[0]) {
                await sendMediaMessage(photo.assets[0].uri, 'image');
            }
        }
        


        
    return (
        <TouchableOpacity 
            style={styles.mediaOption}
            onPress={takePhoto}
        >
            <View style={styles.mediaOptionIcon}>
                <Ionicons name="camera" size={24} color="#fff" />
            </View>
            <Text style={styles.mediaOptionText}>Caméra</Text>
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