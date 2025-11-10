import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import SearchBarre from '@/components/searchBarre';
import { Ionicons } from '@expo/vector-icons';
import roomMessages from '@/Routes/routeRoom/roomMessages.js';
import LoadingAnimation from '@/components/LoadingAnimation';
import Discussion from '@/types/Discussion';



export default function Chat() {
    const [filtreActif, setFiltreActif] = useState<string>('toutes');
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);

    const filtres = ['toutes', 'en_attente', 'en_cours', 'terminée'];

    useEffect(() => {
        loadDiscussions();
    }, []);

    const loadDiscussions = async () => {
        try {
            setIsLoading(true);
            const data = await roomMessages.getUrgencesAvecDiscussions();
            setDiscussions(data);
        } catch (error) {
            console.error('Erreur chargement discussions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ÉTAPE 1: Filtrer par statut uniquement
    const discussionsFilteredByStatus = useMemo(() => {
        if (filtreActif === 'toutes') {
            return discussions;
        }
        return discussions.filter(u => u.statut === filtreActif);
    }, [filtreActif, discussions]);

    // ÉTAPE 2: Mettre à jour filteredDiscussions quand le filtre de statut change
    useEffect(() => {
        setFilteredDiscussions(discussionsFilteredByStatus);
    }, [discussionsFilteredByStatus]);

    const getIconName = (type?: string): keyof typeof Ionicons.glyphMap => {
        switch (type?.toLowerCase()) {
            case 'clinique': return 'medkit';
            case 'hopital': return 'hospital';
            case 'pharmacie': return 'medkit-outline';
            default: return 'chatbubbles';
        }
    };

    const showDiscussion = (id: number, urgenceTitle: string) => {
        router.push({
            pathname: `/patient/chat/[id]`,
            params: {
                id: id.toString(),
                urgenceIntitule: urgenceTitle,
            },
        });
    };

    const renderItemDiscussion = ({ item }: { item: Discussion }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => showDiscussion(item.idUrgence, item.intitule)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Ionicons 
                    name={getIconName(item.typeEtablissement)} 
                    size={28} 
                    color="#2E86C1" 
                />
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.rowInfo}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.intitule}
                    </Text>
                    <Text style={styles.subTitle} numberOfLines={1}>
                        {item.nomEtablissement ?? "Service inconnu"}
                    </Text>
                </View>
                <View style={styles.rowInfo}>
                    {item.typeEtablissement && (
                        <Text style={styles.detail}>Type: {item.typeEtablissement}</Text>
                    )}
                </View>
                <Text style={[styles.status, getStatusStyle(item.statut)]}>
                    Urgence status : {
                        item.statut === "en_cours" ? "En cours" : 
                        item.statut === "terminee" ? "Terminée" :
                        item.statut === "en_attente" ? "En attente" : "rien"
                    }
                </Text>
                <View style={styles.notif}>
                    <Text style={{color:'white', fontWeight:'600'}}>2</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'en_cours': return { color: '#F39C12' };
            case 'terminée': return { color: '#27AE60' };
            case 'en_attente': return { color: '#E74C3C' };
            default: return { color: '#7F8C8D' };
        }
    };

    const renderFilterButton = (filtre: string) => (
        <TouchableOpacity
            key={filtre}
            style={[
                styles.filterButton,
                filtreActif === filtre && styles.filterButtonActive
            ]}
            onPress={() => setFiltreActif(filtre)}
        >
            <Text style={[
                styles.filterText,
                filtreActif === filtre && styles.filterTextActive
            ]}>
                {filtre.replace('_', ' ')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "Discussions" }} />
            
            <SearchBarre 
                placeholder={'Recherche...'} 
                listeToSearch={discussionsFilteredByStatus}
                onResults={setFilteredDiscussions}
                keySearch={'intitule'}
            />

            {/* Filtres */}
            <View style={styles.filtersContainer}>
                {filtres.map(renderFilterButton)}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <LoadingAnimation/>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={filteredDiscussions}
                    keyExtractor={(item) => item.idUrgence.toString()}
                    renderItem={renderItemDiscussion}
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#BDC3C7" />
                            <Text style={styles.emptyText}>Aucune discussion trouvée</Text>
                            <Text style={styles.emptySubText}>
                                Vos conversations apparaîtront ici
                            </Text>
                        </View>
                    }
                    refreshing={isLoading}
                    onRefresh={loadDiscussions}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa', 
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E8E8E8',
    },
    filterButtonActive: {
        backgroundColor: '#2E86C1',
    },
    filterText: {
        fontSize: 13,
        color: '#666',
        textTransform: 'capitalize',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 6,
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: '#D6EAF8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    infoContainer: { flex: 1 },
    rowInfo:{
        flex:1,
        flexDirection:'row',
        alignItems:'center',
        justifyContent: "space-between",
        marginTop:10,
    },
    notif:{
        position:'absolute',
        backgroundColor:"#ffa200",
        padding:6,
        borderRadius:10,
        top:-20,
        right:-17,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E4053',
        marginBottom: 2,
    },
    subTitle: {
        fontSize: 13,
        color: '#7F8C8D',
        marginBottom: 4,
    },
    detail: {
        fontSize: 12,
        color: '#566573',
        marginTop: 2,
    },
    status: {
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    messagesList: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        color: '#7F8C8D',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubText: {
        color: '#95A5A6',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
    },
});