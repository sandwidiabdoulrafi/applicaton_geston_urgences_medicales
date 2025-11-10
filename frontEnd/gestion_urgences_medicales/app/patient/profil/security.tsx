import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import roomPatient from '../../../Routes/routeRoom/roomPatient';
import LoadingAnimation from '@/components/LoadingAnimation';

// Schéma de validation pour changement de mot de passe
const changePasswordSchema = yup.object().shape({
    currentPassword: yup
        .string()
        .required('Le mot de passe actuel est obligatoire'),
    newPassword: yup
        .string()
        .required('Le nouveau mot de passe est obligatoire')
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
        ),
    confirmPassword: yup
        .string()
        .required('Veuillez confirmer le mot de passe')
        .oneOf([yup.ref('newPassword')], 'Les mots de passe ne correspondent pas'),
});

type ChangePasswordFormData = yup.InferType<typeof changePasswordSchema>;

export default function Security() {
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordFormData>({
        resolver: yupResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const newPassword = watch('newPassword');

    useEffect(() => {
        loadPatient();
    }, []);

    useEffect(() => {
        calculatePasswordStrength(newPassword);
    }, [newPassword]);

    const loadPatient = async () => {
        try {
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

    const calculatePasswordStrength = (password: string) => {
        if (!password) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        
        // Longueur
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 10;
        
        // Complexité
        if (/[a-z]/.test(password)) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/\d/.test(password)) strength += 20;
        if (/[@$!%*?&]/.test(password)) strength += 10;
        
        setPasswordStrength(Math.min(strength, 100));
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength < 40) return '#FF3B30';
        if (passwordStrength < 70) return '#FF9500';
        return '#34C759';
    };

    const getPasswordStrengthLabel = () => {
        if (passwordStrength < 40) return 'Faible';
        if (passwordStrength < 70) return 'Moyen';
        return 'Fort';
    };

    const onSubmit = async (data: ChangePasswordFormData) => {
        if (!patient) return;

        setIsSubmitting(true);

        try {
            // Vérifier le mot de passe actuel
            if (data.currentPassword !== patient.motDePasse) {
                Alert.alert('Erreur', 'Le mot de passe actuel est incorrect');
                setIsSubmitting(false);
                return;
            }

            // Mettre à jour le mot de passe
            // ⚠️ EN PRODUCTION: Hasher avec bcrypt avant de sauvegarder
            await roomPatient.updatePatient(patient.idPatient, {
                motDePasse: data.newPassword
            });

            Alert.alert(
                'Succès',
                'Votre mot de passe a été modifié avec succès',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            reset();
                            router.back();
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            Alert.alert('Erreur', 'Impossible de changer le mot de passe');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Supprimer le compte',
            'Cette action est IRRÉVERSIBLE. Toutes vos données (urgences, messages, etc.) seront définitivement supprimées.\n\nÊtes-vous absolument certain ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => confirmDeleteAccount()
                }
            ]
        );
    };

    const confirmDeleteAccount = () => {
        Alert.alert(
            'Dernière confirmation',
            'Tapez "SUPPRIMER" pour confirmer la suppression définitive de votre compte',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Continuer',
                    style: 'destructive',
                    onPress: async () => {
                        if (!patient) return;
                        
                        const success = await roomPatient.deletePatientAccount(patient.idPatient);
                        if (success) {
                            Alert.alert(
                                'Compte supprimé',
                                'Votre compte a été supprimé avec succès',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => router.replace('/auth/login')
                                    }
                                ]
                            );
                        } else {
                            Alert.alert('Erreur', 'Impossible de supprimer le compte');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen 
                    options={{
                        title: "Sécurité",
                        headerBackTitle: "Retour",
                        headerStyle: { backgroundColor: '#58D68D' },
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
                    title: "Sécurité",
                    headerBackTitle: "Retour",
                    headerStyle: { backgroundColor: '#58D68D' },
                }} 
            />

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Changer le mot de passe */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Changer le mot de passe</Text>

                    <View style={styles.card}>
                        {/* Mot de passe actuel */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Mot de passe actuel <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={control}
                                name="currentPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View style={[
                                        styles.passwordInput,
                                        errors.currentPassword && styles.inputError
                                    ]}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                                        <TextInput
                                            style={styles.passwordInputText}
                                            placeholder="Mot de passe actuel"
                                            secureTextEntry={!showCurrentPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            <Ionicons 
                                                name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                                                size={20} 
                                                color="#666" 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {errors.currentPassword && (
                                <Text style={styles.errorText}>{errors.currentPassword.message}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        {/* Nouveau mot de passe */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Nouveau mot de passe <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={control}
                                name="newPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View style={[
                                        styles.passwordInput,
                                        errors.newPassword && styles.inputError
                                    ]}>
                                        <Ionicons name="key-outline" size={20} color="#666" />
                                        <TextInput
                                            style={styles.passwordInputText}
                                            placeholder="Nouveau mot de passe"
                                            secureTextEntry={!showNewPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            <Ionicons 
                                                name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                                                size={20} 
                                                color="#666" 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {errors.newPassword && (
                                <Text style={styles.errorText}>{errors.newPassword.message}</Text>
                            )}

                            {/* Indicateur de force */}
                            {newPassword && (
                                <View style={styles.strengthContainer}>
                                    <View style={styles.strengthBar}>
                                        <View 
                                            style={[
                                                styles.strengthFill,
                                                { 
                                                    width: `${passwordStrength}%`,
                                                    backgroundColor: getPasswordStrengthColor()
                                                }
                                            ]} 
                                        />
                                    </View>
                                    <Text style={[
                                        styles.strengthLabel,
                                        { color: getPasswordStrengthColor() }
                                    ]}>
                                        {getPasswordStrengthLabel()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Confirmer mot de passe */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Confirmer le mot de passe <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View style={[
                                        styles.passwordInput,
                                        errors.confirmPassword && styles.inputError
                                    ]}>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
                                        <TextInput
                                            style={styles.passwordInputText}
                                            placeholder="Confirmer le mot de passe"
                                            secureTextEntry={!showConfirmPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <Ionicons 
                                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                                                size={20} 
                                                color="#666" 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                            )}
                        </View>

                        {/* Bouton soumettre */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                isSubmitting && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Modification...' : 'Changer le mot de passe'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Conseils sécurité */}
                    <View style={styles.tipsCard}>
                        <View style={styles.tipHeader}>
                            <Ionicons name="shield-checkmark" size={24} color="#34C759" />
                            <Text style={styles.tipTitle}>Conseils de sécurité</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                Utilisez au moins 8 caractères
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                Mélangez majuscules, minuscules, chiffres et symboles
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                N'utilisez pas d'informations personnelles évidentes
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                Changez régulièrement votre mot de passe
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Zone dangereuse */}
                <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>⚠️ Zone dangereuse</Text>
                    
                    <View style={styles.dangerCard}>
                        <View style={styles.dangerInfo}>
                            <Ionicons name="trash-outline" size={32} color="#FF3B30" />
                            <View style={styles.dangerTextContainer}>
                                <Text style={styles.dangerLabel}>Supprimer le compte</Text>
                                <Text style={styles.dangerDescription}>
                                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                                </Text>
                            </View>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.dangerButton}
                            onPress={handleDeleteAccount}
                        >
                            <Text style={styles.dangerButtonText}>
                                Supprimer mon compte
                            </Text>
                        </TouchableOpacity>
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
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
    passwordInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    passwordInputText: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        paddingVertical: 14,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 6,
        lineHeight: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 20,
    },
    strengthContainer: {
        marginTop: 12,
    },
    strengthBar: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    strengthFill: {
        height: '100%',
        borderRadius: 3,
        transition: 'width 0.3s ease',
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#99C7FF',
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    tipsCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2E7D32',
    },
    tipItem: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    tipBullet: {
        fontSize: 14,
        color: '#2E7D32',
        marginRight: 8,
        fontWeight: '700',
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#2E7D32',
        lineHeight: 18,
    },
    dangerZone: {
        marginTop: 40,
        paddingHorizontal: 16,
    },
    dangerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF3B30',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    dangerCard: {
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#FFD6D6',
    },
    dangerInfo: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    dangerTextContainer: {
        flex: 1,
    },
    dangerLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF3B30',
        marginBottom: 4,
    },
    dangerDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    dangerButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    dangerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});