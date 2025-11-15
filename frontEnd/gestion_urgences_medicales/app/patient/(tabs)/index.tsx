import MapCard from '@/components/mapCard';
import ModalNewUrgence from '@/components/modalNewUrgence';
import SearchBarre from '@/components/searchBarre';
import SearchBarreMap from '@/components/SearchBarreMap';
import { api } from '@/Routes/routesBackend/routesFunction';
import Discussion from '@/types/Discussion';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';





export default function HomeScreen() {


    const [showModal , setShowModal] = useState(false);
    const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([]);

    const[discussionsFilteredByStatus, SetDiscussionsFilteredByStatus] = useState<Discussion[]>([])

    const [showButtonUrgence, steShowButtonUrgence] = useState(true);



    const toggleModal = ()=>{
        setShowModal(!showModal);
    }

    // useEffect(() => {
    //     // Définir une fonction asynchrone DEDANS l'effet
    //     const checkHealth = async () => {
    //         try {
    //             // L'appel API est effectué
    //             // const response = await api.get("http://10.11.6.170:5000/api/urgences/get_all");    
    //             // const response = await api.get("http://10.11.6.170:5000/urgences/get_all");  
    //             const response = await api.get("http://192.168.1.132:5000/urgences/get_all");    

    //             // --- Ajout du log de la réponse ---
    //             console.log("Statut de l'API de santé (Health Check) :", response.status);
    //             console.log("Données de la réponse :", response.data);
    //             // ------------------------------------
    
    //             // Si l'API renvoie un statut 2xx, l'opération est réussie
    
    //         } catch (error) {
    //             // Gestion de l'erreur (si l'appel échoue, par ex. le serveur est éteint)
    //             console.error("Échec de l'appel à l'API de santé (Health Check) :", error);
    //         }
    //     };
    
    //     // Appeler la fonction asynchrone définie
    //     checkHealth();
    
    //     // La fonction de nettoyage (facultative ici, mais bonne pratique)
    //     return () => {
    //         // Annuler toute requête en cours si le composant est démonté
    //     };
    // }, []); // Le tableau de dépendances vide signifie que l'effet ne s'exécute qu'une seule fois au montage.




    return (
        <>
        <SafeAreaView style={styles.container} >
            <Stack.Screen options={{ title: "Accueil" }} />
            {/* barre de recherche */}

            <SearchBarreMap 
                    placeholder={'Rechercher un service de sante...'}
                    onResults={setFilteredDiscussions}
                    keySearch={"intitule"}
                    listeToSearch={discussionsFilteredByStatus} 
                    onSelectItem={undefined}            />

            {/* carte google map */}
            <MapCard steShowButtonUrgence={steShowButtonUrgence} listeToShow={filteredDiscussions} getResultFilterState={SetDiscussionsFilteredByStatus} />

            {/* Bouton Urgence */}
            {showButtonUrgence &&
                <TouchableOpacity 
                    style={styles.urgenceButton }
                    onPress={toggleModal}
                    >
                    <Ionicons name="alert-circle" size={24} color="white" />
                    <Text style={styles.urgenceText}>Urgence</Text>
                </TouchableOpacity>
            }
        </SafeAreaView>

        <ModalNewUrgence modalVisible={showModal} closeModal={()=>setShowModal(false)}/> 
        
        


        </>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 0,
        margin:0
    },
    
    urgenceButton: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        bottom: 30,
        right: 20,
        backgroundColor: '#FF3B30',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 50,
        elevation: 5,
    },
    urgenceText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});