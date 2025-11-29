import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity,
    Alert,
    Linking,
    Platform
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UrgenceComplet } from '@/types/urgenceType';
import { getUrgenceById } from '@/Routes/routeRoom/serviceSanteRoomService';

export default function DetailUrgenceService() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [urgence, setUrgence] = useState<UrgenceComplet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUrgence = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getUrgenceById(id);
                setUrgence(response);
            } catch (err) {
                console.error("Erreur lors du chargement de l'urgence:", err);
                setError("Impossible de charger les détails de l'urgence");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUrgence();
        }
    }, [id]);

    const getStatutStyle = (statut: string) => {
        const s = statut?.toLowerCase();
        switch (s) {
            case 'en_attente':
                return {
                    bg: '#FFF3CD',
                    color: '#856404',
                    icon: 'time-outline' as const,
                    label: 'En Attente'
                };
            case 'en_cours':
                return {
                    bg: '#D1ECF1',
                    color: '#0C5460',
                    icon: 'reload-outline' as const,
                    label: 'En Cours'
                };
            case 'termine':
                return {
                    bg: '#D4EDDA',
                    color: '#155724',
                    icon: 'checkmark-circle-outline' as const,
                    label: 'Terminé'
                };
            default:
                return {
                    bg: '#E2E3E5',
                    color: '#383D41',
                    icon: 'ellipse-outline' as const,
                    label: statut
                };
        }
    };

    const getPrioriteStyle = (priorite?: string) => {
        const p = priorite?.toLowerCase();
        if (p === 'vitale' || p === 'vital') {
            return {
                bg: '#F8D7DA',
                color: '#721C24',
                icon: 'alert-circle' as const,
                label: 'Vital'
            };
        }

        switch (p) {
            case 'grave':
                return {
                    bg: '#FFE5B4',
                    color: '#8B4513',
                    icon: 'warning' as const,
                    label: 'Grave'
                };
            case 'consultation':
                return {
                    bg: '#D1ECF1',
                    color: '#0C5460',
                    icon: 'information-circle-outline' as const,
                    label: 'Consultation'
                };
            default:
                return {
                    bg: '#E2E3E5',
                    color: '#383D41',
                    icon: 'help-circle-outline' as const,
                    label: priorite || 'N/D'
                };
        }
    };

    const formatDate = (d?: string) =>
        d ? new Date(d).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Non renseigné';

    // Fonction pour ouvrir la carte avec les coordonnées
    const openMap = (latitude: number, longitude: number) => {
        const scheme = Platform.select({
            ios: 'maps:0,0?q=',
            android: 'geo:0,0?q='
        });
        const latLng = `${latitude},${longitude}`;
        const label = 'Urgence médicale';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        Linking.openURL(url as string).catch(() => {
            Alert.alert(
                'Erreur',
                'Impossible d\'ouvrir l\'application de cartographie'
            );
        });
    };

    // Fonction pour appeler
    const makePhoneCall = () => {
        if (!urgence?.telephonePatient) {
            Alert.alert(
                'Numéro indisponible',
                'Aucun numéro de téléphone n\'est associé à ce patient.'
            );
            return;
        }

        const phoneNumber = `tel:${urgence.telephonePatient}`;
        
        Linking.canOpenURL(phoneNumber)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(phoneNumber);
                } else {
                    Alert.alert(
                        'Erreur',
                        'Impossible d\'effectuer l\'appel sur cet appareil'
                    );
                }
            })
            .catch(() => {
                Alert.alert(
                    'Erreur',
                    'Une erreur s\'est produite lors de l\'appel'
                );
            });
    };

    // Fonction pour naviguer vers la discussion
    const goToDiscussion = () => {
        if (urgence?.idUrgence) {
            router.push({
                pathname: '/service_urgence/discussion/[id]',
                params: { id: urgence.idUrgence }
            });
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    if (error || !urgence) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={64} color="#E53E3E" />
                <Text style={styles.errorText}>{error || "Urgence introuvable"}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back-outline" size={20} color="#FFF" />
                    <Text style={styles.retryButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statut = getStatutStyle(urgence.statut);
    const priorite = getPrioriteStyle(urgence.priorite);

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: urgence.intitule || "Detail de l'urgence",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ marginLeft: 8 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    ),

                    headerRight:()=>(
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname:"/service_urgence/urgence/PatientInfo",
                                params:{id : urgence.idPatient}
                            })}
                            style={{ marginRight: 8 }}
                        
                        >
                            <Ionicons name="information-sharp" size={24} color="#fff" />
                        </TouchableOpacity>
                    )
                }}
                
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Carte principale avec priorité */}
                <View style={styles.mainCard}>
                    <View style={styles.prioriteHeader}>
                        <View
                            style={[
                                styles.prioriteBadgeLarge,
                                { backgroundColor: priorite.bg }
                            ]}
                        >
                            <Ionicons
                                name={priorite.icon}
                                size={20}
                                color={priorite.color}
                            />
                            <Text
                                style={[
                                    styles.prioriteTextLarge,
                                    { color: priorite.color }
                                ]}
                            >
                                {priorite.label}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.intitule}>{urgence.intitule}</Text>

                    <View style={styles.idSection}>
                        <Ionicons name="pricetag-outline" size={16} color="#718096" />
                        <Text style={styles.idUrgence}>#{urgence.idUrgence}</Text>
                    </View>
                </View>

                {/* Statut */}
                
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="stats-chart" size={20} style={styles.iconStatut} />
                        <Text style={styles.cardTitle}>Statut</Text>
                    </View>
                    <View
                        style={[
                            styles.statutBadge,
                            { backgroundColor: statut.bg }
                        ]}
                    >
                        <Ionicons
                            name={statut.icon}
                            size={18}
                            color={statut.color}
                        />
                        <Text
                            style={[styles.statutText, { color: statut.color }]}
                        >
                            {statut.label}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {urgence.description && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={20} style={styles.iconDescription}/>
                            <Text style={styles.cardTitle}>Description</Text>
                        </View>
                        <Text style={styles.descriptionText}>
                            {urgence.description}
                        </Text>
                    </View>
                )}

                {/* Informations patient */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person" size={20} style={styles.iconPatient} />
                        <Text style={styles.cardTitle}>Patient</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>ID Patient:</Text>
                        <Text style={styles.infoValue}>{urgence.idPatient}</Text>
                    </View>
                    {urgence.idAssistant && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Assistant assigné:</Text>
                            <Text style={styles.infoValue}>{urgence.idAssistant}</Text>
                        </View>
                    )}
                </View>

                {/* Dates */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar" size={20} style={styles.iconDate} />
                        <Text style={styles.cardTitle}>Dates</Text>
                    </View>
                    <View style={styles.dateSection}>
                        <View style={styles.dateItem}>
                            <Ionicons
                                name="add-circle-outline"
                                size={18}
                                color="#718096"
                            />
                            <View style={styles.dateContent}>
                                <Text style={styles.dateLabel}>Créée le</Text>
                                <Text style={styles.dateValue}>
                                    {formatDate(urgence.dateCreation)}
                                </Text>
                            </View>
                        </View>
                        {urgence.dateIntervention && (
                            <View style={styles.dateItem}>
                                <Ionicons
                                    name="medical-outline"
                                    size={18}
                                    style={styles.iconDate}
                                />
                                <View style={styles.dateContent}>
                                    <Text style={styles.dateLabel}>Intervention</Text>
                                    <Text style={styles.dateValue}>
                                        {formatDate(urgence.dateIntervention)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Localisation */}
                {(urgence.latitude && urgence.longitude) && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="location" size={20} style={styles.iconLocation} />
                            <Text style={styles.cardTitle}>Localisation</Text>
                        </View>
                        <View style={styles.locationSection}>
                            <View style={styles.coordinateRow}>
                                <Text style={styles.coordinateLabel}>Latitude:</Text>
                                <Text style={styles.coordinateValue}>
                                    {urgence.latitude.toFixed(6)}
                                </Text>
                            </View>
                            <View style={styles.coordinateRow}>
                                <Text style={styles.coordinateLabel}>Longitude:</Text>
                                <Text style={styles.coordinateValue}>
                                    {urgence.longitude.toFixed(6)}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.mapButton}
                                onPress={() => openMap(urgence.latitude!, urgence.longitude!)}
                            >
                                <Ionicons name="map-outline" size={18} color="#14B8A6" />
                                <Text style={styles.mapButtonText}>Voir sur la carte</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsCard}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={goToDiscussion}
                    >
                        <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Discuter</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(245, 247, 250, 0.95)',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 247, 250, 0.95)',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A202C',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    mainCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    prioriteHeader: {
        marginBottom: 16,
    },
    prioriteBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    prioriteTextLarge: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    intitule: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A202C',
        marginBottom: 12,
        lineHeight: 32,
    },
    idSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    idUrgence: {
        fontSize: 14,
        color: '#718096',
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    statutBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    statutText: {
        fontSize: 14,
        fontWeight: '600',
    },
    descriptionText: {
        fontSize: 15,
        color: '#4A5568',
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#2D3748',
        fontWeight: '600',
    },
    dateSection: {
        gap: 16,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    dateContent: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 14,
        color: '#2D3748',
        fontWeight: '600',
    },
    locationSection: {
        gap: 12,
    },
    coordinateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coordinateLabel: {
        fontSize: 14,
        color: '#718096',
    },
    coordinateValue: {
        fontSize: 14,
        color: '#2D3748',
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#14B8A6',
        marginTop: 8,
    },
    mapButtonText: {
        fontSize: 14,
        color: '#14B8A6',
        fontWeight: '600',
    },
    actionsCard: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginVertical: 12,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#0066CC',
        borderRadius: 12,
        shadowColor: '#0066CC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonSecondary: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#0066CC',
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    actionButtonTextSecondary: {
        fontSize: 16,
        color: '#0066CC',
        fontWeight: '600',
    },
    iconStatut: { color: '#3182CE' },     // bleu
    iconDescription: { color: '#805AD5' }, // violet
    iconPatient: { color: '#38A169' },     // vert
    iconDate: { color: '#D69E2E' },        // jaune foncé
    iconLocation: { color: '#E53E3E' },    // rouge rosé
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
        gap: 8,
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
});












