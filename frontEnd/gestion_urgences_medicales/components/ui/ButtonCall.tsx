import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import React, { useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function ButtonCall({telephone}) {
    const callService = useCallback((telephone: string) => {
        Alert.alert(
            "Appeler",
            `Voulez-vous appeler ${telephone} ?`,
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Appeler", 
                    onPress: () => Linking.openURL(`tel:${telephone}`)
                }
            ]
        );
    }, []);
    return (
        <TouchableOpacity 
            style={styles.calloutButton}
            onPress={() => callService(telephone)}
        >
            <Ionicons name="call" size={16} color="#007AFF" />
            <Text style={styles.calloutButtonText}>Appeler</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    calloutButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: '#F0F8FF',
        gap: 6,
    },
    calloutButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
})