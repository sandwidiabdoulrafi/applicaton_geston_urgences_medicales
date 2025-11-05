import { Stack } from 'expo-router';
// import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function PatientLayout() {
    // const { user, isAuthenticated } = useAuth();

    // 🔒 Protection : Vérification de l'authentification (à activer plus tard)
    // if (!isAuthenticated) {
    //   return <Redirect href="/login" />;
    // }

    // 🔒 Protection : Vérification du type d'utilisateur (à activer plus tard)
    // if (user?.type !== 'patient') {
    //   return <Redirect href="/unauthorized" />;
    // }

    return (
        <Stack 
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#007AFF',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
        {/* Navigation principale avec tabs */}
        <Stack.Screen 
            name="(tabs)" 
            options={{ 
            headerShown: false 
            }} 
        />
        
        {/* Écrans supplémentaires sans tabs */}
        {/* <Stack.Screen 
            name="appointment-details"
            options={{ 
            title: 'Détails du rendez-vous',
            presentation: 'card'
            }} 
        /> */}
        
        {/* <Stack.Screen 
            name="emergency-request"
            options={{ 
            title: 'Demande d\'urgence',
            presentation: 'modal'
            }} 
        /> */}
        
        {/* <Stack.Screen 
            name="medical-history-detail"
            options={{ 
            title: 'Historique médical',
            presentation: 'card'
            }} 
        /> */}
        </Stack>
    );
}