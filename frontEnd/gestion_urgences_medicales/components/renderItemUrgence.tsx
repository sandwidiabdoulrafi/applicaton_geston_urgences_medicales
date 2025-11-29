import { View, Text, StyleSheet, TouchableOpacity  } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router';

export default function RenderItemUrgence({item}) {

    console.log("\n\n\n\n\t ++=+=+=====-=-=-=-=-====--  rendeur item Urgence item  : ", item)


    const router = useRouter();


    const getStatutStyle = statut => {
        switch (statut) {
            case 'en_attente':
                return { color: '#FF9800', backgroundColor: '#FFF3E0' };
            case 'en_cours':
                return { color: '#2196F3', backgroundColor: '#E3F2FD' };
            case 'terminée':
                return { color: '#4CAF50', backgroundColor: '#E8F5E9' };
            default:
                return { color: '#6C757D', backgroundColor: '#E9ECEF' };
        }
    };

    const statutStyle = getStatutStyle(item.statut);
    
    // Formatage date et heure
    const dateObj = item.dateCreation ? new Date(item.dateCreation) : null;
    const date = dateObj ? dateObj.toLocaleDateString('fr-FR') : 'N/A';
    const heure = dateObj
        ? dateObj.toLocaleTimeString('fr-FR', { hour12: false })
        : 'N/A';

    const handleShowMore= ()=>{
        router.push({
            pathname: '/patient/urgences/[id]',
            params: { 
                id: item.id,
                // urgenceData: JSON.stringify(item)
            }
        });
    }


    return (
        <TouchableOpacity style={styles.card} onPress={handleShowMore}>
            <View style={styles.cardHeader}>
                <Text style={styles.titre}>{item.intitule}</Text>
                <Text
                    style={[
                    styles.priorite,
                    item.priorite === 'Élevée' && styles.prioriteElevee,
                    ]}
                >
                    {item.priorite}
                </Text>
            </View>

            <View style={styles.cardFooter}>
                <Text
                    style={[
                    styles.statut,
                    { color: statutStyle.color, backgroundColor: statutStyle.backgroundColor },
                    ]}
                >
                    {item.statut}
                </Text>

                <View style={styles.dateContainer}>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color="#555" />
                        <Text style={styles.info}>{date}</Text>
                    </View>
                    <View style={styles.dateRow}>
                        <Ionicons name="time-outline" size={14} color="#555" />
                        <Text style={styles.info}>{heure}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}


const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    titre: { fontSize: 17, fontWeight: 'bold', color: '#333', maxWidth: '70%' },
    description: { fontSize: 14, color: '#555', marginBottom: 8 },
    priorite: {
        fontSize: 13,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f1f1f1',
        color: '#555',
        fontWeight: '600',
    },
    prioriteElevee: { backgroundColor: '#FADADD', color: '#E53935' },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statut: {
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        fontWeight: '700',
        alignSelf: 'flex-start',
        fontSize: 12,
        overflow: 'hidden',
    
    },
    dateContainer: { alignItems: 'flex-end' },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    info: { fontSize: 13, color: '#555', marginLeft: 4 },
    
})