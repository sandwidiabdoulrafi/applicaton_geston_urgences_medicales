import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useContext, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import { patientLogin } from '@/Routes/routeService/PatientService';
import { useAuth } from '../contexts/AuthContext';

// Schéma de validation Yup
const loginSchema = yup.object({
    email: yup
        .string()
        .required('L\'email est requis')
        .email('Email invalide')
        .lowercase(),
    
    motDePasse: yup
        .string()
        .required('Le mot de passe est requis')
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
}).required();

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPatient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
        const { signIn } = useAuth();

    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: yupResolver(loginSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            motDePasse: '',
        }
    });
    



    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
    
            const result = await patientLogin(data);
    
            if (!result?.success) {
                console.log("Connexion échouée :", result?.message);
                return Alert.alert(
                    "Erreur",
                    result?.message || "Email ou mot de passe incorrect"
                );
            }
    
            console.log(" Connexion réussie, redirection vers /patient...");

            if (result.success && result.data) {

                // 🔥 ENREGISTRER LE USER DANS LE CONTEXT + ASYNCSTORAGE
                const { role } = result.data;
                await signIn(role,result.data.id);

                Alert.alert(
                    "Connexion réussie ! 🎉",
                    "Bienvenue sur votre espace patient",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace('/patient')
                        }
                    ]
                ); 
            }
    
            
    
        } catch (error) {
            console.error(' Erreur globale dans onSubmit:', error);
    
            Alert.alert(
                "Erreur de connexion",
                "Impossible de se connecter au serveur"
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
                        <Ionicons name="medical" size={60} color="#fff" />
                    </View>
                    <Text style={styles.title}>Urgences Médicales</Text>
                    <Text style={styles.subtitle}>
                        Connectez-vous à votre compte patient
                    </Text>
                </View>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Connexion</Text>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="mail-outline" 
                                        size={22} 
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
                        <Text style={styles.label}>Mot de passe</Text>
                        <Controller
                            control={control}
                            name="motDePasse"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="lock-closed-outline" 
                                        size={22} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.inputWithRightIcon,
                                            errors.motDePasse && styles.inputError
                                        ]}
                                        placeholder="••••••••"
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
                                            size={24}
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

                    {/* Mot de passe oublié */}
                    <TouchableOpacity 
                        style={styles.forgotPassword}
                        onPress={() => Alert.alert('Réinitialisation', 'Fonctionnalité à venir')}
                        disabled={isLoading}
                    >
                        <Text style={styles.forgotPasswordText}>
                            Mot de passe oublié ?
                        </Text>
                    </TouchableOpacity>

                    {/* Bouton Se connecter */}
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
                                <Text style={styles.submitButtonText}>Se connecter</Text>
                                <Ionicons name="arrow-forward" size={22} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Séparateur */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OU</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Lien vers inscription */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Vous n'avez pas de compte ? </Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/auth/SignPatient')}
                            disabled={isLoading}
                        >
                            <Text style={styles.footerLink}>S'inscrire</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Aide urgence */}
                    <TouchableOpacity 
                        style={styles.emergencyButton}
                        onPress={() => Alert.alert('Urgence', 'Appel d\'urgence - 119')}
                    >
                        <Ionicons name="call" size={20} color="#FF3B30" />
                        <Text style={styles.emergencyText}>
                            Besoin d'aide immédiate ?
                        </Text>
                    </TouchableOpacity>
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
        paddingTop: 80,
        paddingBottom: 50,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 30,
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
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    formTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        height: 56,
    },
    inputIcon: {
        marginLeft: 16,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#333',
    },
    inputWithRightIcon: {
        paddingRight: 50,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    eyeIcon: {
        position: 'absolute',
        right: 14,
        padding: 8,
    },
    errorText: {
        fontSize: 13,
        color: '#FF3B30',
        marginTop: 8,
        marginLeft: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#58D68D',
        fontWeight: '600',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#58D68D',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#58D68D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 30,
    },
    submitButtonDisabled: {
        backgroundColor: '#95A5A6',
        shadowOpacity: 0,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginRight: 10,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E8E8',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
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
    emergencyButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE5E5',
    },
    emergencyText: {
        fontSize: 15,
        color: '#FF3B30',
        fontWeight: '600',
        marginLeft: 8,
    },
});