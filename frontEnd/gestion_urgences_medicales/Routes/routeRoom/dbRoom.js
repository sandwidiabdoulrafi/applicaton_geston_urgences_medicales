import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

let db = null;

if (Platform.OS !== 'web') {
    
    db = SQLite.openDatabaseSync('gestion_urgence.db');
} else {
    console.warn('SQLite n’est pas disponible sur le Web');
}

export default db;

