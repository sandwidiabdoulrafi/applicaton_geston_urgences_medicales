
import { Platform, StyleSheet, View, Text, SafeAreaView, Vibration } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import socketServiceSant from '@/Routes/socket/SocketServiceSant';
import SearchBarreMap from '@/components/SearchBarreMap';
import FiltreByPriority from '@/components/ui/FiltreByPriority';
import ServiceSante from '../../../types/ServiceSante';
import MapCardUrgence from '@/components/maps/MapCardUrgence';
import DetailUrgence from '@/components/DetailUrgence';
import routesFunction from '@/Routes/routesBackend/routesFunction';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Audio } from 'expo-av';
import serviceSanteRoomService from '@/Routes/routeRoom/serviceSanteRoomService';
import socketServiceSanter from '@/Routes/socket/SocketServiceSant';

export default function HomeScreen() {
    const [allUrgenceProxi, setAllUrgenceProxi] = useState<ServiceSante[]>([]);
    const [priorityFiltred, setPriorityFiltred] = useState<ServiceSante[]>([]);
    const [listeUrgenceProxiFiltred, setListeUrgenceProxiFiltred] = useState<ServiceSante[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [urgenceSelected, setUrgenceSelected] = useState<ServiceSante | null>(null);
    const notificationSound = useRef<Audio.Sound>(null);
    const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);

    

    const handleOpenUrgDetail = (urgence: ServiceSante) => {
        setUrgenceSelected(urgence);
        setShowModal(true);
    };

    const handleCloseUrgDetail = () => {
        setUrgenceSelected(null);
        setShowModal(false);
    };
    let isMounted = true; 

    const playNotificationSound = async () => {
        try {
            if (notificationSound.current) {
                await notificationSound.current.replayAsync();
            }
        } catch (error) {
            console.error('❌ Erreur lecture son:', error);
        }
    };
    
    

    useEffect(() => {
        console.log("\n╔═══════════════════════════════════════════╗");
        console.log("║   INITIALISATION INDEX SOCKET             ║");
        console.log("╚═══════════════════════════════════════════╝\n");
    
        const handleRemoveFromList = (idUrgence) => {
            console.log("\n┌─────────────────────────────────────────┐");
            console.log("│ [INDEX] removeUrgenceFromList           │");
            console.log("└─────────────────────────────────────────┘");
            console.log(`🗑️ ID à supprimer: ${idUrgence}`);


            // Retirer l'urgence des listes
            setAllUrgenceProxi(prev => prev.filter(u => u.idUrgence !== idUrgence));
            setPriorityFiltred(prev => prev.filter(u => u.idUrgence !== idUrgence));
            setListeUrgenceProxiFiltred(prev => prev.filter(u => u.idUrgence !== idUrgence));

            console.log(`✅ [INDEX] Urgence supprimée de la liste\n`);
        };
    
        socketServiceSanter.on("removeUrgenceFromList", handleRemoveFromList);
    
        return () => {
            
            socketServiceSanter.off("removeUrgenceFromList", handleRemoveFromList);
        };
    }, []);
    




    
    
    useEffect(() => {
        if (pendingRemovals.length === 0) return;
    
        setAllUrgenceProxi(prev => prev.filter(u => !pendingRemovals.includes(u.idUrgence)));
        setPriorityFiltred(prev => prev.filter(u => !pendingRemovals.includes(u.idUrgence)));
        setListeUrgenceProxiFiltred(prev => prev.filter(u => !pendingRemovals.includes(u.idUrgence)));
    
        // Si on avait la modale ouverte sur une urgence supprimée → on la ferme
        setUrgenceSelected(prev => {
            if (prev && pendingRemovals.includes(prev.idUrgence)) {
                return null;
            }
            return prev;
        });
    
        setShowModal(prev => {
            if (urgenceSelected && pendingRemovals.includes(urgenceSelected.idUrgence)) {
                return false;
            }
            return prev;
        });
    
        // Nettoyage
        setPendingRemovals([]);
    }, [pendingRemovals, allUrgenceProxi]);
    
    
    
    

    useEffect(() => {
        loadNotificationSound();

        
        
        return () => {
            // Nettoyer le son à la fermeture
            if (notificationSound.current) {
                notificationSound.current.unloadAsync();
            }
        };
    }, []);

    const loadNotificationSound = async () => {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('@/assets/sound/newMessage.mp3'), 
                    { shouldPlay: false }
                );
                notificationSound.current = sound;
            } catch (error) {
                console.error('❌ Erreur chargement son:', error);
            }
        };

    useEffect(() => {
        // 🔵 1. RÉCUPÉRER LES URGENCES EXISTANTES
        const fetchUrgences = async () => {
            try {
                const response = await routesFunction.getAllUrgences(); 

                // console.log("=== récupération urgences ===", response.data);
                
                if (isMounted && Array.isArray(response.data.data)) {
                    setAllUrgenceProxi(response.data.data);
                }
            } catch (error) {
                console.error("❌ Erreur récupération urgences:", error);
            }
        };
    
        fetchUrgences();



        // 🟢 3. ÉCOUTER LES NOUVELLES URGENCES EN TEMPS RÉEL
        socketServiceSant.on("urgence:added", async(data) => {
            console.log("📥 Nouvelle urgence reçue en temps réel:", data);
            
            // declanche la notif
            
                await playNotificationSound();
                Vibration.vibrate(200);

            // Vérifier que l'urgence n'existe pas déjà
            setAllUrgenceProxi(prev => {
                const exists = prev.some(u => u.idUrgence === data.idUrgence);
                if (exists) return prev;
                return [...prev, data];
            });
        });

        return () => {

            isMounted = false;
            socketServiceSant.off("urgence:added");
        };
    }, []);

    if(!allUrgenceProxi){
        return (
            <LoadingAnimation/>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: "Liste des urgences" }} />


            <FiltreByPriority 
                listeInput={allUrgenceProxi} 
                listOutPut={setPriorityFiltred} 
            />
            
            <SearchBarreMap
                placeholder="Rechercher une urgence..."
                onResults={setListeUrgenceProxiFiltred}
                keySearch="intitule"
                listeToSearch={allUrgenceProxi} 
                onSelectItem={undefined}
            />


            <MapCardUrgence 
                listeToShow={listeUrgenceProxiFiltred.filter(u => priorityFiltred.includes(u))} 
                showDetail={handleOpenUrgDetail} 
            />

            <DetailUrgence 
                modalVisible={showModal} 
                closeModal={handleCloseUrgDetail}
                urgence={urgenceSelected}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    }
});