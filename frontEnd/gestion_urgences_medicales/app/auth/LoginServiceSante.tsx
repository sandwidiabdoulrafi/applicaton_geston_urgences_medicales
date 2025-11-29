import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useContext, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { serviceSanteLogin } from '@/Routes/routeService/ServiceSanteService';
import { useAuth } from "@/app/contexts/AuthContext";

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

export default function LoginServiceSante() {
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

            console.log('=== TENTATIVE DE CONNEXION SERVICE ===');
            console.log('Email:', data.email);
            console.log('Mot de passe:', data.motDePasse);
            console.log('Date connexion:', new Date().toISOString());
            console.log('=====================================');

            
            const result = await serviceSanteLogin(data);



            if (!result.success) {
                return Alert.alert("Erreur", result.message || "Email ou mot de passe incorrect");
            }
                
            console.log("🎉 Connexion réussie, redirection vers /service_sante...");

            if (result.success && result.data) {

                // 🔥 ENREGISTRER LE USER DANS LE CONTEXT + ASYNCSTORAGE
                const { role } = result.data;
                await signIn(role,result.data.id);
                Alert.alert(
                    "Connexion réussie ! 🎉",
                    "Bienvenue sur votre espace service de sante",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace('/service_urgence/(tabs)') 
                        }
                    ]
                ); 
            }

        
        } catch (error) {
            console.error('Erreur connexion:', error);
            Alert.alert(
                'Erreur de connexion',
                'Email ou mot de passe incorrect'
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
                        <Ionicons name="business" size={60} color="#fff" />
                    </View>
                    <Text style={styles.title}>Espace Professionnel</Text>
                    <Text style={styles.subtitle}>
                        Connectez-vous à votre établissement de santé
                    </Text>
                </View>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Connexion</Text>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email professionnel</Text>
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
                                        placeholder="contact@etablissement.com"
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
                        <Text style={styles.footerText}>Nouvel établissement ? </Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/auth/SignServiceSante')}
                            disabled={isLoading}
                        >
                            <Text style={styles.footerLink}>S'inscrire</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Info contact */}
                    <View style={styles.infoBox}>
                        <Ionicons name="help-circle" size={20} color="#3498DB" />
                        <Text style={styles.infoText}>
                            Besoin d'aide pour l'inscription de votre établissement ?
                        </Text>
                    </View>

                    {/* Urgence patient */}
                    <TouchableOpacity 
                        style={styles.patientButton}
                        onPress={() => router.push('/auth/LoginPatient')}
                    >
                        <Ionicons name="person" size={20} color="#58D68D" />
                        <Text style={styles.patientText}>
                            Vous êtes un patient ? Cliquez ici
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
        backgroundColor: '#3498DB',
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
        paddingHorizontal: 20,
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
        color: '#3498DB',
        fontWeight: '600',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#3498DB',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3498DB',
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
        color: '#3498DB',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#3498DB',
        marginLeft: 8,
        lineHeight: 18,
    },
    patientButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0FFF5',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C6F6D5',
    },
    patientText: {
        fontSize: 15,
        color: '#58D68D',
        fontWeight: '600',
        marginLeft: 8,
    },
});
