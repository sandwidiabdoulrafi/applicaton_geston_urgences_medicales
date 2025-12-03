
import db from './dbRoom';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';



export async function initPatient() {
    try {
        // Création de la table Patient
        db.execSync(`
            CREATE TABLE IF NOT EXISTS Patient (
                id INTEGER PRIMARY KEY,
                idPatient TEXT NOT NULL,
                nom TEXT NOT NULL,
                prenom TEXT NOT NULL,
                dateNaissance TEXT,
                email TEXT UNIQUE NOT NULL,
                telephone TEXT,
                lieuResidence TEXT,
                numeroUrgence TEXT,
                photoProfil TEXT,
                groupeSanguin TEXT,
                taille TEXT,
                poids TEXT,
                maladieChronique BOOL,
                latitude REAL,
                longitude REAL,
                dateInscription TEXT DEFAULT CURRENT_TIMESTAMP,
                derniereMiseAJour TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Table 'Patient' créée/vérifiée avec succès");
    } catch (error) {
        console.error("❌ Erreur création table Patient:", error);
    }
}




/* ------------------------- 🔹 CREATE ------------------------- */
export async function createPatient(patient) {
    try {
        const idPatient = uuidv4();
        db.execSync(`
            INSERT INTO Patient (
                idPatient, nom, prenom, dateNaissance, email, motDePasse,
                telephone, lieuResidence, numeroUrgence, photoProfil, groupeSanguin,
                latitude, longitude, dateInscription
            ) VALUES (
                '${idPatient}',
                '${patient.nom}',
                '${patient.prenom}',
                '${patient.dateNaissance ?? ''}',
                '${patient.email}',
                '${patient.motDePasse}',
                '${patient.telephone ?? ''}',
                '${patient.lieuResidence ?? ''}',
                '${patient.numeroUrgence ?? ''}',
                '${patient.photoProfil ?? ''}',
                '${patient.groupeSanguin ?? ''}',
                ${patient.latitude ?? 0},
                ${patient.longitude ?? 0},
                datetime('now')
            );
        `);
        console.log("✅ Nouveau patient créé !");
        return idPatient;
    } catch (error) {
        console.error("❌ Erreur création patient:", error);
        throw error;
    }
}

/* ------------------------- 🔹 READ ------------------------- */
export async function getPatientByEmail(email) {
    try {
        const result = db.getFirstSync(`
            SELECT * FROM Patient WHERE email='${email}';
        `);
        return result;
    } catch (error) {
        console.error("❌ Erreur récupération patient:", error);
        return null;
    }
}

export async function getUserPatient () {
    try {
        const result = db.getAllSync(`SELECT * FROM Patient;`);

        return result;
    } catch (error) {
        console.error("❌ Erreur récupération patients:", error);
        return [];
    }
}

export async function getAllPatientsId () {
    try {
        const result = db.getAllSync(`SELECT idPatient FROM Patient;`);
        return result;
    } catch (error) {
        console.error("❌ Erreur récupération patients:", error);
        return [];
    }
}



/* ------------------------- 🔹 UPDATE ------------------------- */
export async function updatePatient(idPatient, data) {
    try {
        // Aucun champ envoyé → rien à faire
        if (!data || Object.keys(data).length === 0) {
            console.warn("⚠️ Aucun champ à mettre à jour");
            return { success: false };
        }

        // Générer dynamiquement : nom=?, prenom=?, telephone=?, ...
        const fields = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(", ");

        const values = Object.values(data);

        // On ajoute idPatient à la fin car il replace le dernier "?"
        values.push(idPatient);

        const query = `
            UPDATE Patient
            SET ${fields},
                derniereMiseAJour = datetime('now')
            WHERE idPatient = ?;
        `;

        db.runAsync(query, values);

        console.log("✅ Patient mis à jour :", idPatient);
        return { success: true };

    } catch (error) {
        console.error("❌ Erreur mise à jour patient:", error);
        return { success: false };
    }
}


/* ------------------------- 🔹 DELETE (Supprimer le compte) ------------------------- */
export async function deletePatientAccount(idPatient) {
    try {
        // Supprime les données associées
        db.execSync(`DELETE FROM Messages WHERE idUrgence IN (SELECT idUrgence FROM Urgences WHERE idPatient='${idPatient}');`);
        db.execSync(`DELETE FROM Notifications WHERE idUrgence IN (SELECT idUrgence FROM Urgences WHERE idPatient='${idPatient}');`);
        db.execSync(`DELETE FROM Urgences WHERE idPatient='${idPatient}';`);
        db.execSync(`DELETE FROM Patient WHERE idPatient='${idPatient}';`);

        console.log(`🗑️ Compte du patient ${idPatient} supprimé avec succès`);
        return true;
    } catch (error) {
        console.error("❌ Erreur suppression du compte patient:", error);
        return false;
    }
}

/* ------------------------- 🔹 LOGIN ------------------------- */
export async function loginPatient(email, motDePasse) {
    try {
        const result = db.getFirstSync(`
            SELECT * FROM Patient WHERE email='${email}' AND motDePasse='${motDePasse}';
        `);
        if (result) {
            console.log("✅ Connexion réussie pour:", result.email);
            return result;
        } else {
            console.log("⚠️ Identifiants incorrects");
            return null;
        }
    } catch (error) {
        console.error("❌ Erreur connexion patient:", error);
        throw error;
    }
}

/* ------------------------- 🔹 LOGOUT ------------------------- */
export async function logoutPatient() {
    try {
        // await AsyncStorage.removeItem('currentPatient');
        console.log("👋 Déconnexion du patient réussie !");
        return true;
    } catch (error) {
        console.error("❌ Erreur déconnexion:", error);
        return false;
    }
}







/* ------------------------- 🔹 RESET ET PERSISTENCE LOGIN PATIENT ------------------------- */


export async function resetAndSaveLoginDataPatient(loginData) {
    try {
        console.log("\n🔄 ===== DÉBUT RÉINITIALISATION PATIENT =====");
        
        // 1️⃣ Vider toutes les tables du patient
        await clearAllPatientTables();
        
        // 2️⃣ Sauvegarder les données du patient
        if (loginData.patient) {
            await savePatientData(loginData.patient);
        }
        
        // 3️⃣ Sauvegarder les urgences du patient
        if (loginData.urgences && loginData.urgences.length > 0) {
            await savePatientUrgences(loginData.urgences);
        }
        
        // 4️⃣ Sauvegarder les services de santé associés
        if (loginData.services && loginData.services.length > 0) {
            await savePatientServices(loginData.services);
        }
        
        console.log("✅ ===== SAUVEGARDE PATIENT TERMINÉE =====\n");
        return { success: true };
        
    } catch (error) {
        console.error("❌ Erreur resetAndSaveLoginDataPatient:", error);
        return { success: false, error };
    }
}

/**
 * 🗑️ Vide toutes les tables du patient
 */
async function clearAllPatientTables() {
    try {
        console.log("🗑️ Suppression des données patient...");
        
        await db.runAsync(`DELETE FROM Messages`);
        console.log("   ✓ Messages supprimés");
        
        await db.runAsync(`DELETE FROM Notifications`);
        console.log("   ✓ Notifications supprimées");
        
        await db.runAsync(`DELETE FROM Urgences`);
        console.log("   ✓ Urgences supprimées");
        
        await db.runAsync(`DELETE FROM ServiceSante`);
        console.log("   ✓ Services supprimés");
        
        await db.runAsync(`DELETE FROM Patient`);
        console.log("   ✓ Patient supprimé");
        
        console.log("✅ Toutes les tables patient vidées\n");
        
    } catch (error) {
        console.error("❌ Erreur clearAllPatientTables:", error);
        throw error;
    }
}

/**
 * 👤 Sauvegarde les données du patient
 */
async function savePatientData(patient) {
    try {
        console.log("💾 Sauvegarde du patient:", patient.nom, patient.prenom);
        
        await db.runAsync(
            `INSERT INTO Patient (
                idPatient, nom, prenom, dateNaissance, email, telephone,
                lieuResidence, numeroUrgence, photoProfil, groupeSanguin,
                taille, poids, maladieChronique, latitude, longitude,
                dateInscription, derniereMiseAJour
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patient.idPatient,
                patient.nom || '',
                patient.prenom || '',
                patient.dateNaissance || null,
                patient.email || '',
                patient.telephone || '',
                patient.lieuResidence || '',
                patient.numeroUrgence || '',
                patient.photoProfil || '',
                patient.groupeSanguin || '',
                patient.taille || null,
                patient.poids || null,
                patient.maladieChronique || false,
                patient.latitude || 0,
                patient.longitude || 0,
                patient.dateInscription || new Date().toISOString(),
                patient.derniereMiseAJour || new Date().toISOString()
            ]
        );
        
        console.log("   ✅ Patient sauvegardé\n");
        
    } catch (error) {
        console.error("❌ Erreur savePatientData:", error);
        throw error;
    }
}

