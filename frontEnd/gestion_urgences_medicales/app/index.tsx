// app/index.tsx
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from "react";
import { useAuth } from './contexts/AuthContext';
import LoadingAnimation from "@/components/LoadingAnimation";

const { width } = Dimensions.get('window');

export default function Index() {
    const router = useRouter();
    const { userRole, isLoading } = useAuth();

    // Redirection automatique si déjà connecté
    useEffect(() => {
        if (!isLoading && userRole) {
            if (userRole === 'patient') {
                router.replace('/patient');
            } else if (userRole === 'service') {
                router.replace('/service_urgence');
            }
        }
    }, [userRole, isLoading]);

    // Afficher un loader pendant la vérification de l'auth
    if (isLoading) {
        return (
            <LoadingAnimation/>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header avec gradient */}
            <LinearGradient
                colors={['#58D68D', '#2980B9']}
                style={styles.header}
            >
                <View style={styles.logoContainer}>
                    <Ionicons name="medical" size={60} color="#fff" />
                </View>
                <Text style={styles.title}>Gestion d'urgence</Text>
                <Text style={styles.subtitle}>
                    Votre santé, notre priorité
                </Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.welcomeText}>Bienvenue 👋</Text>
                <Text style={styles.description}>
                    Choisissez votre profil pour continuer
                </Text>

                {/* Bouton Patient */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/auth/LoginPatient')}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardIconContainer}>
                        <Ionicons name="person" size={40} color="#3498DB" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Je suis un Patient</Text>
                        <Text style={styles.cardDescription}>
                            Accédez aux services d'urgence et trouvez des établissements de santé
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>

                {/* Bouton Service de Santé */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/auth/LoginServiceSante')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.cardIconContainer, styles.serviceIconBg]}>
                        <Ionicons name="business" size={40} color="#27AE60" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Service de Santé</Text>
                        <Text style={styles.cardDescription}>
                            Gérez votre établissement et répondez aux urgences
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Vous n'avez pas de compte ? Inscrivez-vous lors de la connexion
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 16,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    serviceIconBg: {
        backgroundColor: '#E8F8F5',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
        lineHeight: 18,
    },
});