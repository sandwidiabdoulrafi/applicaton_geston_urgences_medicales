import db from './dbRoom';

export async function initServiceSante() {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS ServiceSante (
                idService INTEGER PRIMARY KEY,
                nomEtablissement TEXT NOT NULL,
                email TEXT,
                motDePasse TEXT,
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

        db.execSync(`
            CREATE INDEX IF NOT EXISTS idx_services_location 
            ON ServiceSante(latitude, longitude, isActive);
        `);

        console.log("✅ Table 'ServiceSante' créée/vérifiée avec succès");
    } catch (error) {
        console.error("❌ Erreur création table ServiceSante:", error);
    }
}