/**
 * 🚨 Sauvegarde les urgences du patient avec leurs messages
 */
async function savePatientUrgences(urgences) {
    try {
        console.log(`🚨 Sauvegarde de ${urgences.length} urgence(s) patient...`);
        
        for (const urgence of urgences) {
            // 1️⃣ Sauvegarder l'urgence
            await db.runAsync(
                `INSERT INTO Urgences (
                    idUrgence, idPatient, idAssistant, intitule, description,
                    dateCreation, statut, priorite, latitude, longitude
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    urgence.idUrgence,
                    urgence.idPatient,
                    urgence.idAssistant || null,
                    urgence.intitule || '',
                    urgence.description || '',
                    urgence.dateCreation || new Date().toISOString(),
                    urgence.statut || 'en_attente',
                    urgence.priorite || 'moyenne',
                    urgence.latitude || 0,
                    urgence.longitude || 0
                ]
            );
            
            console.log(`   ✓ Urgence "${urgence.intitule}" sauvegardée`);
            
            // 2️⃣ Sauvegarder les messages de l'urgence
            if (urgence.messages && urgence.messages.length > 0) {
                await savePatientMessages(urgence.id, urgence.messages);
            }
        }
        
        console.log("✅ Toutes les urgences patient sauvegardées\n");
        
    } catch (error) {
        console.error("❌ Erreur savePatientUrgences:", error);
        throw error;
    }
}

/**
 * Sauvegarde les messages d'une urgence
 */
async function savePatientMessages(idUrgence, messages) {
    try {
        console.log(`   💬 Sauvegarde de ${messages.length} message(s)...`);
        
        for (const message of messages) {
            await db.runAsync(
                `INSERT INTO Messages (
                    idMessage, idUrgence, text, type, uri, fileName,
                    duration, sender, timestamp, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    message.idMessage || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    idUrgence,
                    message.text || null,
                    message.type || 'text',
                    message.uri || null,
                    message.fileName || null,
                    message.duration || null,
                    message.sender || 'patient',
                    message.timestamp || new Date().toISOString(),
                    message.status || 'envoye'
                ]
            );
        }
        
        console.log(`   ✓ ${messages.length} message(s) sauvegardé(s)`);
        
    } catch (error) {
        console.error("❌ Erreur savePatientMessages:", error);
        throw error;
    }
}

