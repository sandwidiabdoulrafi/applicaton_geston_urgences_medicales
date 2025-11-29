import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

type UserRole = 'patient' | 'service' | null;

interface AuthContextType {
    userRole: UserRole;
    userId: string | null;
    isLoading: boolean;
    signIn: (role: UserRole, userId: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    userRole: null,
    userId: null,
    isLoading: true,
    signIn: async () => {},
    signOut: async () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    // Vérifier l'authentification au démarrage
    useEffect(() => {
        checkAuth();
    }, []);

    // Redirection automatique selon l'état d'authentification
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';
        const inPatientGroup = segments[0] === 'patient';
        const inServiceGroup = segments[0] === 'service_urgence';

        if (!userRole && !inAuthGroup) {
            // Utilisateur non connecté → rediriger vers auth
            router.replace('/');
        } else if (userRole === 'patient' && !inPatientGroup) {
            // Patient connecté → rediriger vers patient
            router.replace('/patient');
        } else if (userRole === 'service' && !inServiceGroup) {
            // Service connecté → rediriger vers service
            router.replace('/service_urgence');
        }
    }, [userRole, segments, isLoading]);

    const checkAuth = async () => {
        try {
            const [role, id] = await Promise.all([
                AsyncStorage.getItem('userRole'),
                AsyncStorage.getItem('userId'),
            ]);

            if (role && id) {
                setUserRole(role as UserRole);
                setUserId(id);
            }
        } catch (error) {
            console.error('Erreur vérification auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (role: UserRole, id: string) => {
        try {
            await AsyncStorage.setItem('userRole', role!);
            await AsyncStorage.setItem('userId', id);
            setUserRole(role);
            setUserId(id);
        } catch (error) {
            console.error('Erreur signIn:', error);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.multiRemove(['userRole', 'userId', 'authToken']);
            setUserRole(null);
            setUserId(null);
            router.replace('/');
        } catch (error) {
            console.error('Erreur signOut:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                userRole,
                userId,
                isLoading,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}