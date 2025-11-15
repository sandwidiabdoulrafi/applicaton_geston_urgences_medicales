import RenderItemUrgence from '@/components/renderItemUrgence';
import SearchBarre from '@/components/searchBarre';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import RoutesRoom from '../../../Routes/routeRoom/roomUrgences';
import LoadingAnimation from '@/components/LoadingAnimation';


export default function Mes_urgences() {
    const [filtreActif, setFiltreActif] = useState('toutes');
    const filtres = ['toutes', 'en_attente', 'en_cours', 'terminée'];
    const [Urgences, setUrgences] = useState([]);
    const [isLoad, setIsLoad] = useState(false);
    const [urgencesParStatut, setUrgencesParStatut] = useState([]); 
    const [urgencesAffichees, setUrgencesAffichees] = useState([]); 

    // useEffect(() => {
    //     const fetchUrgences = async () => {
    //         setIsLoad(true);
    //         try {
    //             const idPatient = 1;
    //             const userUrgence = await RoutesRoom.getUrgencesByPatient(idPatient);
    //             setUrgences(userUrgence);
    //         } catch (error) {
    //             console.log("Erreur lors de la récupération des urgences :", error);
    //         } finally {
    //             setIsLoad(false);
    //         }
    //     };
    //     fetchUrgences();
    // }, []);

    useFocusEffect(
        useCallback(() => {
            const fetchUrgences = async () => {
                setIsLoad(true);
                try {
                    const idPatient = 1;
                    const userUrgence = await RoutesRoom.getUrgencesByPatient(idPatient);
                    setUrgences(userUrgence);
                } catch (error) {
                    console.log("Erreur lors de la récupération des urgences :", error);
                } finally {
                    setIsLoad(false);
                }
            };
    
            fetchUrgences();
    
        }, [])
    );




    // 🔸 Filtre selon le statut actif
    useEffect(() => {
        let resultats = Urgences;
        if (filtreActif !== 'toutes') {
            resultats = resultats.filter(u => u.statut === filtreActif);
        }
        setUrgencesParStatut(resultats);
        setUrgencesAffichees(resultats); // initialement la même chose
    }, [filtreActif, Urgences]);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Mes urgences' }} />

            {/* Barre de recherche */}
            <SearchBarre
                placeholder="Rechercher une urgence..."
                listeToSearch={urgencesParStatut}
                onResults={setUrgencesAffichees}
                keySearch="intitule"
            />

            {/* Boutons de filtre */}
            <View style={styles.filtreContainer}>
                {filtres.map(statut => (
                    <TouchableOpacity
                        key={statut}
                        style={[
                            styles.filtreBouton,
                            filtreActif === statut && styles.filtreBoutonActif,
                        ]}
                        onPress={() => setFiltreActif(statut)}
                    >
                        <Text
                            style={[
                                styles.filtreTexte,
                                filtreActif === statut && styles.filtreTexteActif,
                            ]}
                        >
                            {statut.replace('_', ' ').toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Liste d'urgences */}
            {isLoad ? (
                <LoadingAnimation />
            ) : (
                <FlatList
                    data={urgencesAffichees}
                    renderItem={({ item }) => <RenderItemUrgence item={item} />}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.liste}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={42} color="#FF3B30" />
                            <Text style={styles.emptyText}>Aucune urgence.</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}


// --- Styles principaux ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 10 },
    liste: { paddingHorizontal: 15, paddingBottom: 40 },
    
    info: { fontSize: 13, color: '#555', marginLeft: 4 },
    emptyText: { marginTop: 50, fontSize: 15, color: '#888', textAlign: 'center' },
    filtreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    filtreBouton: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#E9ECEF',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filtreBoutonActif: { backgroundColor: '#FF7F00', borderColor: '#FF7F00' },
    filtreTexte: { color: '#495057', fontWeight: '600', fontSize: 12 },
    filtreTexteActif: { color: '#fff' },

    emptyContainer: {
        
        flexDirection: 'column',
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
    },
});
