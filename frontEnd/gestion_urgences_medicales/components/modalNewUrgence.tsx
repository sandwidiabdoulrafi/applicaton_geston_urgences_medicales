import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, ScrollView, Alert, PanResponder, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import RoutesRoom from '../Routes/routeRoom/roomUrgences';
import roomPatient from '@/Routes/routeRoom/roomPatient';

// Schéma de validation Yup
const urgenceSchema = yup.object().shape({
    intitule: yup
        .string()
        .required("L'intitulé de l'urgence est obligatoire")
        .min(3, "L'intitulé doit contenir au moins 3 caractères")
        .max(100, "L'intitulé ne peut pas dépasser 100 caractères"),
    priorite: yup
        .string()
        .oneOf(['vitale', 'grave', 'consultation'], 'Veuillez sélectionner une priorité')
        .required('La priorité est obligatoire'),
    description: yup
        .string()
        .min(10, 'La description doit contenir au moins 10 caractères')
        .max(500, 'La description ne peut pas dépasser 500 caractères')
        .required('La description est obligatoire'),
    latitude: yup
        .number()
        .required('La localisation est obligatoire')
        .typeError('Latitude invalide'),
    longitude: yup
        .number()
        .required('La localisation est obligatoire')
        .typeError('Longitude invalide'),
    dateHeure: yup
        .date()
        .default(() => new Date())
        .required(),
});

type UrgenceFormData = yup.InferType<typeof urgenceSchema>;

interface ModalProps {
    modalVisible: boolean;
    closeModal: () => void;
}

