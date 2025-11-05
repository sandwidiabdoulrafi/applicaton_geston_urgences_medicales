import { Tabs } from "expo-router";
import React from "react";
import { Platform, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PatientLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerStyle: {
                    backgroundColor: "#007AFF",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 22,
                },
                tabBarStyle: {
                    backgroundColor: "#58D68D",
                    height: Platform.OS === "ios" ? 90 : 60,
                    paddingBottom: Platform.OS === "ios" ? 30 : 10,
                    paddingTop: 10,
                    borderTopWidth: 0,
                    elevation: 10,
                },
                tabBarActiveTintColor: "#2E86C1",
                tabBarInactiveTintColor: "#FFFFFF",
            }}
        >
            {/* Accueil */}
            <Tabs.Screen
                name="index"
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text
                        style={{
                            marginTop: 4,
                            fontSize: 14,
                            fontWeight: "600",
                            color: focused ? "#2E86C1" : "#FFFFFF",
                        }}
                        >
                            Accueil
                        </Text>
                    ),
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={30}
                            color={focused ? "#2E86C1" : "#FFFFFF"}
                        />
                    ),
                }}
            />

        {/* Mes Urgences */}
            <Tabs.Screen
                name="mes_urgences"
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text
                            style={{
                                marginTop: 4,
                                fontSize: 14,
                                fontWeight: "600",
                                color: focused ? "#2E86C1" : "#FFFFFF",
                            }}
                        >
                            Urgences
                        </Text>
                    ),
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                        name={focused ? "alert-circle" : "alert-circle-outline"}
                        size={30}
                        color={focused ? "#2E86C1" : "#FFFFFF"}
                        />
                    ),
                    tabBarBadge: 2,
                }}
            />

        {/* Notifications */}
        <Tabs.Screen
            name="notifications"
            options={{
                tabBarLabel: ({ focused }) => (
                    <Text
                    style={{
                        marginTop: 4,
                        fontSize: 14,
                        fontWeight: "600",
                        color: focused ? "#2E86C1" : "#FFFFFF",
                    }}
                    >
                        Notifications
                    </Text>
                ),
                tabBarIcon: ({ focused }) => (
                    <Ionicons
                        name={focused ? "notifications" : "notifications-outline"}
                        size={30}
                        color={focused ? "#2E86C1" : "#FFFFFF"}
                    />
                ),
                tabBarBadge: 3,
            }}
        />

        {/* Profil */}
        <Tabs.Screen
            name="profil"
            options={{
                tabBarLabel: ({ focused }) => (
                    <Text
                    style={{
                        marginTop: 4,
                        fontSize: 14,
                        fontWeight: "600",
                        color: focused ? "#2E86C1" : "#FFFFFF",
                    }}
                    >
                        Profil
                    </Text>
                ),
                tabBarIcon: ({ focused }) => (
                    <Ionicons
                    name={focused ? "person" : "person-outline"}
                    size={30}
                    color={focused ? "#2E86C1" : "#FFFFFF"}
                    />
                ),
            }}
        />
    </Tabs>
  );
}
