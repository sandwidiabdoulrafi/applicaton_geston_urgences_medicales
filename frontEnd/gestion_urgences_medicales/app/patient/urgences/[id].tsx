
import { View, Text, Alert, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import UrgenceDetail from '@/types/UrgenceDetail';
import roomUrgences from '@/Routes/routeRoom/roomUrgences';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import urgenceService from '@/Routes/routeService/urgenceService';

export default function UrgenceDetailPage() {
    const {id} = useLocalSearchParams();

    const router = useRouter();

    const [urgence, setUrgence] = useState<UrgenceDetail | null>(null);
    const [loading, setLoading] = useState(true);




        useFocusEffect(
            useCallback(() => {
                loadUrgenceDetails();

                
                
            }, [])
        );
    
    

    const loadUrgenceDetails = async()=>{
        try{
            const data = await roomUrgences.getUrgenceById(id)
            if(data){
                setUrgence(data);
                console.log("info de l'urgence sectionner : ",data);
            }else{
                Alert.alert('Erreur', 'Urgence non trouvée');
                router.back();
            }


        }catch(error){
            console.error('Erreur chargement urgence:', error);
            Alert.alert('Erreur', 'Impossible de charger les détails');
        }finally{
            setLoading(false);
        }
    };


    const delete_urgence = async (urgenceId, idLocal) => {
        console.log(`idUrgence = ${urgenceId} et maitenant idLocal = ${idLocal} `);
        Alert.alert(
            "Confirmation",
            "Êtes-vous sûr de vouloir supprimer cette urgence ? Cette action est irréversible.",
            [
                {
                    text: "Annuler",
                    style: "cancel",
                },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await urgenceService.deleteThisUrgence(urgenceId, idLocal);
                            
                            Alert.alert("Succès", "Urgence supprimée avec succès !");
                            router.back();
                        } catch (error) {
                            console.error("Erreur lors de la suppression de l’urgence :", error);
                            Alert.alert("Erreur", "Impossible de supprimer l’urgence.");
                        }
                    },
                },
            ]
            );
        };

    const getPrioriteConfig = (priorite: string) => {
        switch (priorite) {
            case 'vitale':
                return {
                    color: '#FF3B30',
                    backgroundColor: '#FFEBEE',
                    icon: 'medical' as const,
                    label: 'Urgence Vitale',
                    description: 'Danger immédiat nécessitant une intervention urgente'
                };
            case 'grave':
                return {
                    color: '#FF9500',
                    backgroundColor: '#FFF3E0',
                    icon: 'alert-circle' as const,
                    label: 'Urgence Grave',
                    description: 'Situation sérieuse nécessitant une prise en charge rapide'
                };
            case 'consultation':
                return {
                    color: '#34C759',
                    backgroundColor: '#E8F5E9',
                    icon: 'bandage' as const,
                    label: 'Consultation Urgente',
                    description: 'Besoin médical non critique'
                };
            default:
                return {
                    color: '#6C757D',
                    backgroundColor: '#F1F1F1',
                    icon: 'information-circle' as const,
                    label: priorite,
                    description: ''
                };
        }
    };

    const getStatutConfig = (statut: string) => {
        switch (statut) {
            case 'en_attente':
                return {
                    color: '#FF9800',
                    backgroundColor: '#FFF3E0',
                    icon: 'time-outline' as const,
                    label: 'En Attente',
                    description: 'Votre urgence a été enregistrée et est en attente de prise en charge'
                };
            case 'en_cours':
                return {
                    color: '#2196F3',
                    backgroundColor: '#E3F2FD',
                    icon: 'pulse-outline' as const,
                    label: 'En Cours',
                    description: 'Un professionnel de santé a pris en charge votre urgence'
                };
            case 'terminee':
                return {
                    color: '#4CAF50',
                    backgroundColor: '#E8F5E9',
                    icon: 'checkmark-circle-outline' as const,
                    label: 'Terminée',
                    description: 'Votre urgence a été traitée avec succès'
                };
            default:
                return {
                    color: '#6C757D',
                    backgroundColor: '#E9ECEF',
                    icon: 'help-circle-outline' as const,
                    label: statut,
                    description: ''
                };
        }
    };


    if(loading){
        return(
            <LoadingAnimation/>
        )
    }

    if (!urgence) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
                <Text style={styles.errorText}>Urgence non trouvée</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const prioriteConfig = getPrioriteConfig(urgence.priorite);
    const statutConfig = getStatutConfig(urgence.statut);
    const dateObj = new Date(urgence.dateCreation);

    const handleNavigateDiscution = ()=>{
        router.push({
            pathname: '/patient/chat/[id]',
            params:{
                id:urgence.id,
                idUrgence:urgence.idUrgence,
                intituleUrgence: urgence.intitule,
                priorite: urgence.priorite

            }
        })
    }
    const handleEdit = ()=>{
        router.push({
            pathname:'/patient/urgences/edit',
            params:{
                id:urgence.id,
            }
        })
    }


    return (
        <View style={styles.container}>

            <Stack.Screen
                options={{
                    title: "Détails de l'urgence",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',                    
                    headerTitleStyle: { fontWeight: 'bold' },

                    headerLeft: ()=>(
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 2 }}>
                            <Ionicons name="arrow-back" size={34} color="#fff" />
                        </TouchableOpacity>
                    ),

                    headerRight: ()=>(
                        <TouchableOpacity onPress={() => handleEdit()}>
                            <Ionicons name="create" size={34} color="#fff" />
                        </TouchableOpacity>
                    )
                }}
            />


        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Priorité Card */}
            <View style={[styles.prioriteCard, { backgroundColor: prioriteConfig.backgroundColor }]}>
                <View style={styles.prioriteHeader}>
                    <Ionicons name={prioriteConfig.icon} size={32} color={prioriteConfig.color} />
                    <View style={styles.prioriteTextContainer}>
                        <Text style={[styles.prioriteLabel, { color: prioriteConfig.color }]}>
                            {prioriteConfig.label}
                        </Text>
                        <Text style={styles.prioriteDescription}>
                            {prioriteConfig.description}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Titre et description */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations</Text>
                <View style={styles.infoCard}>
                    <Text style={styles.urgenceTitle}>{urgence.intitule}</Text>
                    <Text style={styles.urgenceDescription}>{urgence.description}</Text>
                </View>
            </View>

            {/* Statut */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Statut actuel</Text>
                <View style={[styles.statutCard, { backgroundColor: statutConfig.backgroundColor }]}>
                    <View style={styles.statutHeader}>
                        <Ionicons name={statutConfig.icon} size={24} color={statutConfig.color} />
                        <Text style={[styles.statutLabel, { color: statutConfig.color }]}>
                            {statutConfig.label}
                        </Text>
                    </View>
                    <Text style={styles.statutDescription}>
                        {statutConfig.description}
                    </Text>
                </View>
            </View>

            {/* Date et heure */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date et heure</Text>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color="#007AFF" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Date</Text>
                            <Text style={styles.infoValue}>
                                {dateObj.toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={20} color="#007AFF" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Heure</Text>
                            <Text style={styles.infoValue}>
                                {dateObj.toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Localisation */}
            {urgence.latitude && urgence.longitude && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Localisation</Text>
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: urgence.latitude,
                                longitude: urgence.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                        >
                            <Marker
                                coordinate={{
                                    latitude: urgence.latitude,
                                    longitude: urgence.longitude,
                                }}
                                title="Position de l'urgence"
                            />
                        </MapView>
                    </View>
                    <View style={styles.coordinatesCard}>
                        <Text style={styles.coordinatesLabel}>Coordonnées GPS</Text>
                        <Text style={styles.coordinatesValue}>
                            {urgence.latitude.toFixed(6)}, {urgence.longitude.toFixed(6)}
                        </Text>
                    </View>
                </View>
            )}

            {/* IDs (pour debug/admin) */}
            {urgence.idAssistant && (
                <View style={styles.section}>
                    <View style={styles.infoCard}>
                        
                            <>
                                <View style={styles.divider} />
                                <View style={styles.idRow}>
                                    <Text style={styles.idLabel}>Assistant assigné</Text>
                                    <Text style={styles.idValue}>#{urgence.idAssistant}</Text>
                                </View>
                            </>

                    </View>
                </View> 
            )}

            {/* Actions */}

            

            {urgence.statut !=='en_attente' && (
                <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                        style={styles.actionButtonMsg}
                        onPress={handleNavigateDiscution}
                    >
                        <Ionicons name="chatbubbles-outline" size={20} color="#007AFF" />
                        <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>
                            Discuter avec le service d’intervention 
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

                
            

            <View style={styles.actionsContainer}>
                
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => delete_urgence(urgence.idUrgence, urgence.id)}
                    >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                            Annuler l'urgence
                        </Text>
                    </TouchableOpacity>
                
                
                
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#F5F5F5',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    prioriteCard: {
        marginHorizontal: 16,
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
    },
    prioriteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prioriteTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    prioriteLabel: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    prioriteDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    urgenceTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
        lineHeight: 26,
    },
    urgenceDescription: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    statutCard: {
        padding: 16,
        borderRadius: 16,
    },
    statutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statutLabel: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
    },
    statutDescription: {
        fontSize: 13,
        color: '#666',
        marginLeft: 36,
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        color: '#1A1A1A',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    mapContainer: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#E0E0E0',
    },
    map: {
        flex: 1,
    },
    coordinatesCard: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coordinatesLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    coordinatesValue: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    idRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    idLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    idValue: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    actionsContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    actionButton: {
        marginTop:16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#a30808',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    actionButtonMsg:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    }


})