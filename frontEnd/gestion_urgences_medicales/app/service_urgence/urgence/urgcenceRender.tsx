import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import {UrgenceSevice} from '@/types/urgenceType';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';



type StatutType = 'en_attente' | 'en_cours' | 'termine' | 'tous';

export default function urgcenceRender ({ item }: { item: UrgenceSevice })  {


    const getStatutStyle = (statut: string) => {
        const statutNormalized = statut?.toLowerCase() as StatutType;
        switch (statutNormalized) {
            case 'en_attente':
                return { 
                    backgroundColor: '#FFF3CD', 
                    color: '#856404', 
                    label: 'En attente',
                    icon: 'time-outline' as const
                };
            case 'en_cours':
                return { 
                    backgroundColor: '#D1ECF1', 
                    color: '#0C5460', 
                    label: 'En cours',
                    icon: 'reload-outline' as const
                };
            case 'termine':
                return { 
                    backgroundColor: '#D4EDDA', 
                    color: '#155724', 
                    label: 'Terminé',
                    icon: 'checkmark-circle-outline' as const
                };
            default:
                return { 
                    backgroundColor: '#E2E3E5', 
                    color: '#383D41', 
                    label: statut,
                    icon: 'ellipse-outline' as const
                };
        }
    };

    const getPrioriteStyle = (priorite?: string) => {
            const prioriteNormalized = priorite?.toLowerCase();
    
            if (prioriteNormalized === 'vitale' || prioriteNormalized === 'vital') {
                return { 
                    backgroundColor: '#F8D7DA', 
                    color: '#721C24', 
                    label: 'Vital', 
                    icon: 'alert-circle' as const,
                    borderColor: '#F5C6CB'
                };
            }
            
            switch (prioriteNormalized) {
                case 'grave':
                    return { 
                        backgroundColor: '#FFE5B4', 
                        color: '#8B4513', 
                        label: 'Grave', 
                        icon: 'warning' as const,
                        borderColor: '#FFD98E'
                    };
                case 'consultation':
                    return { 
                        backgroundColor: '#D1ECF1', 
                        color: '#0C5460', 
                        label: 'Consultation', 
                        icon: 'information-circle-outline' as const,
                        borderColor: '#BEE5EB'
                    };
                default:
                    return { 
                        backgroundColor: '#E2E3E5', 
                        color: '#383D41', 
                        label: priorite || 'Non définie', 
                        icon: 'help-circle-outline' as const,
                        borderColor: '#D6D8DB'
                    };
            }
        };





    const statutStyle = getStatutStyle(item.statut);
    const prioriteStyle = getPrioriteStyle(item.priorite);

    const router = useRouter()

    const handleNavigateDetail = (idUrgence) => {
        router.push({
            pathname: "/service_urgence/urgence/[id]",
            params: { id: idUrgence }
        });
    };


        return (
            <TouchableOpacity 
                style={[
                    styles.urgenceItem,
                    { borderLeftColor: prioriteStyle.borderColor }
                ]}
                activeOpacity={0.7}
                onPress={()=>handleNavigateDetail(item.idUrgence)}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Ionicons 
                            name={prioriteStyle.icon} 
                            size={24} 
                            color={prioriteStyle.color} 
                            style={styles.prioriteIcon}
                        />
                        <Text style={styles.intitule} numberOfLines={2}>
                            {item.intitule}
                        </Text>
                    </View>
                    <View style={[styles.prioriteBadge, { backgroundColor: prioriteStyle.backgroundColor }]}>
                        <Text style={[styles.prioriteText, { color: prioriteStyle.color }]}>
                            {prioriteStyle.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Statut:</Text>
                        <View style={[styles.statutBadge, { backgroundColor: statutStyle.backgroundColor }]}>
                            <Ionicons name={statutStyle.icon} size={14} color={statutStyle.color} />
                            <Text style={[styles.statutText, { color: statutStyle.color }]}>
                                {statutStyle.label}
                            </Text>
                        </View>
                    </View>

                    {item.dateIntervention && (
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={16} color="#718096" />
                            <Text style={styles.label}>Intervention:</Text>
                            <Text style={styles.value}>
                                {new Date(item.dateIntervention).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };


const styles = StyleSheet.create({
    urgenceItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderLeftWidth: 5,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 10,
        paddingBottom: 5,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: 8,
    },

    prioriteIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    intitule: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A202C',
        flex: 1,
        lineHeight: 24,
    },
    prioriteBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    prioriteText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 16,
    },
    infoSection: {
        padding: 16,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'space-between',
        gap: 8,
        flexWrap: 'wrap',
    },
    label: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        color: '#2D3748',
        fontWeight: '600',
        flex: 1,
    },
    statutBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    statutText: {
        fontSize: 13,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    idUrgence: {
        fontSize: 12,
        color: '#A0AEC0',
        fontStyle: 'italic',
    },
})
