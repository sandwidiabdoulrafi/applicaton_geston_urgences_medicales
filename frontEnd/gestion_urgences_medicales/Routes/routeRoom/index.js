import { initUrgences } from './roomUrgences';
import { initPatient } from './roomPatient';
import { initServiceSante } from './roomServiceSante';
import { initMessages } from './roomMessages.js';
import { initNotifications } from './roomNotifications.js';

export default async function InitDB() {
    try {
        await initUrgences();
        await initPatient();
        await initServiceSante();
        await initMessages();
        await initNotifications();

        console.log("✅ Base de données RoomSQLite initialisée avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors de l’initialisation de la base:", error);
    }
}
