// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import "../global.css";
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useRouter } from 'expo-router';
// import { useEffect, useState } from 'react';
// import InitDB from '../Routes/routeRoom/index';

// // ✅ IMPORTER LE FICHIER AVEC LES FONCTIONS (serviceSanteRoomService)
// import serviceSanteRoomService from '@/Routes/routeRoom/serviceSanteRoomService';
// import { getUserPatient } from '@/Routes/routeRoom/roomPatient';


// export const unstable_settings = {
//     initialRouteName: 'patient',
// };

// export default function RootLayout() {
//     const route = useRouter();
//     const [role, setRole] = useState<string | null>(null);

//     useEffect(() => {
//         const checkRole = async () => {
//             try {
//                 console.log("🔄 === DÉBUT DE L'INITIALISATION ===");

//                 // 1️⃣ Initialiser les DB
//                 console.log("📦 Init DB principale...");
//                 await InitDB();
                
//                 console.log("🏥 Init DB ServiceSante...");
//                 await serviceSanteRoomService.initServiceSante();

//                 console.log("✅ Toutes les tables créées !");

//                 // 2️⃣ Stocker le rôle
//                 await AsyncStorage.setItem("userRole", "patient");

//                 // 3️⃣ Récupérer les données
                
//                 const patient = await getUserPatient();
                
                
//                 // 🔴 CHANGEMENT ICI : serviceSanteRoom au lieu de serviceSanteRoomService
//                 const serviceSanteUser = await serviceSanteRoomService.getUserService();


//                 // 4️⃣ Stocker dans AsyncStorage
//                 await AsyncStorage.setItem(
//                     "userServiceSante", 
//                     JSON.stringify(serviceSanteUser)
//                 );
                
//                 await AsyncStorage.setItem(
//                     "userPatient", 
//                     JSON.stringify(patient)
//                 );

//                 // 5️⃣ Vérifier le rôle
//                 const storedRole = await AsyncStorage.getItem("userRole");

//                 // Redirection (si nécessaire)
//                 // if (storedRole === "assistant") {
//                 //     route.replace("/service_urgence");
//                 // } else if (storedRole === "patient") {
//                 //     route.replace("/patient");
//                 // }

//                 setRole(storedRole);
//                 console.log("✅ === INITIALISATION TERMINÉE ===");

//             } catch (error) {
//                 console.error("❌ === ERREUR D'INITIALISATION ===");
//                 console.error(error);
//             }
//         };

//         checkRole();
//     }, []);

//     const colorScheme = useColorScheme();

//     return (
//         <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//             <Stack
//                 screenOptions={{
//                     headerShown: false,
//                 }}
//             >
//                 <Stack.Screen name="patient" options={{ headerShown: false }} />
//                 <Stack.Screen name="service_urgence" options={{ headerShown: false }} />
//                 <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
//             </Stack>
//             <StatusBar style="auto" />
//         </ThemeProvider>
//     );
// }




import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="patient"  options={{ headerShown: false }} />
                <Stack.Screen name="service_urgence"  options={{ headerShown: false }}/>
            </Stack>
        </AuthProvider>
    );
}