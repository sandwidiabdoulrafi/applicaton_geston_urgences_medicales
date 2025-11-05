import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import "../global.css";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

    export const unstable_settings = {
        initialRouteName: 'patient', // pardefaut pour le test
    };

    export default function RootLayout() {

    const route = useRouter();

    const [role , setRole] = useState<string |null>(null);


    useEffect(()=>{

        
        const checkRole = async ()=>{

            await AsyncStorage.setItem("userRole", "patient");


            // verifier si un role est stocke
            const storedRole = await AsyncStorage.getItem('userRole');
    
            // on redirige vers la version propiste de la cible 
    
    
            if(storedRole==="assistant"){
            route.replace("/service_urgence");
            }
            if(storedRole==="patient"){
            route.replace("/patient")
            }
    
            setRole(storedRole)
    
        }
        checkRole()

    },[]);


    const colorScheme = useColorScheme();


    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>


            <Stack
                screenOptions={{
                    headerShown:false,
                }}
            
            >
                <Stack.Screen name="patient" options={{ headerShown: false }} />
                <Stack.Screen name="service_urgence" options={{headerShown: false}} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
