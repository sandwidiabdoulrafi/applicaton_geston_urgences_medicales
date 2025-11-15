import db from './dbRoom';

// Création de la table si elle n'existe pas encore
export async function  initUrgences(){
    if (!db) {
        console.warn('⚠️ Base de données non disponible');
        return;
    }

    try {
        // Nouvelle API synchrone - plus de transaction/executeSql
        db.execSync(`
            CREATE TABLE IF NOT EXISTS Urgences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idUrgence TEXT,
                idPatient INTEGER,
                idAssistant INTEGER,
                intitule TEXT,
                description TEXT,
                dateCreation TEXT,
                statut TEXT,
                priorite TEXT,
                latitude REAL,
                longitude REAL
            );
        `);
        console.log("✅ Table 'Urgences' vérifiée/créée avec succès");
    } catch (error) {
        console.error("❌ Erreur création table:", error);
    }
};

// Fonction pour ajouter une urgence locale
export async function addNewUgenceLocal(idPatient, dataForm) {
    if (!db) {
        return Promise.reject('SQLite non disponible');
    }


    try {
        //  Nouvelle API : runSync au lieu de transaction + executeSql
        const result = db.runSync(
            `INSERT INTO Urgences 
            (idUrgence, idPatient, idAssistant, intitule, description, dateCreation, statut, priorite, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dataForm.idUrgence,
                idPatient,
                null,
                dataForm.intitule,
                dataForm.description,
                dataForm.dateCreation,
                dataForm.statut,
                dataForm.priorite,
                dataForm.latitude,
                dataForm.longitude
            ]
        );
        
        console.log("✅ Urgence ajoutée localement, ID:", result.lastInsertRowId);
        return result.lastInsertRowId;
    } catch (error) {
        console.error("❌ Erreur insertion SQLite:", error);
        throw error;
    }
}



// Récupérer toutes les urgences d'un patient
export async function getUrgencesByPatient(idPatient) {
    if (!db) {
        return Promise.reject('SQLite non disponible');
    }

    try {
        const result = db.getAllSync(
            `SELECT * FROM Urgences WHERE idPatient = ? ORDER BY dateCreation DESC`,
            [idPatient]
        );
        
        console.log(`✅ ${result.length} urgence(s) récupérée(s)`);
        return result;
    } catch (error) {
        console.error("❌ Erreur lecture SQLite:", error);
        throw error;
    }
}

// recuperation d'une urgence par id

export async function getUrgenceById(id){
    if(!db){
        return Promise.reject("SQLite non disponible");
    }

    try{
        const result = db.getFirstSync(`SELECT * FROM Urgences WHERE id = ?`, [id]);
        console.log("Urgence recuperee avec succee");
        return result;
    }catch(error){
        console.error("❌ Erreur recuperation urgence by id SQLite:", error);
        throw error;

    }
}

// Supprimer une urgence
export async function deleteUrgence(id) {
    if (!db) {
        return Promise.reject('SQLite non disponible');
    }

    try {
        console.log("+-=-=-=-=- ✅ Urgence supprimée :::::  ", id);
        db.runSync(`DELETE FROM Urgences WHERE id = ?`, [id]);
        console.log("✅ Urgence supprimée");
    } catch (error) {
        console.error("❌ Erreur suppression SQLite:", error);
        throw error;
    }
}

// Export par défaut pour compatibilité avec les imports existants
export default {
    initUrgences,
    addNewUgenceLocal,
    // updateUgenceId,
    getUrgencesByPatient,
    deleteUrgence,
    getUrgenceById,
};