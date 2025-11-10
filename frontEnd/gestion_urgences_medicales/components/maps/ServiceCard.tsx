import { View, Text, TouchableOpacity, Animated, StyleSheet, Alert, Linking, Platform } from 'react-native'
import React, { useCallback, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import ServiceSante from '@/types/ServiceSante';
import ButtonCall from '../ui/ButtonCall';

export default function ServiceCard({selectedService, setRouteCoordinates, setDistance, distance, closeModal, showRoute }) {

    const bottomCardAnimation = useRef(new Animated.Value(0)).current;
    
    const closeSelectedService = useCallback(() => {
        Animated.timing(bottomCardAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            closeModal()
            setRouteCoordinates([]);
            setDistance(null);
        });
    }, []);


    // Animer la card du bas
    Animated.spring(bottomCardAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
    }).start();

    const goToService =(serviceSelect)=>{
        showRoute(serviceSelect)
        closeSelectedService()
    }




      // 🧭 Ouvrir dans Google Maps
    const openInMaps = useCallback((service: ServiceSante) => {
        const scheme = Platform.select({ 
            ios: 'maps:', 
            android: 'geo:' 
        });
        const url = Platform.select({
            ios: `${scheme}?daddr=${service.latitude},${service.longitude}`,
            android: `${scheme}${service.latitude},${service.longitude}?q=${service.latitude},${service.longitude}(${encodeURIComponent(service.nomEtablissement)})`
        });
    
        Linking.openURL(url || '').catch(() => {
        // Fallback vers navigateur
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`;
        Linking.openURL(webUrl);
        });
    }, []);


    return (
        <Animated.View 
            style={[
            styles.bottomCard,
            {
                transform: [{
                translateY: bottomCardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                })
                }]
            }
            ]}
        >
            <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeSelectedService}
            >
            <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <View style={styles.bottomCardHeader}>
            <View style={styles.bottomCardTitleContainer}>
                <Text style={styles.bottomCardTitle} numberOfLines={1}>
                {selectedService.nomEtablissement}
                </Text>
                <Text style={styles.bottomCardType}>
                {selectedService.typeEtablissement}
                </Text>
            </View>
            {distance && (
                <View style={styles.distanceBadge}>
                <Ionicons name="navigate" size={16} color="#007AFF" />
                <Text style={styles.distanceText}>
                    {distance.toFixed(1)} km
                </Text>
                </View>
            )}
            </View>

            <View style={styles.bottomCardInfo}>
            <View style={styles.bottomCardInfoRow}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.bottomCardInfoText} numberOfLines={1}>
                {selectedService.adresse}
                </Text>
            </View>
            <View style={styles.bottomCardInfoRow}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.bottomCardInfoText}>
                {selectedService.heureOuverture} - {selectedService.heureFermeture}
                </Text>
            </View>
            </View>

            <View style={styles.bottomCardActions}>
                <ButtonCall telephone={selectedService.telephone}/>
            
            <TouchableOpacity 
                style={[styles.bottomCardButton, styles.bottomCardButtonPrimary]}
                onPress={() => goToService(selectedService)}
            >
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={[styles.bottomCardButtonText, styles.bottomCardButtonTextPrimary]}>
                Y aller
                </Text>
            </TouchableOpacity>
            </View>
            <View style={styles.bottomInterApp}>
                <TouchableOpacity 
                    style={styles.bouttomInterApp}
                    onPress={() => openInMaps(selectedService)}
                >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={[styles.bottomCardButtonText, styles.bottomCardButtonTextPrimary]}>
                    Utiliser votre application de localisation
                    </Text>
                </TouchableOpacity>
            </View>
            
        </Animated.View>
    )
}

const styles = StyleSheet.create({

    bottomCard: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: -2 },
        shadowRadius: 8,
        elevation: 8,
    },

    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        padding: 4,
    },
    bottomCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingRight: 40,
    },
    bottomCardTitleContainer: {
        flex: 1,
    },
    bottomCardTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#1A1A1A",
        marginBottom: 4,
    },
    bottomCardType: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
    },

    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    distanceText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#007AFF',
    },

    bottomCardInfo: {
        marginBottom: 16,
    },
    bottomCardInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    bottomCardInfoText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    bottomCardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    bottomCardButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    bouttomInterApp:{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#b5b81f',
        borderWidth: 1,
        borderColor: '#fbff05'
    },
    bottomInterApp:{
        marginTop: 6,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    bottomCardButtonSecondary: {
        backgroundColor: '#F0F8FF',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    bottomCardButtonTextSecondary: {
        color: '#007AFF',
    },
    bottomCardButtonTextPrimary: {
        color: '#fff',
    },
    bottomCardButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    bottomCardButtonPrimary: {
        backgroundColor: '#007AFF',
    },

})