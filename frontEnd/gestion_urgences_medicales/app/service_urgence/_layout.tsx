import { Stack } from 'expo-router';
// import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function ServiceUrgenceLayout() {
    // const { user, isAuthenticated } = useAuth();

    // 🔒 Protection : Vérification de l'authentification (à activer plus tard)
    // if (!isAuthenticated) {
    //   return <Redirect href="/login" />;
    // }

    // 🔒 Protection : Vérification du type d'utilisateur (à activer plus tard)
    // if (user?.type !== 'assistant') {
    //   return <Redirect href="/unauthorized" />;
    // }

    return (
            <Stack 
                screenOptions={{
                    headerStyle: {
                    backgroundColor: '#34C759',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                    fontWeight: 'bold',
                    },
                    headerBackTitle: 'Retour',
                }}
            >
                {/* Navigation principale avec tabs */}
                <Stack.Screen 
                    name="(tabs)" 
                    options={{ 
                        headerShown: false // Les tabs ont leur propre header
                    }} 
                />
            
                {/* 📋 Détails d'une urgence + Chat + Actions */}
                <Stack.Screen 
                    name="urgence-details"
                    options={{ 
                        title: 'Détails de l\'urgence',
                        presentation: 'card',
                    }} 
                />
                
                {/* 👤 Détails d'un patient + Historique complet */}
                <Stack.Screen 
                    name="patient-details"
                    options={{ 
                        title: 'Dossier patient',
                        presentation: 'card',
                    }} 
                />
            
                {/* 📝 Créer un historique médical (après urgence terminée) */}
                <Stack.Screen 
                    name="creer-historique"
                    options={{ 
                        title: 'Créer un historique',
                        presentation: 'modal',
                    }} 
                />
                
                {/* 📄 Détails d'un historique */}
                <Stack.Screen 
                    name="historique-details"
                    options={{ 
                        title: 'Détails de l\'historique',
                        presentation: 'card',
                    }} 
                />
            
                {/* ✏️ Modifier le profil de l'établissement */}
                <Stack.Screen 
                    name="modifier-profil"
                    options={{ 
                        title: 'Modifier l\'établissement',
                        presentation: 'card',
                    }} 
                />
            
                {/* 🔔 Envoyer une notification à un patient */}
                <Stack.Screen 
                    name="envoyer-notification"
                    options={{ 
                        title: 'Envoyer une notification',
                        presentation: 'modal',
                    }} 
                />
            
                {/* 💬 Chat d'une urgence */}
                <Stack.Screen 
                    name="chat"
                    options={{ 
                        title: 'Chat',
                        presentation: 'card',
                    }} 
                />

                {/* 📊 Statistiques détaillées */}
                <Stack.Screen 
                    name="statistiques"
                    options={{ 
                        title: 'Statistiques',
                        presentation: 'card',
                    }} 
                />
            </Stack>
    );
}