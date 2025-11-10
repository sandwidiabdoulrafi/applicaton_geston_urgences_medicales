import * as Location from "expo-location";



export async function requestLocationPermission ({ setLocation, mapRef, setLoading }){
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== "granted") {
            Alert.alert(
            "Permission requise", 
            "L'application a besoin d'accéder à votre position pour afficher les services à proximité.",
            [
                { text: "Paramètres", onPress: () => Linking.openSettings() },
                { text: "Annuler", style: "cancel" }
            ]
            );
            setLoading(false);
            return;
        }

        const userLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        
        setLocation(userLocation.coords);
        
      // Centrer la carte sur la position
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
        }
    } catch (error) {
        console.error("Erreur géolocalisation:", error);
        Alert.alert("Erreur", "Impossible de récupérer votre position");
    } finally {
        setLoading(false);
    }
};





export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}




export default{ 
    requestLocationPermission,
    calculateDistance
}