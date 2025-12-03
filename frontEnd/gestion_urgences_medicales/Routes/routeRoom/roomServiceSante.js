import db from './dbRoom';

// ================================
// Création propre de la table SERVICE SANTE
// ================================

export async function initServiceSante() {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS ServiceSante (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idService TEXT UNIQUE NOT NULL,
                nomEtablissement TEXT NOT NULL,
                email TEXT,
                telephone TEXT,
                typeEtablissement TEXT,
                adresse TEXT,
                ville TEXT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                heureOuverture TEXT,
                heureFermeture TEXT,
                ouvert24h INTEGER DEFAULT 0,
                description TEXT,
                photoProfil TEXT,
                distance REAL,
                isActive INTEGER DEFAULT 1,
                lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("✅ Table ServiceSante créée !");
    } catch (error) {
        console.error("❌ Erreur création table ServiceSante:", error);
    }
}





        // Supprimer proprement
        // db.execSync(`
        //     DROP TABLE IF EXISTS ServiceSante;
        // `);