/**
 * Sauvegarde les services de santé associés aux urgences
 */
async function savePatientServices(services) {
    try {
        console.log(`Sauvegarde de ${services.length} service(s)...`);
        
        for (const service of services) {
            // Vérifier si le service existe déjà
            const existing = await db.getFirstSync(
                `SELECT idService FROM ServiceSante WHERE idService = ?`,
                [service.idService]
            );
            
            if (existing) {
                console.log(`   ⚠️ Service "${service.nomEtablissement}" existe déjà, ignoré`);
                continue;
            }
            
            await db.runAsync(
                `INSERT INTO ServiceSante (
                    idService, nomEtablissement, email, telephone, typeEtablissement,
                    adresse, ville, latitude, longitude, heureOuverture,
                    heureFermeture, ouvert24h, description, photoProfil,
                    distance, isActive, lastUpdated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    service.idService,
                    service.nomEtablissement || '',
                    service.email || '',
                    service.telephone || '',
                    service.typeEtablissement || '',
                    service.adresse || '',
                    service.ville || '',
                    service.latitude || 0,
                    service.longitude || 0,
                    service.heureOuverture || '08:00',
                    service.heureFermeture || '18:00',
                    service.ouvert24h ? 1 : 0,
                    service.description || '',
                    service.photoProfil || '',
                    service.distance || 0,
                    service.isActive ? 1 : 0,
                    service.lastUpdated || new Date().toISOString()
                ]
            );
            
            console.log(`   ✓ Service "${service.nomEtablissement}" sauvegardé`);
        }
        
        console.log("✅ Tous les services sauvegardés\n");
        
    } catch (error) {
        console.error("❌ Erreur savePatientServices:", error);
        throw error;
    }
}









export default{
    logoutPatient,
    createPatient,
    getPatientByEmail,
    getUserPatient,
    updatePatient,
    deletePatientAccount,
    loginPatient,
    getAllPatientsId,
    resetAndSaveLoginDataPatient
}

