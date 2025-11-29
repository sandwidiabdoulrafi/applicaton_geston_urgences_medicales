import { changePassWord } from "@/Routes/routeService/ServiceSanteService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, StyleSheet, KeyboardAvoidingView, TouchableOpacity, View, ScrollView, ActivityIndicator, TextInput, Platform } from "react-native";

export default function ChangePassword() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('userServiceSante');
                console.log("📦 Données AsyncStorage:", userData);
                
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    
                    // ✅ Vérifier si c'est un tableau ou un objet
                    let serviceData;
                    
                    if (Array.isArray(parsedData)) {
                        serviceData = parsedData[0];
                        console.log("📋 Données du service (tableau):", serviceData);
                    } else {
                        serviceData = parsedData;
                        console.log("📋 Données du service (objet):", serviceData);
                    }
                    
                    if (serviceData && serviceData.email) {
                        console.log("✅ Email chargé:", serviceData.email);
                        
                        setFormData(prev => ({
                            ...prev,
                            email: serviceData.email
                        }));
                    } else {
                        console.warn("⚠️ Email non trouvé dans les données");
                        Alert.alert('Erreur', 'Données utilisateur incomplètes. Veuillez vous reconnecter.');
                        router.replace('/auth/LoginServiceSante');
                    }
                } else {
                    console.warn("⚠️ Aucune donnée utilisateur trouvée");
                    Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
                    router.replace('/auth/LoginServiceSante');
                }
            } catch (error) {
                console.error("❌ Erreur lors du chargement des données utilisateur:", error);
                Alert.alert('Erreur', 'Impossible de charger vos informations');
            } finally {
                setLoadingUser(false);
            }
        };
        
        loadUserData();
    }, []);

    const handleChangePassword = async () => {
        if (!formData.email) {
            Alert.alert('Erreur', 'Erreur de session. Veuillez vous reconnecter.');
            return;
        }

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.newPassword.length < 8) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        setLoading(true);
        try {
            const response = await changePassWord(formData);
            console.log("📥 Réponse backend:", response);

            if (response.success) {
                Alert.alert('Succès', 'Mot de passe modifié avec succès', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Erreur', response.message || 'Mot de passe actuel incorrect');
            }
        } catch (error) {
            console.error("❌ Erreur handleChangePassword:", error);
            Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingUser) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen
                    options={{
                        title: "Changer de mot de passe",
                        headerStyle: { backgroundColor: '#58D68D' },
                        headerTintColor: '#fff',
                        headerTitleStyle: { fontWeight: '600' },
                    }}
                />
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={{ marginTop: 12, color: '#6B7280' }}>Chargement...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: "Changer de mot de passe",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' },
                }}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#0066CC" />
                    <Text style={styles.infoText}>
                        Votre mot de passe doit contenir au moins 8 caractères
                    </Text>
                </View>

                {__DEV__ && formData.email && (
                    <Text style={{ textAlign: 'center', color: '#6B7280', marginBottom: 8, fontSize: 12 }}>
                        Compte: {formData.email}
                    </Text>
                )}

                <View style={styles.form}>
                    <PasswordField
                        label="Mot de passe actuel"
                        value={formData.currentPassword}
                        onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
                        showPassword={showCurrentPassword}
                        toggleShowPassword={() => setShowCurrentPassword(!showCurrentPassword)}
                    />

                    <PasswordField
                        label="Nouveau mot de passe"
                        value={formData.newPassword}
                        onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                        showPassword={showNewPassword}
                        toggleShowPassword={() => setShowNewPassword(!showNewPassword)}
                    />

                    <PasswordField
                        label="Confirmer le mot de passe"
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        showPassword={showConfirmPassword}
                        toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        (!formData.email || loading) && { opacity: 0.5 }
                    ]}
                    onPress={handleChangePassword}
                    disabled={loading || !formData.email}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>Modifier le mot de passe</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

interface PasswordFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    showPassword: boolean;
    toggleShowPassword: () => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
    label,
    value,
    onChangeText,
    showPassword,
    toggleShowPassword
}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeButton}>
                <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#9CA3AF" 
                />
            </TouchableOpacity>
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
    eyeButton: {
        padding: 8,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0066CC',
        paddingVertical: 16,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#EFF6FF',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        marginTop: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#0066CC',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
    },
    bottomSpacer: {
        height: 40,
    },
});