import db from './dbRoom';

// Création de la table si elle n'existe pas encore
export async function  initUrgences(){
    if (!db) {
        console.warn('  Base de données non disponible');
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
        
        console.log("  Table 'Urgences' vérifiée/créée avec succès");
    } catch (error) {
        console.error(" Erreur création table:", error);
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
        
        console.log(" Urgence ajoutée localement, ID:", result.lastInsertRowId);
        return result.lastInsertRowId;
    } catch (error) {
        console.error(" Erreur insertion SQLite:", error);
        throw error;
    }
}



// Récupérer toutes les urgences d'un patient
export async function getUrgencesByPatient(idPatient) {
    if (!db) {
        return Promise.reject('SQLite non disponible');
    }

    try {
        // db.execSync("DELETE FROM Urgences");
        const result = db.getAllSync(
            `SELECT * FROM Urgences WHERE idPatient = ? ORDER BY dateCreation DESC`,
            [idPatient]
        );
        
        
        console.log(` ${result.length} urgence(s) récupérée(s)`);
        return result;
    } catch (error) {
        console.error(" Erreur lecture SQLite:", error);
        throw error;
    }
}

// recuperation d'une urgence par id

export async function getUrgenceById(idUrgence) {
    if (!db) {
        return Promise.reject("SQLite non disponible");
    }

    try {
        const result = db.getFirstSync(
            `SELECT * FROM Urgences WHERE idUrgence = ?`,
            [idUrgence]
        );

        if (!result) {
            console.warn(`Aucune urgence trouvée pour idUrgence: ${idUrgence}`);
            return null;
        }

        console.log("✅ Urgence récupérée avec succès :", result);
        return result;
    } catch (error) {
        console.error("❌ Erreur récupération urgence by id SQLite:", error);
        throw error;
    }
}


// Supprimer une urgence
export async function deleteUrgence(idUrgence) {
    if (!db) {
        return Promise.reject('SQLite non disponible');
    }
    

    try {
        db.runSync(`DELETE FROM Urgences WHERE idUrgence = ?`, [idUrgence]);
        console.log(" Urgence supprimée");
    } catch (error) {
        console.error(" Erreur suppression SQLite:", error);
        throw error;
    }
}


export async function updateUgenceId(newData) {
    if (!db) {
        return Promise.reject("SQLite non disponible");
    }



    const dataToUpdate = newData.data || newData;

    console.log("les donnee recu a l'interieur  la sauvegarde Local : ", newData.data);

    try {
        db.runSync(
            `UPDATE Urgences
                SET 
                    intitule = ?, 
                    description = ?, 
                    priorite = ?
            WHERE id = ?`,
            [
                dataToUpdate.intitule,
                dataToUpdate.description,
                dataToUpdate.priorite,
                dataToUpdate.id
            ]
        );

        console.log(" Mise à jour locale réussie !");

    } catch (error) {
        console.error(" Erreur mise à jour SQLite:", error);
        throw error;
    }
}

// pour rejoindre les rooms

export const getAllUrgenceId = async()=>{
    try {
        const idUrgences = await db.getAllSync(`SELECT idUrgence FROM Urgences`)
        return{success : true, data : idUrgences}
    } catch (error) {
        console.log("erreur lors de la recuperation des idUrgence");
        return{success : fales}
    }
}



    
// ================================
// Mise à jour d’une urgence + Sauvegarde service santé
// ================================


export const updateForAccptUrgence = async (data) => {
    console.log("Données reçues pour update:", data);

    try {
        //  Sauvegarde immuable
        const service = data.serviceInfo;

        // === Mise à jour urgence ===
        db.runSync(
            `UPDATE Urgences
                SET 
                    idAssistant = ?, 
                    statut = ?, 
                    dateIntervention = ?
            WHERE idUrgence = ?`,
            [
                data.idService,
                data.statut,
                data.dateIntervention,
                data.idUrgence
            ]
        );
        console.log(" Urgence mise à jour localement ✔");

        // === Sauvegarde service de santé ===
        if (!service) {
            console.warn("  Aucun serviceInfo reçu, insert ignoré");
        } else {
            db.runSync(
                `INSERT INTO ServiceSante (
                    idService, nomEtablissement, email, telephone, typeEtablissement,
                    adresse, ville, latitude, longitude, heureOuverture,
                    heureFermeture, ouvert24h, description, photoProfil,
                    isActive, lastUpdated
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(idService) DO UPDATE SET
                    nomEtablissement = excluded.nomEtablissement,
                    email = excluded.email,
                    telephone = excluded.telephone,
                    typeEtablissement = excluded.typeEtablissement,
                    adresse = excluded.adresse,
                    ville = excluded.ville,
                    latitude = excluded.latitude,
                    longitude = excluded.longitude,
                    heureOuverture = excluded.heureOuverture,
                    heureFermeture = excluded.heureFermeture,
                    ouvert24h = excluded.ouvert24h,
                    description = excluded.description,
                    photoProfil = excluded.photoProfil,
                    isActive = excluded.isActive,
                    lastUpdated = CURRENT_TIMESTAMP;
                `,
                [
                    service.idService,
                    service.nomEtablissement,
                    service.email,
                    service.telephone,
                    service.typeEtablissement,
                    service.adresse,
                    service.ville,
                    service.latitude,
                    service.longitude,
                    service.heureOuverture,
                    service.heureFermeture,
                    service.ouvert24h,
                    service.description,
                    service.photoProfil,
                    service.isActive
                ]
            );

            console.log(" Service de santé sauvegardé / mis à jour ✔");
        }

        return { success: true };
    } catch (error) {
        console.error(" Erreur updateForAccptUrgence:", error);
        return { success: false };
    }
};






// Export par défaut pour compatibilité avec les imports existants
export default {
    initUrgences,
    addNewUgenceLocal,
    updateForAccptUrgence,
    updateUgenceId,
    getUrgencesByPatient,
    deleteUrgence,
    getUrgenceById,
    getAllUrgenceId,
};