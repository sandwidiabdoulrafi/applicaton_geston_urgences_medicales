import { Platform, StyleSheet, View, Text } from 'react-native';




export default function HomeScreen() {
    return (
        <View style={styles.container} >
            <Text>Bienvenue sur l’accueil !</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal:2,
    },
})
