import { View, Text, Modal, Image, TouchableOpacity,StyleSheet } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function ShowImagePreview({showImagePreview, setShowImagePreview, previewUri}) {
    return (
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
    )
}

const styles = StyleSheet.create({
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
    imagePreviewModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
})