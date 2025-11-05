import { View, Text, Button } from "react-native";
import { Link } from "expo-router";

export default function Index() {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22, marginBottom: 20 }}>Bienvenue 👋</Text>

            <Link href="/patient" asChild>
                <Button title="Espace Patient" />
            </Link>

            <Link href="/service_urgence" asChild>
                <Button title="Espace Service d’Urgence" />
            </Link>
        </View>
    );
}
