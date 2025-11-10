import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchBarreMap({ placeholder, onResults, keySearch, listeToSearch,onSelectItem }) {
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [animatedHeight] = useState(new Animated.Value(0));

    useEffect(() => {
        if (searchText.trim() === '') {
            setSuggestions([]);
            setShowSuggestions(false);
            onResults(listeToSearch);
            collapseSuggestions();
        } else {
            const filtered = listeToSearch.filter(item =>
                item[keySearch]?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.nomEtablissement?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.typeEtablissement?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.ville?.toLowerCase().includes(searchText.toLowerCase())
            );
        
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
            onResults(filtered);
            
            if (filtered.length > 0) {
                expandSuggestions();
            } else {
                collapseSuggestions();
            }
        }
    }, [searchText, listeToSearch]);

    const expandSuggestions = () => {
        Animated.spring(animatedHeight, {
            toValue: 1,
            useNativeDriver: false,
            tension: 50,
            friction: 7
        }).start();
    };

    const collapseSuggestions = () => {
        Animated.spring(animatedHeight, {
            toValue: 0,
            useNativeDriver: false,
            tension: 50,
            friction: 7
        }).start();
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setSearchText(item.nomEtablissement || item[keySearch]);
        setShowSuggestions(false);
        collapseSuggestions();
        onResults([item]);
        if (onSelectItem) {
            onSelectItem(item);
        }
    };

    const handleClear = () => {
        setSearchText('');
        setSelectedItem(null);
        setSuggestions([]);
        setShowSuggestions(false);
        onResults(listeToSearch);
        collapseSuggestions();
    };

    const getIcon = (type) => {
        if (type?.toLowerCase().includes('hôpital')) return 'medical';
        if (type?.toLowerCase().includes('clinique')) return 'business';
        return 'fitness';
    };

    const getIconColor = (type) => {
        if (type?.toLowerCase().includes('hôpital')) return '#FF3B30';
        if (type?.toLowerCase().includes('clinique')) return '#FF9500';
        return '#34C759';
    };

    const maxHeight = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 300]
    });

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={placeholder}
                            placeholderTextColor="#999"
                            value={searchText}
                            onChangeText={setSearchText}
                            onFocus={() => searchText && setShowSuggestions(suggestions.length > 0)}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                                <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                </View>

                {searchText.length > 0 && (
                    <View style={styles.resultCount}>
                        <Text style={styles.resultCountText}>
                            {suggestions.length} résultat{suggestions.length > 1 ? 's' : ''}
                        </Text>
                    </View>
                )}
            </View>

            {showSuggestions && (
                <Animated.View style={[styles.suggestionsContainer, { maxHeight }]}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.suggestionItem,
                                    selectedItem?.id === item.id && styles.suggestionItemSelected
                                ]}
                                onPress={() => handleSelectItem(item)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: getIconColor(item.typeEtablissement) }
                                ]}>
                                    <Ionicons 
                                        name={getIcon(item.typeEtablissement)} 
                                        size={18} 
                                        color="#fff" 
                                    />
                                </View>

                                <View style={styles.suggestionContent}>
                                    <Text style={styles.suggestionTitle} numberOfLines={1}>
                                        {item.nomEtablissement || item[keySearch]}
                                    </Text>
                                    <Text style={styles.suggestionType} numberOfLines={1}>
                                        {item.typeEtablissement}
                                    </Text>
                                    <View style={styles.locationContainer}>
                                        <Ionicons name="location-outline" size={12} color="#999" />
                                        <Text style={styles.suggestionLocation} numberOfLines={1}>
                                            {item.ville || item.adresse}
                                        </Text>
                                    </View>
                                </View>

                                {selectedItem?.id === item.id && (
                                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                        </View>
                        }
                    />
                    </Animated.View>
                )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 1000,
        backgroundColor: '#fff',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    resultCount: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    resultCountText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 5,
        marginHorizontal: 16,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
    },
    suggestionItemSelected: {
        backgroundColor: '#f0f8ff',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    suggestionType: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    suggestionLocation: {
        fontSize: 12,
        color: '#999',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 64,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#999',
    },
});