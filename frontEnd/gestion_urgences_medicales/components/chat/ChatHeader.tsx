// components/chat/ChatHeader.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ChatHeaderProps {
    title: string;
    onBack: () => void;
}

export default function ChatHeader({ title, onBack }: ChatHeaderProps) {
    return (
        <Stack.Screen 
            options={{ 
                title,
                headerStyle: { backgroundColor: '#58D68D' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerLeft: () => (
                    <TouchableOpacity 
                        onPress={onBack} 
                        style={{ marginLeft: 8 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                )
            }}
        />
    );
}