import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function FiltreByPriority({ listeInput = [], listOutPut }) {

    const [filterType, setFilterType] = useState<string | null>(null);

    useEffect(() => {

        // vérification
        if (!listeInput || !Array.isArray(listeInput)) {
            return listOutPut([]);
        }

        // filtre
        const filtered = filterType
            ? listeInput.filter(
                urg =>
                    urg.priorite &&
                    urg.priorite.toLowerCase().includes(filterType.toLowerCase())
            )
            : listeInput;

        listOutPut(filtered);

    }, [filterType, listeInput]);


    return (
        <View style={styles.filterBar}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
            >

                {/* Tous */}
                <TouchableOpacity
                    style={[styles.filterChip, !filterType && styles.filterChipActive]}
                    onPress={() => setFilterType(null)}
                >
                    <Text style={[styles.filterText, !filterType && styles.filterTextActive]}>
                        Tous ({listeInput?.length ?? 0})
                    </Text>
                </TouchableOpacity>

                {/* Vitale */}
                <TouchableOpacity
                    style={[styles.filterChip, filterType === 'vitale' && styles.filterChipActive]}
                    onPress={() => setFilterType('vitale')}
                >
                    <Ionicons name="pulse" size={16} color={filterType === 'vitale' ? '#fff' : '#FF3B30'} />
                    <Text style={[styles.filterText, filterType === 'vitale' && styles.filterTextActive]}>
                        Vitale
                    </Text>
                </TouchableOpacity>

                {/* Grave */}
                <TouchableOpacity
                    style={[styles.filterChip, filterType === 'grave' && styles.filterChipActive]}
                    onPress={() => setFilterType('grave')}
                >
                    <Ionicons name="warning" size={16} color={filterType === 'grave' ? '#fff': '#f51818'} />
                    <Text style={[styles.filterText, filterType === 'grave' && styles.filterTextActive]}>
                        Grave
                    </Text>
                </TouchableOpacity>

                {/* Consultation */}
                <TouchableOpacity
                    style={[styles.filterChip, filterType === 'consultation' && styles.filterChipActive]}
                    onPress={() => setFilterType('consultation')}
                >
                    <Ionicons name="chatbubbles" size={16} color={filterType === 'consultation' ? '#fff' : '#27AE60'} />
                    <Text style={[styles.filterText, filterType === 'consultation' && styles.filterTextActive]}>
                        Consultation
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}



const styles = StyleSheet.create({
    filterBar: {
        backgroundColor: 'rgba(82, 81, 79, 0.69)',
    },
    filterContent: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    filterChipActive: {
        backgroundColor: '#007AFF',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    filterTextActive: {
        color: '#fff',
    },
});
