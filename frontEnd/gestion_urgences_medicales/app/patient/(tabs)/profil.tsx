import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import roomPatient from '../../../Routes/routeRoom/roomPatient';

export default function Profil() {
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPatient();
    }, []);

    const loadPatient = async () => {
        try {
            // Récupérer le premier patient (car un seul utilisateur dans l'app)
            const patients = await roomPatient.getAllPatients();
            if (patients && patients.length > 0) {
                setPatient(patients[0]);
            }
        } catch (error) {
            console.error('Erreur chargement patient:', error);
        } finally {
            setLoading(false);
        }
    };

    const changePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Activez l\'accès à la galerie');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && patient) {
                await roomPatient.updatePatient(patient.idPatient, {
                    photoProfil: result.assets[0].uri
                });
                loadPatient();
                Alert.alert('Succès', 'Photo de profil mise à jour');
            }
        } catch (error) {
            console.error('Erreur changement photo:', error);
            Alert.alert('Erreur', 'Impossible de changer la photo');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        await roomPatient.logoutPatient();
                        router.replace('/auth/login'); // À adapter selon votre route
                    }
                }
            ]
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Non renseigné';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const calculateAge = (dateString: string) => {
        if (!dateString) return null;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ title: "Profil" }} />
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    if (!patient) {
        return (
            <View style={styles.errorContainer}>
                <Stack.Screen options={{ title: "Profil" }} />
                <Ionicons name="person-circle-outline" size={64} color="#999" />
                <Text style={styles.errorText}>Aucun patient connecté</Text>
                <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => router.push('/auth/login')}
                >
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const age = calculateAge(patient.dateNaissance);

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{
                    title: "Mon Profil",
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/patient/profil/edit')}>
                            <Ionicons name="create-outline" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    )
                }} 
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header avec photo */}
                <View style={styles.header}>
                    <View style={styles.photoContainer}>
                        {patient.photoProfil ? (
                            <Image 
                                source={{ uri: patient.photoProfil }} 
                                style={styles.photo}
                            />
                        ) : (
                            <View style={[styles.photo, styles.photoPlaceholder]}>
                                <Ionicons name="person" size={64} color="#999" />
                            </View>
                        )}
                        <TouchableOpacity 
                            style={styles.photoEditButton}
                            onPress={changePhoto}
                        >
                            <Ionicons name="camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.name}>
                        {patient.prenom} {patient.nom}
                    </Text>
                    {age && (
                        <Text style={styles.age}>{age} ans</Text>
                    )}
                </View>

                {/* Informations personnelles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail" size={20} color="#007AFF" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{patient.email}</Text>
                            </View>
                        </View>

                        {patient.telephone && (
                            <View style={styles.infoRow}>
                                <Ionicons name="call" size={20} color="#34C759" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Téléphone</Text>
                                    <Text style={styles.infoValue}>{patient.telephone}</Text>
                                </View>
                            </View>
                        )}

                        {patient.dateNaissance && (
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar" size={20} color="#FF9500" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Date de naissance</Text>
                                    <Text style={styles.infoValue}>
                                        {formatDate(patient.dateNaissance)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {patient.lieuResidence && (
                            <View style={styles.infoRow}>
                                <Ionicons name="location" size={20} color="#FF3B30" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Lieu de résidence</Text>
                                    <Text style={styles.infoValue}>{patient.lieuResidence}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Informations médicales */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations médicales</Text>

                    <View style={styles.infoCard}>
                        {patient.groupeSanguin && (
                            <View style={styles.infoRow}>
                                <Ionicons name="water" size={20} color="#FF3B30" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Groupe sanguin</Text>
                                    <Text style={[styles.infoValue, styles.bloodType]}>
                                        {patient.groupeSanguin}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {patient.numeroUrgence && (
                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={20} color="#FF9500" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Contact d'urgence</Text>
                                    <Text style={styles.infoValue}>{patient.numeroUrgence}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Actions rapides */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/patient/profil/edit')}
                    >
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="create" size={24} color="#007AFF" />
                            <View style={styles.actionButtonText}>
                                <Text style={styles.actionButtonTitle}>Modifier le profil</Text>
                                <Text style={styles.actionButtonSubtitle}>
                                    Mettre à jour vos informations
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/patient/profil/security')}
                    >
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="lock-closed" size={24} color="#34C759" />
                            <View style={styles.actionButtonText}>
                                <Text style={styles.actionButtonTitle}>Sécurité</Text>
                                <Text style={styles.actionButtonSubtitle}>
                                    Changer le mot de passe
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={handleLogout}
                    >
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="log-out" size={24} color="#FF3B30" />
                            <View style={styles.actionButtonText}>
                                <Text style={[styles.actionButtonTitle, styles.dangerText]}>
                                    Déconnexion
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>

                {/* Informations compte */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations du compte</Text>
                    
                    <View style={styles.accountInfo}>
                        <Text style={styles.accountInfoText}>
                            Inscrit le: {formatDate(patient.dateInscription)}
                        </Text>
                        <Text style={styles.accountInfoText}>
                            Dernière MAJ: {formatDate(patient.derniereMiseAJour)}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
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
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        marginBottom: 24,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0F0F0',
    },
    photoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    age: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        marginTop: 24,
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
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    infoContent: {
        marginLeft: 16,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    bloodType: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FF3B30',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    actionButtonDanger: {
        borderWidth: 1,
        borderColor: '#FFE5E5',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    actionButtonText: {
        marginLeft: 16,
        flex: 1,
    },
    actionButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    actionButtonSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    dangerText: {
        color: '#FF3B30',
    },
    accountInfo: {
        backgroundColor: '#F8F8F8',
        padding: 16,
        borderRadius: 12,
    },
    accountInfoText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
        fontFamily: 'monospace',
    },
});