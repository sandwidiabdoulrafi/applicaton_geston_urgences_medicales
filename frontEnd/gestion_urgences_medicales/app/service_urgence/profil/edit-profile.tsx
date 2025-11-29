import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Switch
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getUserServices } from '@/Routes/routeRoom/serviceSanteRoomService';
import ServiceSante from '@/types/ServiceSante';
import LoadingAnimation from '@/components/LoadingAnimation';
import { saveEditServiceProfil } from '@/Routes/routeService/ServiceSanteService';

export default function EditProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    
    const [formData, setFormData] = useState<ServiceSante | null>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

    const { serviceId } = useLocalSearchParams();

    useEffect(() => {
        setLoading(true);
        const fetchUser = async () => {
            try {
                const response = await getUserServices();
                console.log("\n\n\n\n response dans edit : ", response);

                if (Array.isArray(response) && response.length > 0) {
                    if (serviceId) {
                        const service = response.find(s => s.id.toString() === serviceId);
                        setFormData(service || response[0]);
                    } else {
                        setFormData(response[0]);
                    }
                } else if (!Array.isArray(response)) {
                    setFormData(response);
                }
            } catch (error) {
                console.error("Erreur lors du chargement:", error);
                Alert.alert('Erreur', 'Impossible de charger les données');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [serviceId]);

    // Fonction pour calculer la distance entre deux points (en mètres)
    const calculateDistance = (
        lat1: number, 
        lon1: number, 
        lat2: number, 
        lon2: number
    ): number => {
        const R = 6371e3; // Rayon de la Terre en mètres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance en mètres
    };

    // Fonction pour obtenir et vérifier la position
    const getAndVerifyLocation = async () => {
        setGettingLocation(true);
        
        try {
            // Demander la permission de localisation
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission refusée',
                    'Nous avons besoin de votre position pour vérifier que vous êtes dans l\'établissement.'
                );
                setGettingLocation(false);
                return;
            }

            // Obtenir la position actuelle de l'utilisateur
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const currentLat = location.coords.latitude;
            const currentLon = location.coords.longitude;

            setUserLocation({
                latitude: currentLat,
                longitude: currentLon
            });

            // Si l'établissement a déjà des coordonnées, vérifier la distance
            if (formData?.latitude && formData?.longitude) {
                const distance = calculateDistance(
                    currentLat,
                    currentLon,
                    formData.latitude,
                    formData.longitude
                );

                // Vérifier si l'utilisateur est à moins de 100 mètres de l'établissement
                const RAYON_VERIFICATION = 100; // 100 mètres

                if (distance > RAYON_VERIFICATION) {
                    Alert.alert(
                        'Position incorrecte',
                        `Vous devez être dans l'établissement pour mettre à jour sa position.\n\nDistance actuelle: ${Math.round(distance)} mètres`,
                        [
                            { text: 'OK' },
                            {
                                text: 'Forcer la mise à jour',
                                style: 'destructive',
                                onPress: () => {
                                    setFormData({
                                        ...formData,
                                        latitude: currentLat,
                                        longitude: currentLon,
                                        lastUpdated: new Date()
                                    });
                                    Alert.alert('Succès', 'Position mise à jour');
                                }
                            }
                        ]
                    );
                } else {
                    // L'utilisateur est bien dans l'établissement
                    setFormData({
                        ...formData,
                        latitude: currentLat,
                        longitude: currentLon,
                        lastUpdated: new Date()
                    });
                    Alert.alert(
                        'Position confirmée',
                        `Vous êtes bien dans l'établissement (${Math.round(distance)} mètres du point de référence).\n\nCoordonnées mises à jour!`
                    );
                }
            } else {
                // Première configuration des coordonnées
                Alert.alert(
                    'Confirmation',
                    'Êtes-vous actuellement dans l\'établissement ?\n\nCes coordonnées seront utilisées comme point de référence.',
                    [
                        { text: 'Non', style: 'cancel' },
                        {
                            text: 'Oui, confirmer',
                            onPress: () => {
                                setFormData({
                                    ...formData!,
                                    latitude: currentLat,
                                    longitude: currentLon,
                                    lastUpdated: new Date()
                                });
                                Alert.alert('Succès', 'Position enregistrée avec succès!');
                            }
                        }
                    ]
                );
            }

        } catch (error) {
            console.error('Erreur de géolocalisation:', error);
            Alert.alert(
                'Erreur',
                'Impossible d\'obtenir votre position. Veuillez vérifier que les services de localisation sont activés.'
            );
        } finally {
            setGettingLocation(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder aux photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && formData) {
            setFormData({ ...formData, photoProfil: result.assets[0].uri });
        }
    };

    const handleSave = async () => {
        if (!formData) return;

        // Validation des champs obligatoires
        if (!formData.nomEtablissement?.trim()) {
            Alert.alert('Erreur', 'Le nom de l\'établissement est requis');
            return;
        }
        if (!formData.telephone?.trim()) {
            Alert.alert('Erreur', 'Le numéro de téléphone est requis');
            return;
        }
        if (!formData.email?.trim()) {
            Alert.alert('Erreur', 'L\'email est requis');
            return;
        }

        // Vérification des coordonnées
        if (!formData.latitude || !formData.longitude) {
            Alert.alert(
                'Coordonnées manquantes',
                'Veuillez définir la position de votre établissement avant d\'enregistrer.',
                [{ text: 'OK' }]
            );
            return;
        }

        setSaving(true);
        try {
        
            
            const result = await saveEditServiceProfil(formData);

            if(result.success){
                Alert.alert('Succès', 'Profil mis à jour avec succès', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
            
          
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !formData) {
        return <LoadingAnimation />;
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: 'Modification de vos informations',
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' },
                }}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Photo de profil */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        {formData.photoProfil ? (
                            <Image source={{ uri: formData.photoProfil }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="business" size={50} color="#9CA3AF" />
                            </View>
                        )}
                        <View style={styles.cameraButton}>
                            <Ionicons name="camera" size={18} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Touchez pour changer la photo</Text>
                </View>

                {/* Formulaire */}
                <View style={styles.form}>
                    <InputField
                        label="Nom de l'établissement *"
                        value={formData.nomEtablissement || ''}
                        onChangeText={(text) => setFormData({ ...formData, nomEtablissement: text })}
                        icon="business-outline"
                    />
                    
                    <InputField
                        label="Type d'établissement"
                        value={formData.typeEtablissement || ''}
                        onChangeText={(text) => setFormData({ ...formData, typeEtablissement: text })}
                        icon="medical-outline"
                    />
                    
                    <InputField
                        label="Téléphone *"
                        value={formData.telephone || ''}
                        onChangeText={(text) => setFormData({ ...formData, telephone: text })}
                        icon="call-outline"
                        keyboardType="phone-pad"
                    />
                    
                    <InputField
                        label="Email *"
                        value={formData.email || ''}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        icon="mail-outline"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    
                    <InputField
                        label="Adresse"
                        value={formData.adresse || ''}
                        onChangeText={(text) => setFormData({ ...formData, adresse: text })}
                        icon="location-outline"
                    />
                    
                    <InputField
                        label="Ville"
                        value={formData.ville || ''}
                        onChangeText={(text) => setFormData({ ...formData, ville: text })}
                        icon="navigate-outline"
                    />
                    
                    <InputField
                        label="Description"
                        value={formData.description || ''}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        icon="document-text-outline"
                        multiline
                        numberOfLines={4}
                    />

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Ouvert 24h</Text>
                        <Switch
                            value={formData.ouvert24h === true}
                            onValueChange={(value) =>
                                setFormData({ ...formData, ouvert24h: value })
                            }
                            trackColor={{ false: "#767577", true: "#34C759" }}
                            thumbColor={formData.ouvert24h ? "#FFFFFF" : "#f4f3f4"}
                        />
                    </View>

                    {!formData.ouvert24h && (
                        <>
                            <InputField
                                label="Heure d'ouverture"
                                value={formData.heureOuverture || ''}
                                onChangeText={(text) => setFormData({ ...formData, heureOuverture: text })}
                                icon="sunny-outline"
                                placeholder="Ex: 08:00"
                            />
                            
                            <InputField
                                label="Heure de fermeture"
                                value={formData.heureFermeture || ''}
                                onChangeText={(text) => setFormData({ ...formData, heureFermeture: text })}
                                icon="moon-outline"
                                placeholder="Ex: 18:00"
                            />
                        </>
                    )}

                    {/* Section Géolocalisation */}
                    <View style={styles.locationSection}>
                        <View style={styles.locationHeader}>
                            <Ionicons name="location" size={24} color="#0066CC" />
                            <Text style={styles.sectionTitle}>Position de l'établissement</Text>
                        </View>

                        {formData.latitude && formData.longitude ? (
                            <View style={styles.locationInfo}>
                                <View style={styles.locationRow}>
                                    <Text style={styles.locationLabel}>Latitude:</Text>
                                    <Text style={styles.locationValue}>{formData.latitude.toFixed(6)}</Text>
                                </View>
                                <View style={styles.locationRow}>
                                    <Text style={styles.locationLabel}>Longitude:</Text>
                                    <Text style={styles.locationValue}>{formData.longitude.toFixed(6)}</Text>
                                </View>
                                {formData.lastUpdated && (
                                    <Text style={styles.locationDate}>
                                        Mis à jour le {new Date(formData.lastUpdated).toLocaleDateString('fr-FR')}
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <View style={styles.locationWarning}>
                                <Ionicons name="warning" size={20} color="#F59E0B" />
                                <Text style={styles.locationWarningText}>
                                    Aucune position définie
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={getAndVerifyLocation}
                            disabled={gettingLocation}
                        >
                            {gettingLocation ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="navigate" size={20} color="#FFFFFF" />
                                    <Text style={styles.locationButtonText}>
                                        {formData.latitude && formData.longitude 
                                            ? 'Mettre à jour la position' 
                                            : 'Définir la position'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.locationHint}>
                            💡 Vous devez être physiquement dans l'établissement pour {formData.latitude ? 'mettre à jour' : 'définir'} sa position
                        </Text>
                    </View>
                </View>

                {/* Boutons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => router.back()}
                        disabled={saving}
                    >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Composant InputField réutilisable
interface InputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    icon: any;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: any;
    autoCapitalize?: any;
    placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    value,
    onChangeText,
    icon,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    placeholder
}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
            <Ionicons name={icon} size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
                style={[styles.input, multiline && styles.inputMultiline]}
                value={value}
                onChangeText={onChangeText}
                multiline={multiline}
                numberOfLines={numberOfLines}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    content: {
        flex: 1,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0066CC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarHint: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    form: {
        paddingHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
    },
    inputMultiline: {
        minHeight: 100,
        paddingTop: 14,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    locationSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginTop: 8,
        marginBottom: 20,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 8,
    },
    locationInfo: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    locationValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    locationDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
        fontStyle: 'italic',
    },
    locationWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    locationWarningText: {
        fontSize: 14,
        color: '#92400E',
        marginLeft: 8,
        fontWeight: '500',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0066CC',
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    locationButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    locationHint: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        textAlign: 'center',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0066CC',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    bottomSpacer: {
        height: 40,
    },
});