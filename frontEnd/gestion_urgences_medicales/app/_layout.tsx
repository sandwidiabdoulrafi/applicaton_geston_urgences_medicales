
import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';

import InitDB from '../Routes/routeRoom/index'
import serviceSanteRoomService from '@/Routes/routeRoom/serviceSanteRoomService';

export default function RootLayout() {
    
//intialisation des db lite
    useEffect(()=>{
        const charger = async()=>{
            console.log(" Init DB patient...");
            await InitDB();

                
            console.log("🏥 Init DB ServiceSante...");
            await serviceSanteRoomService.initServiceSante();
        }


        charger()
        
    },[])
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