import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function Mes_urgences() {
    // Données simulées (tu pourras ensuite les charger depuis ton backend)
    const urgences = [
        { id: '1', titre: 'Crise cardiaque', statut: 'En cours', date: '2025-11-05', lieu: 'CHU Bogodogo' },
        { id: '2', titre: 'Accident de la route', statut: 'Terminée', date: '2025-11-03', lieu: 'Hôpital Blaise Compaoré' },
        { id: '3', titre: 'Brûlure grave', statut: 'En attente', date: '2025-11-02', lieu: 'Clinique Sainte Marie' },
    ];

    // Affichage d'un item
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.titre}>{item.titre}</Text>
            <Text style={styles.info}>📍 {item.lieu}</Text>
            <Text style={styles.info}>📅 {item.date}</Text>
            <Text
                style={[
                    styles.statut,
                    item.statut === 'En cours'
                        ? { color: '#007BFF' }
                        : item.statut === 'Terminée'
                        ? { color: '#28A745' }
                        : { color: '#999' },
                ]}
            >
                Statut : {item.statut}
            </Text>

            <TouchableOpacity style={styles.bouton}>
                <Text style={styles.boutonTexte}>Voir détails</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.titrePage}>🩺 Mes Urgences</Text>
            <FlatList
                data={urgences}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.liste}
            />
        </View>
    );
}

// 🎨 Styles purs
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
        paddingTop: 50,
    },
    titrePage: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF7F00',
        marginBottom: 20,
    },
    liste: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 15,
        width: '90%',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    titre: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF7F00',
    },
    info: {
        color: '#555',
        marginTop: 4,
    },
    statut: {
        marginTop: 6,
        fontWeight: '600',
    },
    bouton: {
        marginTop: 10,
        backgroundColor: '#FF7F00',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignSelf: 'flex-start',
    },
    boutonTexte: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

