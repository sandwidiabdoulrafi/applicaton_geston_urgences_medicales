import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Switch
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import ServiceSante from '@/types/ServiceSante';
import { getUserServices } from '@/Routes/routeRoom/serviceSanteRoomService';
import { LogOutService } from '@/Routes/routeService/ServiceSanteService';

import {useAuth} from '../../contexts/AuthContext'

export default function Profil() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [service, setService] = useState<ServiceSante | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const {signOut} = useAuth()

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getUserServices();
            console.log("Response: ", response);
            
            if (Array.isArray(response) && response.length > 0) {
                setService(response[0]);
            } else if (!Array.isArray(response)) {
                setService(response);
            } else {
                setError("Aucun service trouvé");
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de l'utilisateur: ", error);
            setError("Impossible de charger les informations du profil");
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUser();
        setRefreshing(false);
    };

    const handleEditProfile = () => {
        if (service) {
            router.push({
                pathname: '/service_urgence/profil/edit-profile',
                params: { serviceId: service.id }
            });
        }
    };

    const handleChangePassword = () => {
        router.push('/service_urgence/profil/change-password');
    };

    const handlePrivacyPolicy = () => {
        router.push('/service_urgence/profil/privacy-policy');
    };



    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                {
                    text: 'Annuler',
                    style: 'cancel'
                },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        
                        const response = await LogOutService();

                        if(response.success){
                            await signOut()
                        }
                        
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer le compte',
            'Cette action est irréversible. Toutes vos données seront définitivement supprimées. Êtes-vous absolument sûr ?',
            [
                {
                    text: 'Annuler',
                    style: 'cancel'
                },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Confirmation finale',
                            'Tapez votre mot de passe pour confirmer la suppression',
                            [
                                {
                                    text: 'Annuler',
                                    style: 'cancel'
                                },
                                {
                                    text: 'Confirmer',
                                    style: 'destructive',
                                    onPress: async () => {
                                        // TODO: Logique de suppression du compte
                                        Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès');
                                        router.replace('/auth/SignServiceSante');
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    if (loading && !service) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>Chargement du profil...</Text>
            </View>
        );
    }

    if (error || !service) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={80} color="#E53E3E" />
                <Text style={styles.errorText}>{error || "Profil introuvable"}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchUser}>
                    <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const serviceId = service.idService || service.idEtablissement || 'N/A';
    const isActive = typeof service.isActive === 'number' ? service.isActive === 1 : service.isActive;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0066CC"
                    />
                }
            >
                {/* Header avec gradient */}
                <LinearGradient
                    colors={['#0066CC', '#0052A3']}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            {service.photoProfil ? (
                                <Image
                                    source={{ uri: service.photoProfil }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="business" size={50} color="#0066CC" />
                                </View>
                            )}
                            {isActive && (
                                <View style={styles.statusBadge}>
                                    <View style={styles.statusDot} />
                                </View>
                            )}
                        </View>

                        <Text style={styles.etablissementName}>
                            {service.nomEtablissement}
                        </Text>
                        <Text style={styles.etablissementType}>{service.typeEtablissement}</Text>
                        
                        <View style={styles.idBadge}>
                            <Ionicons name="pricetag-outline" size={14} color="#B3D9FF" />
                            <Text style={styles.idText}>ID: {serviceId}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Informations rapides */}
                <View style={styles.quickInfoContainer}>
                    <View style={styles.quickInfoCard}>
                        <Ionicons name="location" size={20} color="#0066CC" />
                        <Text style={styles.quickInfoText}>{service.ville}</Text>
                    </View>
                    <View style={styles.quickInfoCard}>
                        <Ionicons name="call" size={20} color="#0066CC" />
                        <Text style={styles.quickInfoText}>{service.telephone}</Text>
                    </View>
                </View>

                {/* Section Mon Compte */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mon Compte</Text>
                    
                    <View style={styles.menuCard}>
                        <MenuItem
                            icon="person-outline"
                            title="Modifier le profil"
                            subtitle="Informations personnelles"
                            onPress={handleEditProfile}
                            iconColor="#0066CC"
                        />
                        <MenuItem
                            icon="lock-closed-outline"
                            title="Changer le mot de passe"
                            subtitle="Sécurité du compte"
                            onPress={handleChangePassword}
                            iconColor="#8B5CF6"
                        />

                    </View>
                </View>


                {/* Section Paramètres */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paramètres</Text>
                    
                    <View style={styles.menuCard}>
                        <MenuItem
                            icon="shield-checkmark-outline"
                            title="Confidentialité"
                            subtitle="Politique de confidentialité"
                            onPress={handlePrivacyPolicy}
                            iconColor="#10B981"
                        />
                        
                    </View>
                </View>

                {/* Section Actions dangereuses */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Zone de danger</Text>
                    
                    <View style={styles.menuCard}>
                        <MenuItem
                            icon="log-out-outline"
                            title="Déconnexion"
                            subtitle="Se déconnecter du compte"
                            onPress={handleLogout}
                            iconColor="#F59E0B"
                            showChevron={false}
                        />
                        <MenuItem
                            icon="trash-outline"
                            title="Supprimer le compte"
                            subtitle="Action irréversible"
                            onPress={handleDeleteAccount}
                            iconColor="#EF4444"
                            showChevron={false}
                            isLast
                        />
                    </View>
                </View>

                {/* Version de l'app */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                    <Text style={styles.versionSubtext}>
                        Urgence Santé BF © 2025
                    </Text>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

// Composant MenuItem réutilisable
interface MenuItemProps {
    icon: any;
    title: string;
    subtitle: string;
    onPress: () => void;
    iconColor: string;
    showChevron?: boolean;
    isLast?: boolean;
    rightElement?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    iconColor,
    showChevron = true,
    isLast = false,
    rightElement
}) => (
    <TouchableOpacity
        style={[styles.menuItem, isLast && styles.menuItemLast]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[styles.menuIconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        {rightElement || (showChevron && (
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        ))}
    </TouchableOpacity>
);

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
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#E2E8F0',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0066CC',
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
    },
    etablissementName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
        paddingHorizontal: 20,
    },
    etablissementType: {
        fontSize: 16,
        color: '#B3D9FF',
        marginBottom: 8,
    },
    idBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    idText: {
        fontSize: 12,
        color: '#B3D9FF',
        fontWeight: '500',
    },
    quickInfoContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
    },
    quickInfoCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    quickInfoText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600',
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        marginTop: 20,
    },
    versionText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    versionSubtext: {
        fontSize: 12,
        color: '#D1D5DB',
        marginTop: 4,
    },
    bottomSpacer: {
        height: 40,
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
        gap: 8,
        backgroundColor: '#0066CC',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});