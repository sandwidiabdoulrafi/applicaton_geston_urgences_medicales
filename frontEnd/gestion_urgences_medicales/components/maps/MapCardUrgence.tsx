import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from "react-native-maps";
import React, { useRef, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MapCardUrgence({ listeToShow, showDetail }) {
  const mapRef = useRef<MapView>(null);
  const [userService, setUserService] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour obtenir l'icône et la couleur selon la priorité
  const getMarkerConfig = (priorite: string) => {
    switch (priorite) {
      case 'vitale':
        return { 
          icon: 'alert-circle', 
          color: '#DC2626', // Rouge
          size: 40 
        };
      case 'grave':
        return { 
          icon: 'warning', 
          color: '#EA580C', // Orange foncé
          size: 36 
        };
      case 'consultation':
        return { 
          icon: 'medkit', 
          color: '#2563EB', // Bleu
          size: 32 
        };
      default:
        return { 
          icon: 'medical', 
          color: '#64748B', // Gris
          size: 32 
        };
    }
  };
  
  useEffect(() => {
    const loadUserService = async () => {
      try {
        const data = await AsyncStorage.getItem("userServiceSante");
        console.log("UserService data : ", data);
        if (data) {
          setUserService(JSON.parse(data));
        }
      } catch (error) {
        console.error("❌ Erreur lecture AsyncStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserService();
  }, []);
  
  // Centrer la carte sur le service utilisateur uniquement
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    // Toujours centrer sur le service de l'utilisateur, jamais sur les urgences
    if (userService.length > 0) {
      const service = userService[0];
      // Utiliser un délai plus court pour centrer rapidement
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: service.latitude,
          longitude: service.longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }, 500); // Animation plus rapide (500ms au lieu de 1000ms)
      }, 100);
    }
  }, [userService, isLoading]);

  // Calculer la position initiale basée sur le service utilisateur
  const getInitialRegion = () => {
    if (userService.length > 0) {
      const service = userService[0];
      return {
        latitude: service.latitude,
        longitude: service.longitude,
        latitudeDelta: 0.15, // Zoom moins fort pour voir plus large
        longitudeDelta: 0.15,
      };
    }
    // Position par défaut (Ouagadougou)
    return {
      latitude: 12.3628,
      longitude: -1.4804,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };
  };

  // Position du cercle (service utilisateur ou position par défaut)
  const getCircleCenter = () => {
    if (userService.length > 0) {
      return {
        latitude: userService[0].latitude,
        longitude: userService[0].longitude,
      };
    }
    return {
      latitude: 12.3628,
      longitude: -1.4804,
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        initialRegion={getInitialRegion()}
      >
        {/* Marqueur pour le service de l'utilisateur - Affiché en premier */}
        {userService.length > 0 && (
          <Marker
            key="service-marker"
            coordinate={{
              latitude: userService[0].latitude,
              longitude: userService[0].longitude,
            }}
            title={userService[0].nomEtablissement}
            description={userService[0].adresse}
            zIndex={999}
          >
            <View style={styles.serviceMarkerContainer}>
              <View style={styles.serviceMarkerIcon}>
                <Ionicons name="business" size={26} color="white" />
              </View>
            </View>
          </Marker>
        )}

        {/* Marqueurs des urgences */}
        {listeToShow.map((urgence) => {
          const markerConfig = getMarkerConfig(urgence.priorite);
          
          return (
            <Marker
              key={urgence.id}
              coordinate={{
                latitude: urgence.latitude,
                longitude: urgence.longitude,
              }}
              onPress={() => showDetail(urgence)}
            >
              <View style={styles.markerContainer}>
                {/* Cercle d'animation pour les urgences vitales */}
                {urgence.priorite === 'vitale' && (
                  <View style={[styles.pulseCircle, { backgroundColor: markerConfig.color }]} />
                )}
                
                {/* Icône principale */}
                <View style={[
                  styles.markerIcon, 
                  { backgroundColor: markerConfig.color }
                ]}>
                  <Ionicons 
                    name={markerConfig.icon} 
                    size={markerConfig.size * 0.6} 
                    color="white" 
                  />
                </View>
                
                {/* Badge de compteur si nécessaire */}
                {urgence.priorite === 'vitale' && (
                  <View style={styles.badge}>
                    <Ionicons name="flash" size={12} color="white" />
                  </View>
                )}
              </View>
            </Marker>
          );
        })}

        {/* Cercle de rayon autour du service de l'utilisateur */}
        {userService.length > 0 && (
          <Circle
            center={{
              latitude: userService[0].latitude,
              longitude: userService[0].longitude,
            }}
            radius={5000}
            strokeColor="rgba(37, 99, 235, 0.3)"
            fillColor="rgba(37, 99, 235, 0.1)"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: { 
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
  },
  markerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#DC2626',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  serviceMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceMarkerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16A34A', // Vert pour le service
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});