import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { getPatientById } from '@/Routes/routeRoom/serviceSanteRoomService'
import { Ionicons } from '@expo/vector-icons'

export default function PatientInfo() {
    const { id } = useLocalSearchParams()
    const [load, setLoad] = useState(false)
    const [patient, setPatient] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                setLoad(true)
                const response = await getPatientById(id)
                console.log('le patient selectionné est : ', response)
                setPatient(response)
            } catch (error) {
                console.log("erreur lors de la récupération du patient ", error)
            } finally {
                setLoad(false)
            }
        }

        fetchPatient()
    }, [id])

    const calculateAge = (dateNaissance) => {
        if (!dateNaissance) return 'N/A'
        const birthDate = new Date(dateNaissance)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        })
    }

    const calculateIMC = (poids, taille) => {
        if (!poids || !taille) return 'N/A'
        const imc = poids / (taille * taille)
        return imc.toFixed(1)
    }

    const InfoCard = ({ icon, label, value, iconColor = '#58D68D' }) => (
        <View style={{ 
            backgroundColor: '#fff', 
            padding: 16, 
            borderRadius: 12, 
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
            flexDirection: 'row',
            alignItems: 'center'
        }}>
            <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: `${iconColor}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
            }}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ 
                    fontSize: 12, 
                    color: '#7f8c8d', 
                    marginBottom: 2,
                    fontWeight: '500'
                }}>{label}</Text>
                <Text style={{ 
                    fontSize: 16, 
                    color: '#2c3e50',
                    fontWeight: '600'
                }}>{value || 'Non renseigné'}</Text>
            </View>
        </View>
    )

    const SectionTitle = ({ title }) => (
        <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: '#2c3e50', 
            marginTop: 24,
            marginBottom: 16,
            marginLeft: 4
        }}>{title}</Text>
    )
    
    return (
        <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
            <Stack.Screen
                options={{
                    title: patient ? `${patient.prenom} ${patient.nom}` : "Profil Patient",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' },
                    headerLeft: () => (
                        <View style={{ marginLeft: 8 }}>
                            <Ionicons 
                                name="arrow-back" 
                                size={24} 
                                color="#fff"
                                onPress={() => router.back()}
                            />
                        </View>
                    ),
                }}
            />

            {load ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#58D68D" />
                    <Text style={{ marginTop: 12, color: '#7f8c8d', fontSize: 14 }}>
                        Chargement des informations...
                    </Text>
                </View>
            ) : patient ? (
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16 }}
                >
                    {/* En-tête avec photo */}
                    <View style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: 16, 
                        padding: 20,
                        alignItems: 'center',
                        marginBottom: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3
                    }}>
                        {patient.photoProfil ? (
                            <Image 
                                source={{ uri: patient.photoProfil }}
                                style={{ 
                                    width: 100, 
                                    height: 100, 
                                    borderRadius: 50,
                                    marginBottom: 16,
                                    borderWidth: 3,
                                    borderColor: '#58D68D'
                                }}
                            />
                        ) : (
                            <View style={{ 
                                width: 100, 
                                height: 100, 
                                borderRadius: 50,
                                backgroundColor: '#58D68D',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16
                            }}>
                                <Text style={{ 
                                    fontSize: 40, 
                                    color: '#fff',
                                    fontWeight: '700'
                                }}>
                                    {patient.prenom?.charAt(0)}{patient.nom?.charAt(0)}
                                </Text>
                            </View>
                        )}
                        <Text style={{ 
                            fontSize: 24, 
                            fontWeight: '700', 
                            color: '#2c3e50',
                            marginBottom: 4
                        }}>
                            {patient.prenom} {patient.nom}
                        </Text>
                        <Text style={{ 
                            fontSize: 14, 
                            color: '#7f8c8d',
                            fontWeight: '500'
                        }}>
                            Patient ID: {patient.id}
                        </Text>
                    </View>

                    {/* Informations personnelles */}
                    <SectionTitle title="Informations Personnelles" />
                    <InfoCard 
                        icon="calendar-outline" 
                        label="Date de naissance" 
                        value={formatDate(patient.dateNaissance)}
                        iconColor="#3498db"
                    />
                    <InfoCard 
                        icon="time-outline" 
                        label="Âge" 
                        value={`${calculateAge(patient.dateNaissance)} ans`}
                        iconColor="#3498db"
                    />
                    <InfoCard 
                        icon="location-outline" 
                        label="Lieu de résidence" 
                        value={patient.lieuResidence}
                        iconColor="#e74c3c"
                    />

                    {/* Contact */}
                    <SectionTitle title="Coordonnées" />
                    <InfoCard 
                        icon="call-outline" 
                        label="Téléphone" 
                        value={patient.telephone}
                        iconColor="#9b59b6"
                    />
                    <InfoCard 
                        icon="mail-outline" 
                        label="Email" 
                        value={patient.email}
                        iconColor="#9b59b6"
                    />
                    {patient.numeroUrgence && (
                        <InfoCard 
                            icon="alert-circle-outline" 
                            label="Numéro d'urgence" 
                            value={patient.numeroUrgence}
                            iconColor="#e67e22"
                        />
                    )}

                    {/* Informations médicales */}
                    <SectionTitle title="Informations Médicales" />
                    <InfoCard 
                        icon="water-outline" 
                        label="Groupe sanguin" 
                        value={patient.groupeSanguin}
                        iconColor="#e74c3c"
                    />
                    {patient.maladieChronique && (
                        <InfoCard 
                            icon="medical-outline" 
                            label="Maladie chronique" 
                            value={patient.maladieChronique === "1" ? "Oui" : "Non"}
                            iconColor="#e67e22"
                        />
                    )}

                    {/* Mesures physiques */}
                    <SectionTitle title="Mesures Physiques" />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <InfoCard 
                                icon="fitness-outline" 
                                label="Poids" 
                                value={patient.poids ? `${patient.poids} kg` : 'N/A'}
                                iconColor="#16a085"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InfoCard 
                                icon="resize-outline" 
                                label="Taille" 
                                value={patient.taille ? `${patient.taille} m` : 'N/A'}
                                iconColor="#16a085"
                            />
                        </View>
                    </View>
                    <InfoCard 
                        icon="analytics-outline" 
                        label="IMC (Indice de Masse Corporelle)" 
                        value={calculateIMC(patient.poids, patient.taille)}
                        iconColor="#16a085"
                    />

                    <View style={{ height: 20 }} />
                </ScrollView>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
                    <Text style={{ 
                        marginTop: 16, 
                        fontSize: 18, 
                        color: '#2c3e50',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        Aucun patient trouvé
                    </Text>
                    <Text style={{ 
                        marginTop: 8, 
                        fontSize: 14, 
                        color: '#7f8c8d',
                        textAlign: 'center'
                    }}>
                        Impossible de récupérer les informations du patient
                    </Text>
                </View>
            )}
        </View>
    )
}