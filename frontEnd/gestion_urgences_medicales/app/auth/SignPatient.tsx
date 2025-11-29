import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { patientSing } from '@/Routes/routeService/PatientService';
// Schéma de validation Yup
const registerSchema = yup.object({
    nom: yup
        .string()
        .required('Le nom est requis')
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
    
    prenom: yup
        .string()
        .required('Le prénom est requis')
        .min(2, 'Le prénom doit contenir au moins 2 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom contient des caractères invalides'),
    
    dateNaissance: yup
        .string()
        .required('La date de naissance est requise')
        .matches(
            /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
            'Format invalide (JJ/MM/AAAA)'
        )
        .test('age-valid', 'Vous devez avoir au moins 16 ans', function(value) {
            if (!value) return false;
            const [day, month, year] = value.split('/').map(Number);
            const birthDate = new Date(year, month - 1, day);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                return age - 1 >= 16;
            }
            return age >= 16;
        })
        .test('date-valid', 'Date invalide', function(value) {
            if (!value) return false;
            const [day, month, year] = value.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
        }),
    
    email: yup
        .string()
        .required('L\'email est requis')
        .email('Email invalide')
        .lowercase(),
    
    motDePasse: yup
        .string()
        .required('Le mot de passe est requis')
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        ),
    
    confirmMotDePasse: yup
        .string()
        .required('Veuillez confirmer votre mot de passe')
        .oneOf([yup.ref('motDePasse')], 'Les mots de passe ne correspondent pas'),
}).required();

type RegisterFormData = yup.InferType<typeof registerSchema>;

export default function SignPatient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: yupResolver(registerSchema),
        mode: 'onBlur',
        defaultValues: {
            nom: '',
            prenom: '',
            dateNaissance: '',
            email: '',
            motDePasse: '',
            confirmMotDePasse: '',
        }
    });

    // Formater automatiquement la date pendant la saisie
    const formatDateInput = (text: string) => {
        // Supprimer tout sauf les chiffres
        const cleaned = text.replace(/\D/g, '');
        
        // Limiter à 8 chiffres (JJMMAAAA)
        const limited = cleaned.slice(0, 8);
        
        // Ajouter les slashes automatiquement
        if (limited.length >= 5) {
            return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
        } else if (limited.length >= 3) {
            return `${limited.slice(0, 2)}/${limited.slice(2)}`;
        }
        return limited;
    };

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);

            

            // Préparer les données pour l'insertion (sans confirmMotDePasse)
            const patientData = {
                nom: data.nom,
                prenom: data.prenom,
                dateNaissance: data.dateNaissance, // Format JJ/MM/AAAA
                email: data.email,
                motDePasse: data.motDePasse, // À hasher en production !
                // Les champs optionnels seront remplis plus tard
                telephone: null,
                lieuResidence: null,
                numeroUrgence: null,
                photoProfil: null,
                groupeSanguin: null,
                latitude: 0,
                longitude: 0,
            };
            


            const result = await patientSing(patientData);

            if (result?.success) {
                Alert.alert(
                    "Inscription réussie ! 🎉",
                    "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
                    [
                        {
                            text: "Se connecter",
                            onPress: () => router.push('/auth/LoginPatient')
                        }
                    ]
                );
            }

            

        } catch (error) {
            console.error('Erreur inscription:', error);
            Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="medical" size={50} color="#fff" />
                    </View>
                    <Text style={styles.title}>Créer un compte</Text>
                    <Text style={styles.subtitle}>
                        Rejoignez notre plateforme d'urgences médicales
                    </Text>
                </View>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    {/* Nom */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom *</Text>
                        <Controller
                            control={control}
                            name="nom"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="person-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.nom && styles.inputError
                                        ]}
                                        placeholder="Entrez votre nom"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        editable={!isLoading}
                                    />
                                </View>
                            )}
                        />
                        {errors.nom && (
                            <Text style={styles.errorText}>{errors.nom.message}</Text>
                        )}
                    </View>

                    {/* Prénom */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Prénom *</Text>
                        <Controller
                            control={control}
                            name="prenom"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="person-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.prenom && styles.inputError
                                        ]}
                                        placeholder="Entrez votre prénom"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        editable={!isLoading}
                                    />
                                </View>
                            )}
                        />
                        {errors.prenom && (
                            <Text style={styles.errorText}>{errors.prenom.message}</Text>
                        )}
                    </View>

                    {/* Date de naissance */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date de naissance *</Text>
                        <Controller
                            control={control}
                            name="dateNaissance"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="calendar-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.dateNaissance && styles.inputError
                                        ]}
                                        placeholder="JJ/MM/AAAA"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={(text) => {
                                            const formatted = formatDateInput(text);
                                            onChange(formatted);
                                        }}
                                        onBlur={onBlur}
                                        keyboardType="numeric"
                                        maxLength={10}
                                        editable={!isLoading}
                                    />
                                </View>
                            )}
                        />
                        {errors.dateNaissance && (
                            <Text style={styles.errorText}>{errors.dateNaissance.message}</Text>
                        )}
                        <Text style={styles.helperText}>
                            Vous devez avoir au moins 16 ans
                        </Text>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="mail-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.email && styles.inputError
                                        ]}
                                        placeholder="exemple@email.com"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                    />
                                </View>
                            )}
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email.message}</Text>
                        )}
                    </View>

                    {/* Mot de passe */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe *</Text>
                        <Controller
                            control={control}
                            name="motDePasse"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="lock-closed-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithRightIcon,
                                            errors.motDePasse && styles.inputError
                                        ]}
                                        placeholder="Min. 8 caractères"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        secureTextEntry={!showPassword}
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={22}
                                            color="#999"
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                        {errors.motDePasse && (
                            <Text style={styles.errorText}>{errors.motDePasse.message}</Text>
                        )}
                    </View>

                    {/* Confirmation mot de passe */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmer le mot de passe *</Text>
                        <Controller
                            control={control}
                            name="confirmMotDePasse"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="lock-closed-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithRightIcon,
                                            errors.confirmMotDePasse && styles.inputError
                                        ]}
                                        placeholder="Confirmez votre mot de passe"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        secureTextEntry={!showConfirmPassword}
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <Ionicons
                                            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                            size={22}
                                            color="#999"
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                        {errors.confirmMotDePasse && (
                            <Text style={styles.errorText}>
                                {errors.confirmMotDePasse.message}
                            </Text>
                        )}
                    </View>

                    {/* Info supplémentaire */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#007AFF" />
                        <Text style={styles.infoText}>
                            Vous pourrez compléter votre profil après l'inscription
                        </Text>
                    </View>

                    {/* Bouton S'inscrire */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            isLoading && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>S'inscrire</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Lien vers connexion */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Vous avez déjà un compte ? </Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/patient/login')}
                            disabled={isLoading}
                        >
                            <Text style={styles.footerLink}>Se connecter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#58D68D',
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#333',
    },
    inputWithRightIcon: {
        paddingRight: 45,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        padding: 8,
    },
    errorText: {
        fontSize: 13,
        color: '#FF3B30',
        marginTop: 6,
        marginLeft: 4,
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        marginLeft: 4,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#007AFF',
        marginLeft: 8,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#58D68D',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#58D68D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#95A5A6',
        shadowOpacity: 0,
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
        marginRight: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    footerText: {
        fontSize: 15,
        color: '#666',
    },
    footerLink: {
        fontSize: 15,
        fontWeight: '600',
        color: '#58D68D',
    },
});