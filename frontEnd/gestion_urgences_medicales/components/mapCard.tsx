import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import MapView, { Marker, Callout, Polyline, PROVIDER_GOOGLE, Circle } from "react-native-maps";
import { Ionicons } from '@expo/vector-icons';
import ServiceSante from "@/types/ServiceSante";
import LocationCoords from "@/types/LocationCoords";
import ServiceMap from "./maps/ServiceMap"
import ServiceCard from "./maps/ServiceCard";
import LoadingAnimation from "./LoadingAnimation";

// Constante pour la clé API Google Maps (à mettre dans vos variables d'environnement)
const GOOGLE_MAPS_API_KEY = "AIzaSyB20s2RlKpQQ0VuG7095yutfwlefA_VZAQ";

export default function MapCard({ steShowButtonUrgence, listeToShow, getResultFilterState }) {
    const [location, setLocation] = useState<LocationCoords | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceSante | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<LocationCoords[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<string | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [isShowMore, setIsShoMore] = useState(false);
    
    const mapRef = useRef<MapView>(null);

    // Services de santé (à remplacer par API)
    const healthServices: ServiceSante[] = [
        {
            id: 1,
            nomEtablissement: "Hôpital Yalgado Ouédraogo",
            typeEtablissement: "Hôpital public",
            telephone: "+226 25 30 50 00",
            adresse: "Avenue de l'Indépendance, Ouagadougou",
            ville: "Ouagadougou",
            heureOuverture: "07h00",
            heureFermeture: "18h00",
            description: "Hôpital général offrant des services d'urgence, de chirurgie et de maternité.",
            photoProfil: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400",
            latitude: 12.3733,
            longitude: -1.5197,
        },
        {
            id: 2,
            nomEtablissement: "Clinique Notre Dame",
            typeEtablissement: "Clinique privée",
            telephone: "+226 70 25 45 78",
            adresse: "Quartier Koulouba, Ouagadougou",
            ville: "Ouagadougou",
            heureOuverture: "08h00",
            heureFermeture: "20h00",
            description: "Clinique moderne avec un service de consultation et de pédiatrie.",
            photoProfil: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400",
            latitude: 12.365,
            longitude: -1.512,
        },
        {
            id: 3,
            nomEtablissement: "Centre Médical Paul VI",
            typeEtablissement: "Centre médical",
            telephone: "+226 25 31 24 67",
            adresse: "Zone 4, Ouagadougou",
            ville: "Ouagadougou",
            heureOuverture: "08h00",
            heureFermeture: "17h00",
            description: "Centre médical spécialisé en médecine générale et analyses.",
            photoProfil: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400",
            latitude: 12.3800,
            longitude: -1.5300,
        },
    ];

    // Filtrer les services par type et envoyer au parent
    useEffect(() => {
        const filtered = filterType 
            ? healthServices.filter(s => s.typeEtablissement.toLowerCase().includes(filterType.toLowerCase()))
            : healthServices;
        
        getResultFilterState(filtered);
    }, [filterType]);

    useEffect(() => {
        ServiceMap.requestLocationPermission({
            setLocation,
            mapRef,
            setLoading
        });
    }, []);
    
    // Fonction pour obtenir l'itinéraire réel via Google Maps Directions API
    const getDirectionsRoute = async (origin: LocationCoords, destination: LocationCoords) => {
        try {
            const originStr = `${origin.latitude},${origin.longitude}`;
            const destStr = `${destination.latitude},${destination.longitude}`;
            
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&language=fr`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'OK' && data.routes.length > 0) {
                const route = data.routes[0];
                const leg = route.legs[0];
                
                // Décoder le polyline
                const points = decodePolyline(route.overview_polyline.points);
                
                // Retourner les informations de l'itinéraire
                return {
                    coordinates: points,
                    distance: leg.distance.value, // en mètres
                    distanceText: leg.distance.text,
                    duration: leg.duration.text,
                    durationValue: leg.duration.value, // en secondes
                };
            } else {
                console.error('Erreur Directions API:', data.status);
                return null;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'itinéraire:', error);
            return null;
        }
    };

    // Fonction pour décoder le polyline de Google Maps
    const decodePolyline = (encoded: string): LocationCoords[] => {
        const points: LocationCoords[] = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < encoded.length) {
            let b;
            let shift = 0;
            let result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            
            shift = 0;
            result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            
            points.push({
                latitude: lat / 1e5,
                longitude: lng / 1e5,
            });
        }
        
        return points;
    };

    // Afficher l'itinéraire avec l'API Google Directions
    const showRoute = useCallback(async (service: ServiceSante) => {
        if (!location) return;

        setSelectedService(service);
        setIsLoadingRoute(true);
        
        try {
            // Obtenir l'itinéraire réel
            const routeData = await getDirectionsRoute(
                { latitude: location.latitude, longitude: location.longitude },
                { latitude: service.latitude, longitude: service.longitude }
            );
            
            if (routeData) {
                setRouteCoordinates(routeData.coordinates);
                setDistance(routeData.distance / 1000); // Convertir en km
                setDuration(routeData.duration);
                
                // Animer la carte pour montrer tout l'itinéraire
                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(routeData.coordinates, {
                        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                        animated: true,
                    });
                }
            } else {
                // Fallback: ligne droite si l'API échoue
                const route = [
                    { latitude: location.latitude, longitude: location.longitude },
                    { latitude: service.latitude, longitude: service.longitude },
                ];
                setRouteCoordinates(route);
                
                const dist = ServiceMap.calculateDistance(
                    location.latitude,
                    location.longitude,
                    service.latitude,
                    service.longitude
                );
                setDistance(dist);
                setDuration(null);
            }
        } catch (error) {
            console.error('Erreur showRoute:', error);
        } finally {
            setIsLoadingRoute(false);
        }
    }, [location]);

    const openModal = (serviceSelected) => {
        steShowButtonUrgence(false);
        setSelectedService(serviceSelected); 
        setIsShoMore(true);
    }

    const closeModal = () => {
        setIsShoMore(false);
        setSelectedService(null); 
        setRouteCoordinates([]);
        setDistance(null);
        setDuration(null);
        setTimeout(() => {
            steShowButtonUrgence(true);
        }, 0);
    }

    // Recentrer sur ma position
    const centerOnMyLocation = useCallback(() => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
        }
    }, [location]);

    // Icône personnalisée selon le type d'établissement
    const getCustomMarker = (type: string) => {
        const baseStyle = {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            borderWidth: 3,
            borderColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
        };
        console.log('type clique : ', type);

        if (type.toLowerCase().includes('hôpital')) {
            return (
                <View style={[baseStyle, { backgroundColor: '#FF3B30' }]}>
                    <Ionicons name="medical" size={22} color="#fff" />
                </View>
            );
        }
        if (type.toLowerCase().includes('clinique')) {
            return (
                <View style={[baseStyle, { backgroundColor: '#FF9500' }]}>
                    <Ionicons name="business" size={20} color="#fff" />
                </View>
            );
        }
        return (
            <View style={[baseStyle, { backgroundColor: '#34C759' }]}>
                <Ionicons name="fitness" size={20} color="#fff" />
            </View>
        );
    };

    if (loading) {
        return <LoadingAnimation />;
    }

    if (!location) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="location-off" size={64} color="#FF3B30" />
                <Text style={styles.errorTitle}>Position non disponible</Text>
                <Text style={styles.errorText}>
                    Activez la géolocalisation pour voir les services à proximité
                </Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => ServiceMap.requestLocationPermission({ setLocation, mapRef, setLoading })}
                >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Filtres */}
            <View style={styles.filterBar}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={styles.filterContent}
                >
                    <TouchableOpacity
                        style={[styles.filterChip, !filterType && styles.filterChipActive]}
                        onPress={() => setFilterType(null)}
                    >
                        <Text style={[styles.filterText, !filterType && styles.filterTextActive]}>
                            Tous ({healthServices.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'hôpital' && styles.filterChipActive]}
                        onPress={() => setFilterType('hôpital')}
                    >
                        <Ionicons name="medical" size={16} color={filterType === 'hôpital' ? '#fff' : '#FF3B30'} />
                        <Text style={[styles.filterText, filterType === 'hôpital' && styles.filterTextActive]}>
                            Hôpitaux
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'pharmacie' && styles.filterChipActive]}
                        onPress={() => setFilterType('pharmacie')}
                    >
                        <Ionicons name="bandage" size={16} color={filterType === 'pharmacie' ? '#fff' : '#27AE60'} />
                        <Text style={[styles.filterText, filterType === 'pharmacie' && styles.filterTextActive]}>
                            Pharmacie
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'clinique' && styles.filterChipActive]}
                        onPress={() => setFilterType('clinique')}
                    >
                        <Ionicons name="business" size={16} color={filterType === 'clinique' ? '#fff' : '#FF9500'} />
                        <Text style={[styles.filterText, filterType === 'clinique' && styles.filterTextActive]}>
                            Cliniques
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'centre' && styles.filterChipActive]}
                        onPress={() => setFilterType('centre')}
                    >
                        <Ionicons name="fitness" size={16} color={filterType === 'centre' ? '#fff' : '#27AE60'} />
                        <Text style={[styles.filterText, filterType === 'centre' && styles.filterTextActive]}>
                            Centre
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Carte */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {/* Marqueurs des services avec icônes personnalisées */}
                {listeToShow.map((service) => (
                    <Marker
                        key={service.id}
                        coordinate={{
                            latitude: service.latitude,
                            longitude: service.longitude,
                        }}
                    >
                        {getCustomMarker(service.typeEtablissement)}
                
                        <Callout 
                            tooltip
                            onPress={() => openModal(service)}  
                        >
                            <View style={styles.calloutContainer}>
                                <ScrollView 
                                    style={styles.calloutScroll}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Image 
                                        source={{ uri: service.photoProfil }} 
                                        style={styles.calloutImage}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.calloutContent}>
                                        <Text style={styles.calloutTitle} numberOfLines={2}>
                                            {service.nomEtablissement}
                                        </Text>
                                        <Text style={styles.calloutType}>
                                            {service.typeEtablissement}
                                        </Text>
                                        
                                        <View style={styles.calloutInfo}>
                                            <Ionicons name="location" size={14} color="#666" />
                                            <Text style={styles.calloutInfoText} numberOfLines={1}>
                                                {service.adresse}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.calloutInfo}>
                                            <Ionicons name="time" size={14} color="#666" />
                                            <Text style={styles.calloutInfoText}>
                                                {service.heureOuverture} - {service.heureFermeture}
                                            </Text>
                                        </View>
                            
                                        <Text style={styles.calloutDescription} numberOfLines={2}>
                                            {service.description}
                                        </Text>

                                        <View style={styles.calloutActions}>
                                            <TouchableOpacity 
                                                style={[styles.calloutButton, styles.calloutButtonPrimary]}
                                                onPress={() => openModal(service)}
                                            >
                                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                                                <Text style={[styles.calloutButtonText, styles.calloutButtonTextPrimary]}>
                                                    Voir plus
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </ScrollView>
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* Cercle de rayon autour de l'utilisateur */}
                {location && (
                    <Circle
                        center={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }}
                        radius={500}
                        strokeColor="rgba(0, 122, 255, 0.3)"
                        fillColor="rgba(0, 122, 255, 0.1)"
                    />
                )}

                {/* Itinéraire réel qui suit les routes */}
                {routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#007AFF"
                        strokeWidth={5}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </MapView>

            {/* Indicateur de chargement de l'itinéraire */}
            {isLoadingRoute && (
                <View style={styles.loadingRouteContainer}>
                    <View style={styles.loadingRouteContent}>
                        <LoadingAnimation />
                        <Text style={styles.loadingRouteText}>Calcul de l'itinéraire...</Text>
                    </View>
                </View>
            )}

            {/* Bouton ma position */}
            <TouchableOpacity 
                style={styles.myLocationButton}
                onPress={centerOnMyLocation}
            >
                <Ionicons name="locate" size={24} color="#007AFF" />
            </TouchableOpacity>

            {/* Badge nombre de services */}
            <View style={styles.countBadge}>
                <Text style={styles.countText}>
                    {listeToShow.length} service{listeToShow.length > 1 ? 's' : ''}
                </Text>
            </View>

            {/* Card service sélectionné */}
            {isShowMore && (
                <ServiceCard 
                    selectedService={selectedService} 
                    setRouteCoordinates={setRouteCoordinates} 
                    setDistance={setDistance} 
                    distance={distance}
                    duration={duration}
                    closeModal={closeModal} 
                    showRoute={showRoute}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F5F5F5',
    },
    map: { 
        flex: 1,
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#F5F5F5',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    filterBar: {
        backgroundColor:'rgba(82, 81, 79, 0.69)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    filterContent: {
        paddingHorizontal: 16,
        paddingVertical:10,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    filterChipActive: {
        backgroundColor: '#007AFF',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    filterTextActive: {
        color: '#fff',
    },
    myLocationButton: {
        position: 'absolute',
        right: 16,
        bottom: 100,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
    },
    countBadge: {
        position: 'absolute',
        top: 70,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    countText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    loadingRouteContainer: {
        position: 'absolute',
        top: 80,
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 100,
    },
    loadingRouteContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
    },
    loadingRouteText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    calloutContainer: { 
        backgroundColor: "white", 
        borderRadius: 16, 
        width: 280, 
        maxHeight: 360,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 8,
    },
    calloutScroll: { 
        maxHeight: 360,
    },
    calloutImage: { 
        width: "100%", 
        height: 140,
    },
    calloutContent: {
        padding: 16,
    },
    calloutTitle: { 
        fontWeight: "700", 
        fontSize: 17,
        color: '#1A1A1A',
        marginBottom: 4,
        lineHeight: 22,
    },
    calloutType: { 
        color: "#007AFF", 
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
    },
    calloutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    calloutInfoText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    calloutDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginTop: 8,
        marginBottom: 12,
    },
    calloutActions: {
        flexDirection: 'row',
        gap: 8,
    },
    calloutButtonPrimary: {
        backgroundColor: '#007AFF',
    },
    calloutButtonTextPrimary: {
        color: '#fff',
    },
    calloutButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: '#F0F8FF',
        gap: 6,
    },
    calloutButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
});