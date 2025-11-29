import { 
    View, 
    Text, 
    Modal, 
    StyleSheet, 
    TouchableOpacity, 
    Animated,
    Dimensions,
    PanResponder,
    TouchableWithoutFeedback,
    ActivityIndicator
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import socketServiceSanter from '@/Routes/socket/SocketServiceSant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import serviceSanteRoomService from '@/Routes/routeRoom/serviceSanteRoomService';
    
    const SCREEN_HEIGHT = Dimensions.get('window').height;
    
export default function DetailUrgence({ modalVisible, closeModal, urgence }) {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [load ,setLoad] = useState(false)
    const [userService, setUserService] = useState([]);
    const panResponder = useRef(
    PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5; // Seulement si glissement vers le bas
        },
        onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
            slideAnim.setValue(gestureState.dy);
        }
        },
        onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
            
            closeModalWithAnimation();
        } else {
            
            Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            }).start();
        }
        },
    })
        ).current;
    
    useEffect(() => {
        const loadUserService = async () => {
            try {
                const data = await AsyncStorage.getItem("userServiceSante");
                if (data) {
                    setUserService(JSON.parse(data));
                }
            } catch (error) {
                console.error("❌ Erreur lecture AsyncStorage:", error);
            }
        };
        loadUserService();
        }, []);
    
        useEffect(() => {
        if (modalVisible) {
            // Animation d'entrée (du bas vers le centre)
            Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
            }).start();
        }
        }, [modalVisible]);
    
        const closeModalWithAnimation = () => {
        // Animation de sortie (du centre vers le bas)
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            closeModal();
        });
        };

        const HandleAcceptUrgence = () => {
            console.log("\n╔═══════════════════════════════════════════╗");
            console.log("║   PRISE EN CHARGE URGENCE                 ║");
            console.log("╚═══════════════════════════════════════════╝");
            
            if (!urgence || !userService[0]) {
                console.log("❌ [MODAL] Données manquantes");
                return;
            }
        
            if (!socketServiceSanter.connected) {
                console.log("❌ [MODAL] Socket déconnecté");
                alert("Socket déconnecté. Veuillez réessayer.");
                return;
            }
        
            setLoad(true);
        
            const idUrgence = urgence.idUrgence;
            const idService = userService[0].idService;
        
            console.log(`📋 [MODAL] ID Urgence: ${idUrgence}`);
            console.log(`🏥 [MODAL] ID Service: ${idService}`);
            console.log(`📡 [MODAL] Socket ID: ${socketServiceSanter.id}`);
        
            const timeoutId = setTimeout(() => {
                console.log("\n⏱ [MODAL] TIMEOUT ATTEINT (8s)");
                cleanup();
                setLoad(false);
                alert("Aucune réponse du serveur. Veuillez réessayer.");
            }, 8000);
        
            const handleSuccess = async(incomingId) => {
                console.log("\n┌─────────────────────────────────────────┐");
                console.log("│ [MODAL] succesAdd reçu                  │");
                console.log("└─────────────────────────────────────────┘");
                console.log(`📥 ID reçu: ${incomingId}`);
                console.log(`📋 ID attendu: ${idUrgence}`);
        
                if (String(incomingId) !== String(idUrgence)) {
                    console.log("⚠️ [MODAL] ID différent, ignoré");
                    return;
                }

                //sauvegarde dans le room 
                console.log("⚠️ sauvergarde dans  room depuis DetailUrgence : ", urgence);
                urgence.statut = "en_cours"
                await serviceSanteRoomService.addUrgence(urgence)
                cleanup();
                setLoad(false);
                closeModalWithAnimation();
            };
        
            const handleError = ({ message }) => {
                console.log("\n┌─────────────────────────────────────────┐");
                console.log("│ [MODAL] Erreur reçue                    │");
                console.log("└─────────────────────────────────────────┘");
                console.log(`❌ Message: ${message}`);
                cleanup();
                setLoad(false);
                alert(message || "Erreur lors de la prise en charge");
            };
        
            const cleanup = () => {
                clearTimeout(timeoutId);
                socketServiceSanter.off("succesAdd", handleSuccess);
                socketServiceSanter.off("serviceIntervientError", handleError);
            };
            
            socketServiceSanter.on("succesAdd", handleSuccess);
            socketServiceSanter.on("serviceIntervientError", handleError);
        
            console.log("\n📤 [MODAL] Émission serviceIntervient...\n");
            socketServiceSanter.emit("serviceIntervient", { idUrgence, idService });
        };
    
        if (!urgence) return null;
    
        // Configuration des couleurs selon la priorité
        const getPriorityConfig = (priorite) => {
        switch (priorite) {
            case 'vitale':
            return { 
                color: '#DC2626', 
                label: 'URGENCE VITALE',
                icon: 'alert-circle',
                bgColor: '#FEE2E2'
            };
            case 'grave':
            return { 
                color: '#EA580C', 
                label: 'URGENCE GRAVE',
                icon: 'warning',
                bgColor: '#FFEDD5'
            };
            case 'consultation':
            return { 
                color: '#2563EB', 
                label: 'CONSULTATION',
                icon: 'medkit',
                bgColor: '#DBEAFE'
            };
            default:
            return { 
                color: '#64748B', 
                label: 'URGENCE',
                icon: 'medical',
                bgColor: '#F1F5F9'
            };
        }
        };
    
        const priorityConfig = getPriorityConfig(urgence.priorite);
    
        return (
        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="none"
            onRequestClose={closeModalWithAnimation}
        >
            <TouchableWithoutFeedback onPress={closeModalWithAnimation}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback>
                <Animated.View 
                    style={[
                    styles.modalContainer,
                    {
                        transform: [{ translateY: slideAnim }]
                    }
                    ]}
                    {...panResponder.panHandlers}
                >
                    {/* Barre de glissement */}
                    <View style={styles.dragBar} />
    
                    {/* En-tête avec priorité */}
                    <View style={[styles.header, { backgroundColor: priorityConfig.bgColor }]}>
                    <View style={styles.headerContent}>
                        <Ionicons 
                        name={priorityConfig.icon} 
                        size={32} 
                        color={priorityConfig.color} 
                        />
                        <View style={styles.headerText}>
                        <Text style={[styles.priorityLabel, { color: priorityConfig.color }]}>
                            {priorityConfig.label}
                        </Text>
                        <Text style={styles.title}>{urgence.intitule}</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={closeModalWithAnimation}
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={28} color="#64748B" />
                    </TouchableOpacity>
                    </View>
    
                    {/* Contenu */}
                    <View style={styles.content}>
                    
                    
    
                    {/* Date */}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color="#64748B" />
                        <Text style={styles.infoLabel}>Date:</Text>
                        <Text style={styles.infoValue}>
                        {new Date(urgence.dateCreation).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                        </Text>
                    </View>
    
                    {/* Localisation */}
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color="#64748B" />
                        <Text style={styles.infoLabel}>Position:</Text>
                        <Text style={styles.infoValue}>
                        {urgence.latitude.toFixed(4)}, {urgence.longitude.toFixed(4)}
                        </Text>
                    </View>
    
                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>Description:</Text>
                        <Text style={styles.description}>{urgence.description}</Text>
                    </View>
    
                    {/* Statut */}
                    <View style={[styles.statusBadge, { backgroundColor: priorityConfig.bgColor }]}>
                        <Text style={[styles.statusText, { color: priorityConfig.color }]}>
                        {urgence.statut.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                    </View>
    
                    {/* Boutons d'action */}
                    <View style={styles.actions}>
                        {load?(
                            <View style={[styles.actionButton, styles.acceptButton,  { opacity: 0.5 }]} >
                                <ActivityIndicator color={"white"}/>
                                <Text style={styles.actionButtonText}>Operation en cours</Text>
                            </View>
                        ):(
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.acceptButton]}
                                onPress={HandleAcceptUrgence}
                            >
                                <Ionicons name="checkmark-circle" size={24} color="white" />
                                <Text style={styles.actionButtonText}>Prendre en charge</Text>
                            </TouchableOpacity>
                        )}
                        
        
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.callButton]}
                            onPress={closeModalWithAnimation}
                        >
                            <Ionicons name="close" size={24} color="#5e0f0f" />
                            <Text style={styles.actionButtonText}>Quitter</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                </TouchableWithoutFeedback>
            </View>
            </TouchableWithoutFeedback>
        </Modal>
        );
    }
    
    const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: SCREEN_HEIGHT * 0.75,
        maxHeight: SCREEN_HEIGHT * 0.95,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 15,
    },
    dragBar: {
        width: 50,
        height: 6,
        backgroundColor: '#94A3B8',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 14,
    },
    headerText: {
        flex: 1,
    },
    priorityLabel: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        lineHeight: 28,
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
    },
    content: {
        padding: 24,
        paddingBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#CBD5E1',
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 10,
        fontWeight: '600',
        minWidth: 90,
    },
    infoValue: {
        fontSize: 15,
        color: '#0F172A',
        marginLeft: 8,
        flex: 1,
        fontWeight: '600',
    },
    descriptionContainer: {
        marginTop: 12,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
    },
    descriptionLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
    },
    statusBadge: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignSelf: 'flex-start',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 14,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    acceptButton: {
        backgroundColor: '#059669',
    },
    callButton: {
        backgroundColor: '#f72525',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});