import { Tabs } from "expo-router";
import React from "react";
import { Platform, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function PatientLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerTitleAlign: "center",
                headerStyle: {
                    backgroundColor: "#58D68D",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 22,
                },
                tabBarStyle: {
                    backgroundColor: "#58D68D",
                    height: Platform.OS === "ios" ? 90 : 60 + insets.bottom,
                    paddingBottom: Platform.OS === "ios" ? 30 : 10 + insets.bottom,
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
                    // tabBarBadge: 2,
                }}
            />

        {/* CHAT */}
        <Tabs.Screen
            name="chat"
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
                        Discussions
                    </Text>
                ),
                tabBarIcon: ({ focused }) => (
                    <Ionicons
                    name={focused ? "chatbubbles" : "chatbubbles-outline"}
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
