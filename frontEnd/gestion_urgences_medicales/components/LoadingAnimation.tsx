import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons'; 


export default function LoadingAnimation() {
    
    // 1. Valeur animée pour l'échelle (Pulsation)
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    
    // 2. Valeur animée pour la rotation (Tournoiement)
    const rotationAnim = useRef(new Animated.Value(0)).current; // 0 = 0 degrés

    
    // Définition de la séquence d'animation de pulsation
    const startScaleAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // 🌟 NOUVELLE FONCTION : Séquence d'animation de rotation
    const startRotationAnimation = () => {
        Animated.loop(
            Animated.sequence([
                
                Animated.timing(rotationAnim, {
                    toValue: 1, 
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                
                Animated.timing(rotationAnim, {
                    toValue: -1, 
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                
                Animated.timing(rotationAnim, {
                    toValue: 0, 
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };


    
    const rotation = rotationAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-45deg', '0deg', '45deg'], 
    });
    
    
    useEffect(() => {
        startScaleAnimation();
        startRotationAnimation();
        
        return () => {
            scaleAnim.stopAnimation();
            rotationAnim.stopAnimation();
        }
    }, []);

    
    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.iconWrapper,
                    {
                        
                        transform: [
                            { scale: scaleAnim }, 
                            { rotate: rotation } 
                        ],
                    },
                ]}
            >
                <Ionicons 
                    name="medkit" 
                    size={40} 
                    color="#FFFFFF" 
                />
            </Animated.View>
            <Text style={styles.loadingText}>Chargement en cours...</Text>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f2f2', 
    },
    iconWrapper: {
        width: 70,
        height: 70,
        borderRadius: 35, 
        backgroundColor: '#FF7F00', 
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        
        shadowColor: '#FF7F00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 6,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
    }
});