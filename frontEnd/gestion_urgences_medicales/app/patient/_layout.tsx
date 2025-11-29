import { getUserPatient } from '@/Routes/routeRoom/roomPatient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import InitDB from '../../Routes/routeRoom/index';

export default function PatientLayout() {
    // Initialiser les DB qui esst celui du patient
    useEffect(()=>{
        const charger = async()=>{
            console.log(" Init DB patient...");
            await InitDB();
            const patient = await getUserPatient();
            await AsyncStorage.setItem(
                "userPatient", 
                JSON.stringify(patient)
            );
        }
        
    },[])

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
        
            
        </Stack>
    );
}