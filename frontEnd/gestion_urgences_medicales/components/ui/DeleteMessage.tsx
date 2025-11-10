import { View, Text, Modal, TouchableOpacity,StyleSheet } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function DeleteMessage({showDeleteModal, cancelDelete, deleteMessage }) {

    return (
        <Modal
            visible={showDeleteModal}
            transparent
            animationType="fade"
            onRequestClose={cancelDelete}
        >
            <View style={styles.deleteModalOverlay}>
                <View style={styles.deleteModalContent}>
                    <View style={styles.deleteModalHeader}>
                        <Ionicons name="trash-outline" size={32} color="#FF3B30" />
                    </View>
                    
                    <Text style={styles.deleteModalTitle}>Supprimer le message ?</Text>
                    <Text style={styles.deleteModalText}>
                        Cette action est irréversible. Le message sera supprimé définitivement.
                    </Text>
                    
                    <View style={styles.deleteModalActions}>
                        <TouchableOpacity 
                            style={[styles.deleteModalButton, styles.cancelButton]}
                            onPress={cancelDelete}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.deleteModalButton, styles.deleteButton]}
                            onPress={deleteMessage}
                        >
                            <Text style={styles.deleteButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}


const styles = StyleSheet.create({
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    deleteModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    deleteModalHeader: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFE5E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
        textAlign: 'center',
    },
    deleteModalText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    deleteModalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    deleteModalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButton: {
        backgroundColor: '#F2F2F7',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },

    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
})