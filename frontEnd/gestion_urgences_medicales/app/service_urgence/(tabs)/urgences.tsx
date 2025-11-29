import { View, Text, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import serviceSanteRoomService from '@/Routes/routeRoom/serviceSanteRoomService';
import SearchBarre from '@/components/searchBarre';
import urgcenceRender from '../urgence/urgcenceRender';
import { UrgenceSevice } from '@/types/urgenceType';


type StatutType = 'en_attente' | 'en_cours' | 'termine' | 'tous';
type PrioriteType = 'vital' | 'grave' | 'consultation' | 'tous';

export default function Urgences() {
    const [listUrgences, setListUrgences] = useState<UrgenceSevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedStatut, setSelectedStatut] = useState<StatutType>('tous');
    const [selectedPriorite, setSelectedPriorite] = useState<PrioriteType>('tous');

    useEffect(() => {
        const fetchRoomUrgences = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await serviceSanteRoomService.getAllUrgence();
                console.log("Liste des urgences (API):", response);
                
                if (response?.data) {
                    setListUrgences(response.data);
                }

            } catch (error) {
                console.error("Erreur lors de la récupération des urgences:", error);
                setError("Impossible de charger les urgences");
            } finally {
                setLoading(false);
            }
        };
        
        fetchRoomUrgences();
    }, []);

    // Filtrage des urgences avec gestion robuste des types
    const filteredUrgences = useMemo(() => {
        return listUrgences.filter(urgence => {
            // S'assurer que searchQuery est une chaîne
            const query = typeof searchQuery === 'string' 
                ? searchQuery.toLowerCase() 
                : '';
            
            const matchSearch = !query || 
                (urgence.intitule?.toLowerCase() || '').includes(query) ||
                (urgence.idPatient?.toLowerCase() || '').includes(query) ||
                (urgence.idUrgence?.toLowerCase() || '').includes(query);

            const matchStatut = selectedStatut === 'tous' || 
                (urgence.statut?.toLowerCase() || '') === selectedStatut.toLowerCase();

            const matchPriorite = selectedPriorite === 'tous' || 
                (urgence.priorite?.toLowerCase() || '') === selectedPriorite.toLowerCase();

            return matchSearch && matchStatut && matchPriorite;
        });
    }, [listUrgences, searchQuery, selectedStatut, selectedPriorite]);

    // Statistiques
    const stats = useMemo(() => {
        return {
            total: listUrgences.length,
            enAttente: listUrgences.filter(u => u.statut?.toLowerCase() === 'en_attente').length,
            enCours: listUrgences.filter(u => u.statut?.toLowerCase() === 'en_cours').length,
            termine: listUrgences.filter(u => u.statut?.toLowerCase() === 'termine').length,
            vital: listUrgences.filter(u => u.priorite?.toLowerCase() === 'vitale' || u.priorite?.toLowerCase() === 'vital').length,
        };
    }, [listUrgences]);

    

    

    const handleSearch = (query: any) => {
        // S'assurer de toujours avoir une chaîne
        const searchValue = typeof query === 'string' ? query : '';
        setSearchQuery(searchValue);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>Chargement des urgences...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={64} color="#E53E3E" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                        setLoading(true);
                        setError(null);
                    }}
                >
                    <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            

            {/* Barre de recherche */}
                <SearchBarre 
                    placeholder="Rechercher par intitulé, patient ou ID..." 
                    onResults={handleSearch} 
                    keySearch="urgences"
                />

            {/* Filtres */}
            <View style={styles.filterSection}>
                <View style={styles.filterHeader}>
                    <Ionicons name="funnel-outline" size={18} color="#4A5568" />
                    <Text style={styles.filterTitle}>Filtrer par statut</Text>
                </View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                >
                    {(['tous', 'en_attente', 'en_cours', 'termine'] as StatutType[]).map((statut) => {
                        const icons = {
                            tous: 'apps-outline',
                            en_attente: 'time-outline',
                            en_cours: 'reload-outline',
                            termine: 'checkmark-circle-outline'
                        };
                        return (
                            <TouchableOpacity
                                key={statut}
                                style={[
                                    styles.filterChip,
                                    selectedStatut === statut && styles.filterChipActive
                                ]}
                                onPress={() => setSelectedStatut(statut)}
                            >
                                <Ionicons 
                                    name={icons[statut] as any} 
                                    size={16} 
                                    color={selectedStatut === statut ? '#FFFFFF' : '#4A5568'} 
                                />
                                <Text style={[
                                    styles.filterChipText,
                                    selectedStatut === statut && styles.filterChipTextActive
                                ]}>
                                    {statut === 'tous' ? 'Tous' : 
                                        statut === 'en_attente' ? 'En attente' :
                                        statut === 'en_cours' ? 'En cours' : 'Terminé'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.filterHeader}>
                    <Ionicons name="speedometer-outline" size={18} color="#4A5568" />
                    <Text style={styles.filterTitle}>Filtrer par priorité</Text>
                </View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                >
                    {(['tous', 'vital', 'grave', 'consultation'] as PrioriteType[]).map((priorite) => {
                        const icons = {
                            tous: 'apps-outline',
                            vital: 'alert-circle',
                            grave: 'warning',
                            consultation: 'information-circle-outline'
                        };
                        return (
                            <TouchableOpacity
                                key={priorite}
                                style={[
                                    styles.filterChip,
                                    selectedPriorite === priorite && styles.filterChipActive
                                ]}
                                onPress={() => setSelectedPriorite(priorite)}
                            >
                                <Ionicons 
                                    name={icons[priorite] as any} 
                                    size={16} 
                                    color={selectedPriorite === priorite ? '#FFFFFF' : '#4A5568'} 
                                />
                                <Text style={[
                                    styles.filterChipText,
                                    selectedPriorite === priorite && styles.filterChipTextActive
                                ]}>
                                    {priorite === 'tous' ? 'Tous' : 
                                        priorite === 'vital' ? 'Vital' :
                                        priorite === 'grave' ? 'Grave' : 'Consultation'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Résultats */}
            <View style={styles.resultsHeader}>
                <View style={styles.resultsLeft}>
                    <Ionicons name="document-text-outline" size={18} color="#718096" />
                    <Text style={styles.resultsText}>
                        {filteredUrgences.length} résultat{filteredUrgences.length > 1 ? 's' : ''}
                    </Text>
                </View>
                {(searchQuery || selectedStatut !== 'tous' || selectedPriorite !== 'tous') && (
                    <TouchableOpacity 
                        style={styles.clearFiltersButton}
                        onPress={() => {
                            setSearchQuery('');
                            setSelectedStatut('tous');
                            setSelectedPriorite('tous');
                        }}
                    >
                        <Ionicons name="close-circle-outline" size={18} color="#0066CC" />
                        <Text style={styles.clearFilters}>Effacer</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Liste des urgences */}
            {filteredUrgences.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="clipboard-outline" size={80} color="#CBD5E0" />
                    <Text style={styles.emptyText}>
                        {searchQuery || selectedStatut !== 'tous' || selectedPriorite !== 'tous' 
                            ? 'Aucune urgence ne correspond à vos critères' 
                            : 'Aucune urgence à afficher'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUrgences}
                    renderItem={urgcenceRender}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        padding: 20,
    },
    headerSection: {
        padding: 5,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        // padding: 2,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection:'column',
        // justifyContent:'space-between',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        
    },
    statCardWarning: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FED7D7',
    },
    statCardInfo: {
        backgroundColor: '#EBF8FF',
        borderColor: '#BEE3F8',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    statNumberWarning: {
        color: '#C53030',
    },
    statNumberInfo: {
        color: '#2C5282',
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    filterSection: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        marginTop: 8,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },
    filterScroll: {
        marginBottom: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F7FAFC',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterChipActive: {
        backgroundColor: '#0066CC',
        borderColor: '#0066CC',
    },
    filterChipText: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    resultsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resultsText: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clearFilters: {
        fontSize: 14,
        color: '#0066CC',
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#718096',
    },
    errorText: {
        fontSize: 16,
        color: '#E53E3E',
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 16,
        marginBottom: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0066CC',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        gap: 16,
    },
    emptyText: {
        fontSize: 18,
        color: '#718096',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
});

