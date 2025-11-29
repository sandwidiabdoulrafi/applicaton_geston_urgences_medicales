import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';

export default function AssistantTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: '#34C759',
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                tabBarActiveTintColor: "#34C759", // Vert principal
                tabBarInactiveTintColor: "#8E8E93", // Gris inactif
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 90 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E5EA',
                },
            }}
        >
            {/* 1️⃣ Tableau de bord */}
            <Tabs.Screen
                name="index"
                options={{
                    title: "Tableau de bord",
                    tabBarIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "stats-chart" : "stats-chart-outline"} 
                            size={focused ? 28 : 24}
                            color={focused ? "#34C759" : "#8E8E93"} 
                        />
                    )
                }}
            />

            {/* 2️⃣ Urgences (en attente + en cours + terminées) */}
            <Tabs.Screen
                name="urgences"
                options={{
                    title: 'Urgences',
                    tabBarIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "medical" : "medical-outline"} 
                            size={focused ? 28 : 24}
                            color={focused ? "#FF3B30" : "#8E8E93"} 
                        />
                    ),
                    tabBarBadge: 5, // Nombre d'urgences en attente
                    tabBarActiveTintColor: "#FF3B30", // Rouge pour urgences
                }}
            />

            {/* 3️⃣ Discussions des urgence  */}
            <Tabs.Screen
                name="discussion"
                options={{
                    title: 'Discussion',
                    tabBarIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "chatbubble" : "chatbubble-outline"} 
                            size={focused ? 28 : 24}
                            color={focused ? "#007AFF" : "#8E8E93"} 
                        />
                    ),
                    tabBarActiveTintColor: "#007AFF", 
                }}
            />

            {/* 4️⃣ Profil établissement */}
            <Tabs.Screen
                name="profil"
                options={{
                    title: 'Établissement',
                    tabBarIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "business" : "business-outline"} 
                            size={focused ? 28 : 24}
                            color={focused ? "#FF9500" : "#8E8E93"} 
                        />
                    ),
                    tabBarActiveTintColor: "#FF9500", // Orange pour profil
                }}
            />
        </Tabs>
    )
}