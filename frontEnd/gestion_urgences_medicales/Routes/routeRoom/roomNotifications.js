import db from './dbRoom';

export async function initNotifications() {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS Notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idUrgence INTEGER,
                titre TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                isRead INTEGER DEFAULT 0,
                FOREIGN KEY (idUrgence) REFERENCES Urgences(id) ON DELETE CASCADE
            );
        `);

        db.execSync(`
            CREATE INDEX IF NOT EXISTS idx_notifications_unread 
            ON Notifications(isRead, timestamp DESC);
        `);

        console.log("✅ Table 'Notifications' créée/vérifiée avec succès");
    } catch (error) {
        console.error("❌ Erreur création table Notifications:", error);
    }
}