export default function ModalNewUrgence({ modalVisible, closeModal }: ModalProps) {
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation pour le swipe
    const translateY = useRef(new Animated.Value(0)).current;
    const lastGesture = useRef(0);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<UrgenceFormData>({
        resolver: yupResolver(urgenceSchema),
        defaultValues: {
            intitule: '',
            priorite: '',
            description: '',
            dateHeure: new Date(),
            latitude: undefined,
            longitude: undefined,
        },
    });

    const latitude = watch('latitude');
    const longitude = watch('longitude');

    // PanResponder pour gérer le swipe vers le bas
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Activer seulement si on glisse vers le bas (dy > 0) et assez fort
                return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
            },
            onPanResponderGrant: () => {
                // Désactiver le tap de l'overlay pendant le swipe
                lastGesture.current = 0;
            },
            onPanResponderMove: (_, gestureState) => {
                // Autoriser uniquement le glissement vers le bas
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                    lastGesture.current = gestureState.dy;
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Si le glissement dépasse 150px, fermer le modal
                if (gestureState.dy > 150) {
                    closeModalWithAnimation();
                } else {
                    // Sinon, revenir à la position initiale
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }).start();
                }
            },
        })
    ).current;

    // Récupérer la géolocalisation à l'ouverture du modal
    useEffect(() => {
        if (modalVisible) {
            getLocation();
            // Réinitialiser la position du modal
            translateY.setValue(0);
        }
    }, [modalVisible]);

    const getLocation = async () => {
        setLoadingLocation(true);
        
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Activez la localisation pour signaler une urgence');
                setLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setValue('latitude', location.coords.latitude);
            setValue('longitude', location.coords.longitude);

            
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de récupérer votre position');
            console.error('Erreur de géolocalisation:', error);
        } finally {
            setLoadingLocation(false);
        }
    };

    const onSubmit = async (data: UrgenceFormData) => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {

            const idPatient = await roomPatient.getAllPatientsId();

            
            const localUrgenceId = await RoutesRoom.addNewUgenceLocal(idPatient[0].idPatient, data);
            console.log('Urgence enregistrée localement avec ID:', localUrgenceId);

            Alert.alert(
                'Succès', 
                'Urgence signalée avec succès', 
                [
                    { 
                        text: 'OK', 
                        onPress: () => {
                            handleClose();
                        }
                    }
                ]
            );
            
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            Alert.alert(
                'Erreur', 
                'Impossible d\'enregistrer l\'urgence. Veuillez réessayer.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModalWithAnimation = () => {
        Animated.timing(translateY, {
            toValue: 1000,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            handleClose();
        });
    };

    const handleClose = () => {
        reset();
        translateY.setValue(0);
        closeModal();
    };

    const handleOverlayPress = () => {
        if (!isSubmitting) {
            closeModalWithAnimation();
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={handleClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1}
                onPress={handleOverlayPress}
            >
                <Animated.View 
                    style={[
                        styles.modalContent,
                        {
                            transform: [{ translateY }]
                        }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <TouchableOpacity activeOpacity={1}>
                        {/* Barre de glissement */}
                        <View style={styles.modalHandle} />

                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Titre */}
                            <Text style={styles.modalTitle}>Signaler une urgence</Text>
                            
                            {/* Intitulé */}
                            <Text style={styles.sectionTitle}>
                                Intitulé <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={control}
                                name="intitule"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={[
                                            styles.input, 
                                            errors.intitule && styles.inputError
                                        ]}
                                        placeholder="Ex : Douleur thoracique, Malaise, Chute..."
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        maxLength={100}
                                    />
                                )}
                            />
                            {errors.intitule && (
                                <Text style={styles.errorText}>{errors.intitule.message}</Text>
                            )}


                             {/* Description */}
                            <Text style={styles.sectionTitle}>
                                Description <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={control}
                                name="description"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={[
                                            styles.textArea,
                                            errors.description && styles.inputError
                                        ]}
                                        placeholder="Décrivez votre urgence (min. 10 caractères)..."
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={4}
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        maxLength={500}
                                    />
                                )}
                            />
                            {errors.description && (
                                <Text style={styles.errorText}>{errors.description.message}</Text>
                            )}
                            <Text style={styles.charCount}>
                                {watch('description')?.length || 0}/500
                            </Text>


                            {/* Priorité */}
                            <Text style={styles.sectionTitle}>
                                Priorité <Text style={styles.required}>*</Text>
                            </Text>
                            
                            <Controller
                                control={control}
                                name="priorite"
                                render={({ field: { onChange, value } }) => (
                                    <>
                                        <TouchableOpacity 
                                            style={[
                                                styles.prioriteOption,
                                                value === 'vitale' && styles.prioriteSelected
                                            ]}
                                            onPress={() => onChange('vitale')}
                                        >
                                            <Ionicons name="medical" size={32} color="#FF3B30" />
                                            <View style={styles.optionText}>
                                                <Text style={styles.optionTitle}>Urgence vitale</Text>
                                                <Text style={styles.optionSubtitle}>Danger immédiat</Text>
                                            </View>
                                            {value === 'vitale' && (
                                                <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[
                                                styles.prioriteOption,
                                                value === 'grave' && styles.prioriteSelected
                                            ]}
                                            onPress={() => onChange('grave')}
                                        >
                                            <Ionicons name="fitness" size={32} color="#FF9500" />
                                            <View style={styles.optionText}>
                                                <Text style={styles.optionTitle}>Urgence grave</Text>
                                                <Text style={styles.optionSubtitle}>Besoin rapide</Text>
                                            </View>
                                            {value === 'grave' && (
                                                <Ionicons name="checkmark-circle" size={24} color="#FF9500" />
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[
                                                styles.prioriteOption,
                                                value === 'consultation' && styles.prioriteSelected
                                            ]}
                                            onPress={() => onChange('consultation')}
                                        >
                                            <Ionicons name="bandage" size={32} color="#34C759" />
                                            <View style={styles.optionText}>
                                                <Text style={styles.optionTitle}>Consultation urgente</Text>
                                                <Text style={styles.optionSubtitle}>Non critique</Text>
                                            </View>
                                            {value === 'consultation' && (
                                                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                                            )}
                                        </TouchableOpacity>
                                    </>
                                )}
                            />
                            {errors.priorite && (
                                <Text style={styles.errorText}>{errors.priorite.message}</Text>
                            )}

                            

                            {/* Date et heure (automatique) */}
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    {new Date().toLocaleString('fr-FR', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </Text>
                            </View>

                            {/* Localisation - Indicateur discret uniquement */}
                            {loadingLocation && (
                                <View style={styles.locationIndicator}>
                                    <Ionicons name="location-outline" size={16} color="#666" />
                                    <Text style={styles.locationIndicatorText}>
                                        Localisation en cours...
                                    </Text>
                                </View>
                            )}
                            
                            {!loadingLocation && (!latitude || !longitude) && (
                                <View style={styles.locationError}>
                                    <Ionicons name="warning-outline" size={16} color="#FF3B30" />
                                    <Text style={styles.locationErrorText}>
                                        Position non disponible
                                    </Text>
                                </View>
                            )}

                            {/* Boutons */}
                            <TouchableOpacity 
                                style={[
                                    styles.submitButton,
                                    isSubmitting && styles.submitButtonDisabled
                                ]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.submitText}>
                                    {isSubmitting ? 'Envoi en cours...' : 'Signaler l\'urgence'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.cancelButton} 
                                onPress={closeModalWithAnimation}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#D1D1D6',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 10,
        color: '#333',
    },
    required: {
        color: '#FF3B30',
    },
    prioriteOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    prioriteSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    optionText: {
        marginLeft: 15,
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    textArea: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent',
        marginBottom: 8,
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginTop: 5,
        marginBottom: 10,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        marginTop: 5,
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    infoText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#FF3B30',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#FFAAAA',
        opacity: 0.7,
    },
    submitText: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 18,
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    locationIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    locationIndicatorText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#666',
    },
    locationError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    locationErrorText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#FF3B30',
    },
});