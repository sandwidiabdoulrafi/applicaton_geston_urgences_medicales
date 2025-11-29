import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

let dbServiceSante = null;

if (Platform.OS !== 'web') {
    
    dbServiceSante = SQLite.openDatabaseSync('gestion_urgence_serviceSante.db');
} else {
    console.warn('SQLite n’est pas disponible sur le Web');
}

export default dbServiceSante;
