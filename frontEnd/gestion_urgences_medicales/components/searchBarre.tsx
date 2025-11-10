import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';




export default function SearchBarre({ placeholder, listeToSearch = [], onResults, keySearch }) {
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (!listeToSearch || !Array.isArray(listeToSearch)) {
            onResults && onResults([]);
            return;
        }

        const text = searchText.toLowerCase().trim();

        const filtered = listeToSearch.filter(item => {
            if (typeof item === 'string') {
                return item.toLowerCase().includes(text);
            }

            if (typeof item === 'object') {
                if (keySearch && item[keySearch]) {
                    return item[keySearch].toLowerCase().includes(text);
                }
            }
            return false;
        });

        onResults && onResults(filtered);
    }, [searchText, listeToSearch]);

    return (
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.icon} />
            <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder={placeholder}
                placeholderTextColor="#888"
                style={styles.input}
                autoCorrect={false}
                keyboardType="default"
            />
            {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        margin: 8,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    icon: { marginRight: 8 },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    },
});
