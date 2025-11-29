import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function PickImage({ setShowMediaOptions, sendMediaMessage }) {
    
    const pickImage = async () => {
        try {
            setShowMediaOptions(false);

            // 1. Sélectionner l'image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsMultipleSelection: false,
                allowsEditing: false,
                base64: true, 
            });

            console.log("📷 Sélection image:", result);

            if (result.canceled || !result.assets[0]) {
                console.log("❌ Sélection annulée");
                return;
            }

            const asset = result.assets[0];
            
            // 2. Créer l'objet avec les données nécessaires (sans base64)
            const mediaData = {
                uri: asset.uri,                    // URI local du fichier
                type: asset.mimeType || 'image/jpeg', // Type MIME
                name: asset.fileName || `image_${Date.now()}.jpg`, // Nom du fichier
                width: asset.width,
                height: asset.height,
                fileSize: asset.fileSize,
            };

            console.log("✅ Image préparée:", {
                name: mediaData.name,
                type: mediaData.type,
                base64: asset.base64,
                size: `${(mediaData.fileSize / 1024).toFixed(2)} KB`,
            });

            // 3. Envoyer au backend (utilise FormData en interne)
            await sendMediaMessage(mediaData, 'image'); 

        } catch (error) {
            console.error("❌ Erreur lors de la sélection:", error);
            Alert.alert("Erreur", "Impossible de traiter l'image sélectionnée.");
        }
    };

    return (
        <TouchableOpacity 
            style={styles.mediaOption} 
            onPress={pickImage}
        >
            <View style={styles.mediaOptionIcon}>
                <Ionicons name="image" size={28} color="#fff" />
            </View>
            <Text style={styles.mediaOptionText}>Galerie</Text>
        </TouchableOpacity>
    );
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
        backgroundColor: '#f58349',
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

});