import { View, Text, Alert, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Yup from 'yup';
import UrgenceDetail from '@/types/UrgenceDetail';
import roomUrgences from '@/Routes/routeRoom/roomUrgences';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Ionicons } from '@expo/vector-icons';
import urgenceService from '@/Routes/routeService/urgenceService';

// Schéma de validation Yup
const urgenceSchema = Yup.object().shape({
    intitule: Yup.string()
        .required('L\'intitulé est obligatoire')
        .min(3, 'L\'intitulé doit contenir au moins 3 caractères')
        .max(100, 'L\'intitulé ne doit pas dépasser 100 caractères'),
    description: Yup.string()
        .required('La description est obligatoire')
        .min(10, 'La description doit contenir au moins 10 caractères')
        .max(500, 'La description ne doit pas dépasser 500 caractères'),
    priorite: Yup.string()
        .required('La priorité est obligatoire')
        .oneOf(['vitale', 'grave', 'consultation'], 'Priorité invalide')
});

export default function Edit() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [urgence, setUrgence] = useState<UrgenceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // États pour les champs modifiables
    const [intitule, setIntitule] = useState('');
    const [description, setDescription] = useState('');
    const [priorite, setPriorite] = useState<'vitale' | 'grave' | 'consultation'>('consultation');

    // États pour les erreurs
    const [errors, setErrors] = useState<{
        intitule?: string;
        description?: string;
        priorite?: string;
    }>({});

    useEffect(() => {
        loadUrgenceDetails();
    }, [id]);

    const loadUrgenceDetails = async () => {
        try {
            const data = await roomUrgences.getUrgenceById(id);
            if (data) {
                setUrgence(data);
                // Initialiser les champs modifiables
                setIntitule(data.intitule);
                setDescription(data.description);
                setPriorite(data.priorite);
            } else {
                Alert.alert('Erreur', 'Urgence non trouvée');
                router.back();
            }
        } catch (error) {
            console.error('Erreur chargement urgence:', error);
            Alert.alert("Erreur", "Impossible de charger les infos de l'urgence pour la modification");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const validateForm = async () => {
        try {
            await urgenceSchema.validate(
                { intitule, description, priorite },
                { abortEarly: false }
            );
            setErrors({});
            return true;
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const validationErrors: any = {};
                err.inner.forEach((error) => {
                    if (error.path) {
                        validationErrors[error.path] = error.message;
                    }
                });
                setErrors(validationErrors);
            }
            return false;
        }
    };

    const handleSave = async () => {
        // Valider le formulaire
        const isValid = await validateForm();
        
        if (!isValid) {
            Alert.alert('Erreur de validation', 'Veuillez corriger les erreurs avant de continuer');
            return;
        }

        setSaving(true);
        try {
            // Mettre à jour l'urgence
            const updatedUrgence: UrgenceDetail = {
                ...urgence!,
                intitule,
                description,
                priorite
            };

            await urgenceService.updateUrgence(updatedUrgence);
            

            Alert.alert(
                'Succès',
                'L\'urgence a été modifiée avec succès',
                [
                    {
                        text: 'OK', 
                        onPress: () => router.replace({
                        pathname: `/patient/urgences/[id]`,
                        params: { id: urgence.id }
                        }) 
                    }
                ]
            );
        } catch (error) {
            console.error('❌ Erreur lors de la modification:', error);
            Alert.alert('Erreur', 'Impossible de modifier l\'urgence');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingAnimation />;
    }

    if (!urgence) {
        return null;
    }

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'vitale': return '#dc2626';
            case 'grave': return '#f59e0b';
            case 'consultation': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <>  
            <Stack.Screen
                options={{
                    title: "Modifier l'urgence",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',                    
                    headerTitleStyle: { fontWeight: 'bold' },

                    headerLeft: ()=>(
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 2 }}>
                            <Ionicons name="arrow-back" size={34} color="#fff" />
                        </TouchableOpacity>
                    ),

                }}
            />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    {/* Intitulé */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Intitulé *</Text>
                        <TextInput
                            style={[styles.input, errors.intitule && styles.inputError]}
                            value={intitule}
                            onChangeText={(text) => {
                                setIntitule(text);
                                if (errors.intitule) {
                                    setErrors({ ...errors, intitule: undefined });
                                }
                            }}
                            placeholder="Titre de l'urgence"
                            placeholderTextColor="#9ca3af"
                        />
                        {errors.intitule && (
                            <Text style={styles.errorText}>{errors.intitule}</Text>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description *</Text>
                        <TextInput
                            style={[styles.textArea, errors.description && styles.inputError]}
                            value={description}
                            onChangeText={(text) => {
                                setDescription(text);
                                if (errors.description) {
                                    setErrors({ ...errors, description: undefined });
                                }
                            }}
                            placeholder="Décrivez la situation d'urgence"
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                        {errors.description && (
                            <Text style={styles.errorText}>{errors.description}</Text>
                        )}
                    </View>

                    {/* Priorité */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Priorité *</Text>
                        <View style={styles.priorityContainer}>
                            {(['vitale', 'grave', 'consultation'] as const).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.priorityButton,
                                        priorite === p && {
                                            backgroundColor: getPriorityColor(p),
                                            borderColor: getPriorityColor(p)
                                        }
                                    ]}
                                    onPress={() => {
                                        setPriorite(p);
                                        if (errors.priorite) {
                                            setErrors({ ...errors, priorite: undefined });
                                        }
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.priorityText,
                                            priorite === p && styles.priorityTextActive
                                        ]}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.priorite && (
                            <Text style={styles.errorText}>{errors.priorite}</Text>
                        )}
                    </View>

                    {/* Informations non modifiables */}
                    <View style={styles.infoSection}>
                        <Text style={styles.infoTitle}>Informations non modifiables</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Statut:</Text>
                            <Text style={styles.infoValue}>{urgence.statut.replace("_"," ").toUpperCase()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Date de création:</Text>
                            <Text style={styles.infoValue}>
                                {new Date(urgence.dateCreation).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                    </View>

                    {/* Boutons d'action */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            disabled={saving}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={styles.saveButtonText}>
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb'
    },
    content: {
        padding: 16
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 24
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827'
    },
    textArea: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        minHeight: 120
    },
    inputError: {
        borderColor: '#dc2626'
    },
    errorText: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 4
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 8
    },
    priorityButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        alignItems: 'center'
    },
    priorityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280'
    },
    priorityTextActive: {
        color: '#fff'
    },
    infoSection: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8
    },
    infoLabel: {
        fontSize: 14,
        color: '#6b7280'
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827'
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151'
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center'
    },
    saveButtonDisabled: {
        backgroundColor: '#93c5fd'
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    }
});