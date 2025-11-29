import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import ServiceSanteService from '../../Routes/routeService/ServiceSanteService'

// Schéma de validation Yup
const registerSchema = yup.object({
    nomEtablissement: yup
        .string()
        .required('Le nom de l\'établissement est requis')
        .min(3, 'Le nom doit contenir au moins 3 caractères'),
    
    typeEtablissement: yup
        .string()
        .required('Le type d\'établissement est requis')
        .oneOf(['pharmacie', 'hopital', 'clinique', 'centre'], 'Type invalide'),
    
    telephone: yup
        .string()
        .required('Le numéro de téléphone est requis')
        .matches(/^\+226\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/, 'Format: +226 XX XX XX XX'),
    
    ville: yup
        .string()
        .required('La ville est requise')
        .min(2, 'Le nom de la ville doit contenir au moins 2 caractères'),
    
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

export default function SignServiceSante() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: yupResolver(registerSchema),
        mode: 'onBlur',
        defaultValues: {
            nomEtablissement: '',
            typeEtablissement: '',
            telephone: '',
            ville: '',
            email: '',
            motDePasse: '',
            confirmMotDePasse: '',
        }
    });

    // Formater automatiquement le téléphone
    const formatPhoneInput = (text: string) => {
        // Supprimer tout sauf les chiffres et le +
        const cleaned = text.replace(/[^\d+]/g, '');
        
        // Si commence par +226
        if (cleaned.startsWith('+226')) {
            const numbers = cleaned.slice(4); // Enlever +226
            const limited = numbers.slice(0, 8); // Max 8 chiffres
            
            if (limited.length >= 7) {
                return `+226 ${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6)}`;
            } else if (limited.length >= 5) {
                return `+226 ${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4)}`;
            } else if (limited.length >= 3) {
                return `+226 ${limited.slice(0, 2)} ${limited.slice(2)}`;
            } else if (limited.length > 0) {
                return `+226 ${limited}`;
            }
            return '+226 ';
        }
        
        // Si commence par +
        if (cleaned.startsWith('+')) {
            return cleaned.slice(0, 12);
        }
        
        // Si commence par 226
        if (cleaned.startsWith('226')) {
            return `+${cleaned.slice(0, 11)}`;
        }
        
        // Sinon ajouter +226
        if (cleaned.length > 0) {
            return `+226 ${cleaned.slice(0, 8)}`;
        }
        
        return cleaned;
    };

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);

            // Préparer les données pour l'insertion
            const serviceData = {
                // idEtablissement sera généré par le backend
                nomEtablissement: data.nomEtablissement,
                typeEtablissement: data.typeEtablissement,
                telephone: data.telephone,
                ville: data.ville,
                email: data.email,
                motDePasse: data.motDePasse, 
                // Champs qui seront remplis plus tard
                adresse: '',
                ouvert24h: false,
                heureOuverture: '08:00',
                heureFermeture: '18:00',
                description: '',
                photoProfil: '',
                latitude: 0,
                longitude: 0,
                isActive: true,
            };


            const result = await ServiceSanteService.serviceSanteSing(serviceData);

            if (result?.success) {
                Alert.alert(
                    'Inscription réussie ! 🎉',
                    'Votre établissement a été enregistré. Vous pouvez maintenant vous connecter.',
                    [
                        {
                            text: 'Se connecter',
                            onPress: () => router.push('/auth/LoginServiceSante')
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
                        <Ionicons name="business" size={50} color="#fff" />
                    </View>
                    <Text style={styles.title}>Inscription Établissement</Text>
                    <Text style={styles.subtitle}>
                        Enregistrez votre service de santé
                    </Text>
                </View>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    {/* Nom de l'établissement */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom de l'établissement *</Text>
                        <Controller
                            control={control}
                            name="nomEtablissement"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="business-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.nomEtablissement && styles.inputError
                                        ]}
                                        placeholder="Ex: Clinique Les Étoiles"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        editable={!isLoading}
                                    />
                                </View>
                            )}
                        />
                        {errors.nomEtablissement && (
                            <Text style={styles.errorText}>{errors.nomEtablissement.message}</Text>
                        )}
                    </View>

                    {/* Type d'établissement */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Type d'établissement *</Text>
                        <Controller
                            control={control}
                            name="typeEtablissement"
                            render={({ field: { onChange, value } }) => (
                                <View style={[
                                    styles.inputWrapper,
                                    errors.typeEtablissement && styles.inputError
                                ]}>
                                    <Ionicons 
                                        name="medical-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <RNPickerSelect
                                        value={value}
                                        onValueChange={onChange}
                                        disabled={isLoading}
                                        placeholder={{ 
                                            label: "Sélectionnez un type", 
                                            value: "",
                                            color: '#999'
                                        }}
                                        items={[
                                            { label: "Pharmacie", value: "pharmacie" },
                                            { label: "Hôpital", value: "hopital" },
                                            { label: "Clinique", value: "clinique" },
                                            { label: "Centre de santé", value: "centre" },
                                        ]}
                                        style={pickerSelectStyles}
                                        useNativeAndroidPickerStyle={false}
                                        Icon={() => (
                                            <Ionicons 
                                                name="chevron-down" 
                                                size={20} 
                                                color="#999" 
                                                style={{ marginRight: 12, marginTop: 15 }}
                                            />
                                        )}
                                    />
                                </View>
                            )}
                        />
                        {errors.typeEtablissement && (
                            <Text style={styles.errorText}>{errors.typeEtablissement.message}</Text>
                        )}
                    </View>
                    {/* Téléphone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Téléphone *</Text>
                        <Controller
                            control={control}
                            name="telephone"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="call-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.telephone && styles.inputError
                                        ]}
                                        placeholder="+226 70 12 34 56"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={(text) => {
                                            const formatted = formatPhoneInput(text);
                                            onChange(formatted);
                                        }}
                                        onBlur={onBlur}
                                        keyboardType="phone-pad"
                                        editable={!isLoading}
                                    />
                                </View>
                            )}
                        />
                        {errors.telephone && (
                            <Text style={styles.errorText}>{errors.telephone.message}</Text>
                        )}
                    </View>

                    {/* Ville */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ville *</Text>
                        <Controller
                            control={control}
                            name="ville"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <Ionicons 
                                        name="location-outline" 
                                        size={20} 
                                        color="#999" 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.ville && styles.inputError
                                        ]}
                                        placeholder="Ex: Ouagadougou"
                                        placeholderTextColor="#999"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        editable={!isLoading}
                                    />
                                </View>
                            )}
                        />
                        {errors.ville && (
                            <Text style={styles.errorText}>{errors.ville.message}</Text>
                        )}
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email professionnel *</Text>
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
                            Les autres informations (horaires, localisation, etc.) pourront être complétées dans votre profil
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
                            onPress={() => router.push('/auth/LoginServiceSante')}
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
        backgroundColor: '#3498DB',
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
        fontSize: 26,
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
        lineHeight: 18,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#3498DB',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3498DB',
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
        color: '#3498DB',
    },
});



const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        flex: 1,
        height: 50,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#181a18',
        paddingRight: 30,
    },
    inputAndroid: {
        flex: 1,
        height: 50,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#333',
        paddingRight: 30,
    },
    placeholder: {
        color: '#999',
    },
    iconContainer: {
        top: 0,
        right: 0,
    },
});