import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { getServicesAvecUrgence } from '@/Routes/routeRoom/serviceSanteRoomService'
import SearchBarre from '@/components/searchBarre'
import { Ionicons } from '@expo/vector-icons'

export interface messageListItem {
    idUrgence: string
    intitule?: string | null
    description?: string | null
    priorite?: string | null
    statut?: string | null
    dateCreation?: string | null
    lastMessageText?: string | null
    lastMessageType?: 'text' | 'image' | 'video' | 'document' | 'audio' | null
    lastMessageTimestamp?: string | null
    lastMessageSender?: 'patient' | 'assistant' | 'service' | null
}

export default function Discussion() {
    const [load, setLoad] = useState<boolean>(false)
    const [listeDiscussion, setListDiscussion] = useState<messageListItem[]>([])
    const [filteredList, setFilteredList] = useState<messageListItem[]>([])
    const { userServiceSante } = useLocalSearchParams()
    const router = useRouter()

    useEffect(() => {
        const fetchDiscussion = async () => {
            setLoad(true)
            try {
                const response = await getServicesAvecUrgence()
                setListDiscussion(response || [])
                setFilteredList(response || [])
            } catch (error) {
                console.error("Erreur lors de la récupération de la liste de discussion : ", error)
            } finally {
                setLoad(false)
            }
        }
        fetchDiscussion()
    }, [])

    const handleSearchResults = (results: messageListItem[]) => {
        setFilteredList(results)
    }

    const formatTimestamp = (timestamp?: string | null) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        
        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60))
            return minutes < 1 ? "À l'instant" : `${minutes} min`
        }
        if (hours < 24) return `${hours}h`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}j`
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    }

    const getPriorityColor = (priorite?: string | null) => {
        switch (priorite?.toLowerCase()) {
            case 'haute':
            case 'urgente':
                return '#e74c3c'
            case 'moyenne':
                return '#f39c12'
            case 'basse':
                return '#3498db'
            default:
                return '#95a5a6'
        }
    }

    const getStatusBadge = (statut?: string | null) => {
        const status = statut?.toLowerCase()
        let bgColor = '#95a5a6'
        let text = statut || 'Inconnu'

        switch (status) {
            case 'en cours':
            case 'active':
                bgColor = '#3498db'
                break
            case 'résolue':
            case 'terminée':
                bgColor = '#27ae60'
                break
            case 'en attente':
                bgColor = '#f39c12'
                break
            case 'critique':
                bgColor = '#e74c3c'
                break
        }

        return { bgColor, text }
    }

    const getMessageTypeIcon = (type?: string | null) => {
        switch (type) {
            case 'image':
                return 'image-outline'
            case 'video':
                return 'videocam-outline'
            case 'document':
                return 'document-outline'
            case 'audio':
                return 'mic-outline'
            default:
                return null
        }
    }

    const renderDiscussionItem = ({ item }: { item: messageListItem }) => {
        const statusBadge = getStatusBadge(item.statut)
        const messageIcon = getMessageTypeIcon(item.lastMessageType)

        return (
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: '/chat/[id]',
                    params: { 
                        id: item.idUrgence,
                        intitule: item.intitule || 'Urgence',
                        priorite: item.priorite
                    }
                })}
                style={[
                    styles.discussionCard,
                    { borderLeftColor: getPriorityColor(item.priorite) }
                ]}
            >
                {/* En-tête */}
                <View style={styles.discussionHeader}>
                    <View style={styles.discussionTitleContainer}>
                        <Text style={styles.discussionTitle} numberOfLines={1}>
                            {item.intitule || 'Urgence sans titre'}
                        </Text>
                        <View style={styles.badgesContainer}>
                            <View style={[
                                styles.badge,
                                { backgroundColor: `${statusBadge.bgColor}20` }
                            ]}>
                                <Text style={[
                                    styles.badgeText,
                                    { color: statusBadge.bgColor }
                                ]}>
                                    {statusBadge.text}
                                </Text>
                            </View>
                            {item.priorite && (
                                <View style={[
                                    styles.badge,
                                    { backgroundColor: `${getPriorityColor(item.priorite)}15` }
                                ]}>
                                    <Text style={[
                                        styles.badgeText,
                                        { color: getPriorityColor(item.priorite) }
                                    ]}>
                                        {item.priorite}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={styles.timestamp}>
                        {formatTimestamp(item.lastMessageTimestamp || item.dateCreation)}
                    </Text>
                </View>

                {/* Description */}
                {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                {/* Dernier message */}
                {item.lastMessageText && (
                    <View style={styles.lastMessageContainer}>
                        {messageIcon && (
                            <Ionicons 
                                name={messageIcon} 
                                size={16} 
                                color="#7f8c8d" 
                                style={styles.messageIcon}
                            />
                        )}
                        <Text 
                            style={[
                                styles.lastMessageText,
                                { fontStyle: messageIcon ? 'italic' : 'normal' }
                            ]}
                            numberOfLines={1}
                        >
                            {item.lastMessageSender === 'patient' ? 'Vous: ' : ''}
                            {item.lastMessageText}
                        </Text>
                        {item.lastMessageSender !== 'patient' && (
                            <View style={styles.unreadIndicator} />
                        )}
                    </View>
                )}
            </TouchableOpacity>
        )
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Discussions des Urgences",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' }
                }}
            />

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
                <SearchBarre 
                    listeToSearch={listeDiscussion}
                    placeholder="Rechercher une urgence..."
                    onResults={handleSearchResults}
                    keySearch={['intitule', 'description', 'statut', 'priorite']}
                />
            </View>

            {/* Liste des discussions */}
            {load ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#58D68D" />
                    <Text style={styles.loadingText}>
                        Chargement des discussions...
                    </Text>
                </View>
            ) : filteredList.length > 0 ? (
                <FlatList
                    data={filteredList}
                    renderItem={renderDiscussionItem}
                    keyExtractor={(item) => item.idUrgence}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#bdc3c7" />
                    <Text style={styles.emptyTitle}>
                        {listeDiscussion.length === 0 
                            ? 'Aucune discussion' 
                            : 'Aucun résultat trouvé'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {listeDiscussion.length === 0 
                            ? 'Les discussions d\'urgence apparaîtront ici' 
                            : 'Essayez avec d\'autres mots-clés'}
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa'
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff'
    },
    discussionCard: {
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2
    },
    discussionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    discussionTitleContainer: {
        flex: 1,
        marginRight: 8
    },
    discussionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 4
    },
    badgesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600'
    },
    timestamp: {
        fontSize: 12,
        color: '#95a5a6',
        fontWeight: '500'
    },
    description: {
        fontSize: 13,
        color: '#7f8c8d',
        marginBottom: 8,
        lineHeight: 18
    },
    lastMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 8,
        marginTop: 4
    },
    messageIcon: {
        marginRight: 6
    },
    lastMessageText: {
        flex: 1,
        fontSize: 13,
        color: '#34495e'
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#58D68D',
        marginLeft: 8
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#7f8c8d',
        fontSize: 14
    },
    listContent: {
        paddingVertical: 8
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        color: '#2c3e50',
        fontWeight: '600',
        textAlign: 'center'
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center'
    }
})