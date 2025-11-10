import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import roomPatient from '../../../Routes/routeRoom/roomPatient';
import LoadingAnimation from '@/components/LoadingAnimation';

// Schéma de validation
const editProfileSchema = yup.object().shape({
    nom: yup
        .string()
        .required('Le nom est obligatoire')
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    prenom: yup
        .string()
        .required('Le prénom est obligatoire')
        .min(2, 'Le prénom doit contenir au moins 2 caractères')
        .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
    telephone: yup
        .string()
        .matches(/^[+]?[0-9\s-()]+$/, 'Numéro de téléphone invalide')
        .nullable(),
    lieuResidence: yup
        .string()
        .max(200, 'L\'adresse ne peut pas dépasser 200 caractères')
        .nullable(),
    numeroUrgence: yup
        .string()
        .matches(/^[+]?[0-9\s-()]+$/, 'Numéro invalide')
        .nullable(),
    groupeSanguin: yup
        .string()
        .oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], 'Groupe sanguin invalide')
        .nullable(),
});

type EditProfileFormData = yup.InferType<typeof editProfileSchema>;

export default function EditProfil() {
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateNaissance, setDateNaissance] = useState<Date | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isDirty },
    } = useForm<EditProfileFormData>({
        resolver: yupResolver(editProfileSchema),
    });

    useEffect(() => {
        loadPatient();
    }, []);

    const loadPatient = async () => {
        try {
            const patients = await roomPatient.getAllPatients();
            if (patients && patients.length > 0) {
                const p = patients[0];
                setPatient(p);
                
                // Pré-remplir le formulaire
                setValue('nom', p.nom);
                setValue('prenom', p.prenom);
                setValue('telephone', p.telephone || '');
                setValue('lieuResidence', p.lieuResidence || '');
                setValue('numeroUrgence', p.numeroUrgence || '');
                setValue('groupeSanguin', p.groupeSanguin || '');
                
                if (p.dateNaissance) {
                    setDateNaissance(new Date(p.dateNaissance));
                }
            }
        } catch (error) {
            console.error('Erreur chargement patient:', error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: EditProfileFormData) => {
        if (!patient) return;
        
        setIsSubmitting(true);
        
        try {
            const updateData: any = {
                nom: data.nom,
                prenom: data.prenom,
                telephone: data.telephone || null,
                lieuResidence: data.lieuResidence || null,
                numeroUrgence: data.numeroUrgence || null,
                groupeSanguin: data.groupeSanguin || null,
            };
            
            if (dateNaissance) {
                updateData.dateNaissance = dateNaissance.toISOString().split('T')[0];
            }
            
            await roomPatient.updatePatient(patient.idPatient, updateData);
            
            Alert.alert(
                'Succès',
                'Profil mis à jour avec succès',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            console.error('Erreur mise à jour:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) {
            Alert.alert(
                'Annuler les modifications',
                'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?',
                [
                    { text: 'Continuer l\'édition', style: 'cancel' },
                    { text: 'Quitter', style: 'destructive', onPress: () => router.back() }
                ]
            );
        } else {
            router.back();
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDateNaissance(selectedDate);
        }
    };

    const groupesSanguins = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen 
                    options={{
                        title: "Modifier le profil",
                        headerStyle: { backgroundColor: '#58D68D' },

                        headerLeft: () => (
                            <TouchableOpacity onPress={handleCancel}>
                                <Ionicons name="close" size={24} color="#007AFF" />
                            </TouchableOpacity>
                        ),
                    }} 
                />
                <LoadingAnimation/>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{
                    title: "Modifier le profil",
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleCancel} style={{ marginLeft: 8 }}>
                            <Text style={styles.cancelButton}>Annuler</Text>
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity 
                            onPress={handleSubmit(onSubmit)}
                            disabled={isSubmitting || !isDirty}
                            style={{ marginRight: 8 }}
                        >
                            <Text style={[
                                styles.saveButton,
                                (isSubmitting || !isDirty) && styles.saveButtonDisabled
                            ]}>
                                {isSubmitting ? 'Sauvegarde...' : 'Enregistrer'}
                            </Text>
                        </TouchableOpacity>
                    ),
                }} 
            />

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Section Identité */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Identité</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Nom <Text style={styles.required}>*</Text>
                        </Text>
                        <Controller
                            control={control}
                            name="nom"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.nom && styles.inputError
                                    ]}
                                    placeholder="Nom"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    maxLength={50}
                                />
                            )}
                        />
                        {errors.nom && (
                            <Text style={styles.errorText}>{errors.nom.message}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Prénom <Text style={styles.required}>*</Text>
                        </Text>
                        <Controller
                            control={control}
                            name="prenom"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.prenom && styles.inputError
                                    ]}
                                    placeholder="Prénom"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    maxLength={50}
                                />
                            )}
                        />
                        {errors.prenom && (
                            <Text style={styles.errorText}>{errors.prenom.message}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Date de naissance</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                            <Text style={styles.dateText}>
                                {dateNaissance 
                                    ? dateNaissance.toLocaleDateString('fr-FR')
                                    : 'Sélectionner une date'
                                }
                            </Text>
                        </TouchableOpacity>
                        
                        {showDatePicker && (
                            <DateTimePicker
                                value={dateNaissance || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                maximumDate={new Date()}
                                minimumDate={new Date(1920, 0, 1)}
                            />
                        )}
                    </View>
                </View>

                {/* Section Contact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Téléphone</Text>
                        <Controller
                            control={control}
                            name="telephone"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWithIcon}>
                                    <Ionicons name="call-outline" size={20} color="#666" />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithIconText,
                                            errors.telephone && styles.inputError
                                        ]}
                                        placeholder="+226 70 12 34 56"
                                        value={value || ''}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            )}
                        />
                        {errors.telephone && (
                            <Text style={styles.errorText}>{errors.telephone.message}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Lieu de résidence</Text>
                        <Controller
                            control={control}
                            name="lieuResidence"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWithIcon}>
                                    <Ionicons name="location-outline" size={20} color="#666" />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithIconText,
                                            errors.lieuResidence && styles.inputError
                                        ]}
                                        placeholder="Secteur 15, Ouagadougou"
                                        value={value || ''}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        maxLength={200}
                                    />
                                </View>
                            )}
                        />
                        {errors.lieuResidence && (
                            <Text style={styles.errorText}>{errors.lieuResidence.message}</Text>
                        )}
                    </View>
                </View>

                {/* Section Médical */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations médicales</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Groupe sanguin</Text>
                        <Controller
                            control={control}
                            name="groupeSanguin"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.bloodTypeContainer}>
                                    {groupesSanguins.map((group) => (
                                        <TouchableOpacity
                                            key={group}
                                            style={[
                                                styles.bloodTypeButton,
                                                value === group && styles.bloodTypeButtonActive
                                            ]}
                                            onPress={() => onChange(group)}
                                        >
                                            <Text style={[
                                                styles.bloodTypeText,
                                                value === group && styles.bloodTypeTextActive
                                            ]}>
                                                {group}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        />
                        {errors.groupeSanguin && (
                            <Text style={styles.errorText}>{errors.groupeSanguin.message}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Contact d'urgence</Text>
                        <Controller
                            control={control}
                            name="numeroUrgence"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWithIcon}>
                                    <Ionicons name="alert-circle-outline" size={20} color="#FF9500" />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithIconText,
                                            errors.numeroUrgence && styles.inputError
                                        ]}
                                        placeholder="+226 25 30 50 00"
                                        value={value || ''}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            )}
                        />
                        {errors.numeroUrgence && (
                            <Text style={styles.errorText}>{errors.numeroUrgence.message}</Text>
                        )}
                        <Text style={styles.helpText}>
                            Numéro à contacter en cas d'urgence médicale
                        </Text>
                    </View>
                </View>

                {/* Informations non éditables */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations du compte</Text>
                    
                    <View style={styles.readOnlyCard}>
                        <View style={styles.readOnlyRow}>
                            <Text style={styles.readOnlyLabel}>Email</Text>
                            <Text style={styles.readOnlyValue}>{patient?.email}</Text>
                        </View>
                        <Text style={styles.readOnlyHint}>
                            Pour modifier votre email, contactez le support
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
    scrollView: {
        flex: 1,
    },
    cancelButton: {
        fontSize: 16,
        color: '#007AFF',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    saveButtonDisabled: {
        color: '#999',
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
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#FF3B30',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1A1A1A',
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    inputWithIconText: {
        flex: 1,
        borderWidth: 0,
        marginLeft: 8,
        padding: 14,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 6,
    },
    helpText: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
        lineHeight: 16,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 14,
    },
    dateText: {
        fontSize: 16,
        color: '#1A1A1A',
        marginLeft: 12,
    },
    bloodTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    bloodTypeButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        minWidth: 70,
        alignItems: 'center',
    },
    bloodTypeButtonActive: {
        backgroundColor: '#FF3B30',
        borderColor: '#FF3B30',
    },
    bloodTypeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    bloodTypeTextActive: {
        color: '#fff',
    },
    readOnlyCard: {
        backgroundColor: '#F8F8F8',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    readOnlyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    readOnlyLabel: {
        fontSize: 14,
        color: '#666',
    },
    readOnlyValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    readOnlyHint: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
});