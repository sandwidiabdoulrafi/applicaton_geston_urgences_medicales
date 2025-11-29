import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Switch, KeyboardAvoidingView, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import roomPatient from '../../../Routes/routeRoom/roomPatient';
import LoadingAnimation from '@/components/LoadingAnimation';
import { patientEditInfo } from '@/Routes/routeService/PatientService';

// Schéma de validation (inchangé)
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
    email: yup
        .string()
        .required('L\'email est obligatoire')
        .email('Email invalide')
        .max(100, 'L\'email ne peut pas dépasser 100 caractères'),
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
    poids: yup
        .number()
        .nullable()
        .transform((value, originalValue) => originalValue === '' ? null : value)
        .min(1, 'Le poids doit être supérieur à 0')
        .max(500, 'Le poids ne peut pas dépasser 500 kg'),
    taille: yup
        .number()
        .nullable()
        .transform((value, originalValue) => originalValue === '' ? null : value)
        .min(1, 'La taille doit être supérieure à 0')
        .max(300, 'La taille ne peut pas dépasser 300 cm'),
});

type EditProfileFormData = yup.InferType<typeof editProfileSchema>;

export default function EditProfil() {
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
    const [maladieChronique, setMaladieChronique] = useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isDirty },
    } = useForm<EditProfileFormData>({
        resolver: yupResolver(editProfileSchema),
    });

    function parseDateFR(dateStr: string) {
        const [jour, mois, annee] = dateStr.split('/');
        return new Date(`${annee}-${mois}-${jour}`);
    }

    useEffect(() => {
        loadPatient();
    }, []);

    const loadPatient = async () => {
        try {
            const patients = await roomPatient.getUserPatient();
            console.log("\n\n patients dans edit : ", patients);
            if (patients && patients.length > 0) {
                const p = patients[0];
                setPatient(p);
                
                setValue('nom', p.nom);
                setValue('prenom', p.prenom);
                setValue('email', p.email);
                setValue('telephone', p.telephone || '');
                setValue('lieuResidence', p.lieuResidence || '');
                setValue('numeroUrgence', p.numeroUrgence || '');
                setValue('groupeSanguin', p.groupeSanguin || '');
                setValue('poids', p.poids);
                setValue('taille', p.taille);
                
                setMaladieChronique(p.maladieChronique === 1);
                
                if (p.dateNaissance) {
                    const parsed = parseDateFR(p.dateNaissance);
                    setDateNaissance(parsed);
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
        
        const emailChanged = data.email !== patient.email;
        
        if (emailChanged) {
            Alert.alert(
                'Confirmation',
                'Vous êtes sur le point de modifier votre email. Vous devrez peut-être vous reconnecter après cette modification. Continuer ?',
                [
                    {
                        text: 'Annuler',
                        style: 'cancel'
                    },
                    {
                        text: 'Confirmer',
                        onPress: () => performUpdate(data)
                    }
                ]
            );
        } else {
            performUpdate(data);
        }
    };

    const performUpdate = async (data: EditProfileFormData) => {
        // Fermer le clavier avant la mise à jour
        Keyboard.dismiss();
        
        setIsSubmitting(true);
        
        try {
            const updateData: any = {
                nom: data.nom,
                prenom: data.prenom,
                email: data.email,
                telephone: data.telephone || null,
                lieuResidence: data.lieuResidence || null,
                numeroUrgence: data.numeroUrgence || null,
                groupeSanguin: data.groupeSanguin || null,
                poids: data.poids || null,
                taille: data.taille || null,
                maladieChronique: maladieChronique ? 1 : 0,
            };
            
            if (dateNaissance) {
                const day = String(dateNaissance.getDate()).padStart(2, '0');
                const month = String(dateNaissance.getMonth() + 1).padStart(2, '0');
                const year = dateNaissance.getFullYear();
                updateData.dateNaissance = `${day}/${month}/${year}`;
            }
            
            console.log("📤 Données à envoyer:", updateData);
            
            const response = await patientEditInfo(patient.idPatient, updateData);

            if (response && response.success) {
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
            } else {
                Alert.alert(
                    'Erreur',
                    response?.message || "Impossible de mettre à jour le profil. Merci de réessayer."
                );
            }
        } catch (error: any) {
            console.error('Erreur mise à jour:', error);
            
            if (error?.response?.data?.message?.includes('email')) {
                Alert.alert('Erreur', 'Cet email est déjà utilisé par un autre compte');
            } else {
                Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
            }
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
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
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
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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
                                    returnKeyType="next"
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
                                    returnKeyType="next"
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
                            onPress={() => {
                                Keyboard.dismiss();
                                setShowDatePicker(true);
                            }}
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
                            <View style={styles.datePickerContainer}>
                                <DateTimePicker
                                    value={dateNaissance || new Date()}
                                    mode="date"
                                    themeVariant="dark" 
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    maximumDate={new Date()}
                                    minimumDate={new Date(1920, 0, 1)}
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Section Contact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Email <Text style={styles.required}>*</Text>
                        </Text>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWithIcon}>
                                    <Ionicons name="mail-outline" size={20} color="#666" />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithIconText,
                                            errors.email && styles.inputError
                                        ]}
                                        placeholderTextColor="#aaa" 
                                        placeholder="exemple@email.com"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                    />
                                </View>
                            )}
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email.message}</Text>
                        )}
                        {patient?.email !== control._formValues.email && (
                            <View style={styles.warningCard}>
                                <Ionicons name="warning" size={16} color="#FF9500" />
                                <Text style={styles.warningText}>
                                    La modification de l'email peut nécessiter une reconnexion
                                </Text>
                            </View>
                        )}
                    </View>

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
                                        returnKeyType="next"
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
                                        returnKeyType="next"
                                    />
                                </View>
                            )}
                        />
                        {errors.lieuResidence && (
                            <Text style={styles.errorText}>{errors.lieuResidence.message}</Text>
                        )}
                    </View>
                </View>

                {/* Section Informations physiques */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations physiques</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Poids (kg)</Text>
                        <Controller
                            control={control}
                            name="poids"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWithIcon}>
                                    <Ionicons name="fitness-outline" size={20} color="#5856D6" />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithIconText,
                                            errors.poids && styles.inputError
                                        ]}
                                        placeholder="Ex: 70"
                                        value={value?.toString() || ''}
                                        onChangeText={(text) => {
                                            const numValue = text.replace(/[^0-9.]/g, '');
                                            onChange(numValue ? parseFloat(numValue) : null);
                                        }}
                                        onBlur={onBlur}
                                        keyboardType="decimal-pad"
                                        returnKeyType="next"
                                    />
                                    <Text style={styles.unitText}>kg</Text>
                                </View>
                            )}
                        />
                        {errors.poids && (
                            <Text style={styles.errorText}>{errors.poids.message}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Taille (cm)</Text>
                        <Controller
                            control={control}
                            name="taille"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWithIcon}>
                                    <Ionicons name="resize-outline" size={20} color="#AF52DE" />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithIconText,
                                            errors.taille && styles.inputError
                                        ]}
                                        placeholder="Ex: 175"
                                        value={value?.toString() || ''}
                                        onChangeText={(text) => {
                                            const numValue = text.replace(/[^0-9.]/g, '');
                                            onChange(numValue ? parseFloat(numValue) : null);
                                        }}
                                        onBlur={onBlur}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                    />
                                    <Text style={styles.unitText}>cm</Text>
                                </View>
                            )}
                        />
                        {errors.taille && (
                            <Text style={styles.errorText}>{errors.taille.message}</Text>
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
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                onChange(group);
                                            }}
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
                        <View style={styles.switchContainer}>
                            <View style={styles.switchContent}>
                                <Ionicons name="medkit" size={24} color="#FF2D55" />
                                <View style={styles.switchTextContainer}>
                                    <Text style={styles.switchLabel}>Maladie chronique</Text>
                                    <Text style={styles.switchSubtext}>
                                        Avez-vous une maladie chronique ?
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={maladieChronique}
                                onValueChange={(value) => {
                                    Keyboard.dismiss();
                                    setMaladieChronique(value);
                                }}
                                trackColor={{ false: '#E0E0E0', true: '#34C759' }}
                                thumbColor={maladieChronique ? '#fff' : '#f4f3f4'}
                            />
                        </View>
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
                                        returnKeyType="done"
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

                {/* Espace supplémentaire en bas pour le clavier */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </KeyboardAvoidingView>
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
    scrollViewContent: {
        paddingBottom: 40,
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
    unitText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '600',
        marginLeft: 8,
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
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF9E6',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9500',
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: '#8B6914',
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
    datePickerContainer: {
        backgroundColor: 'rgba(161, 151, 149, 0.66)', 
        padding: 10,
        borderRadius: 10,
        marginTop: 8,
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
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
    },
    switchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    switchTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    switchSubtext: {
        fontSize: 13,
        color: '#666',
    },
    bottomSpacer: {
        height: 100,
    },
});