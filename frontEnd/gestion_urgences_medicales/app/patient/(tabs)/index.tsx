import MapCard from '@/components/mapCard';
import ModalNewUrgence from '@/components/modalNewUrgence';
import SearchBarre from '@/components/searchBarre';
import SearchBarreMap from '@/components/SearchBarreMap';
import Discussion from '@/types/Discussion';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';





export default function HomeScreen() {


    const [showModal , setShowModal] = useState(false);
    const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([]);

    const[discussionsFilteredByStatus, SetDiscussionsFilteredByStatus] = useState<Discussion[]>([])

    const [showButtonUrgence, steShowButtonUrgence] = useState(true);



    const toggleModal = ()=>{
        setShowModal(!showModal);
    }





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