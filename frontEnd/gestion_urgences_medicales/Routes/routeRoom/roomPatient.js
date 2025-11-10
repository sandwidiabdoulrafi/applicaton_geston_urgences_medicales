
import db from './dbRoom';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';



export async function initPatient() {
    try {
        // Création de la table Patient
        db.execSync(`
            CREATE TABLE IF NOT EXISTS Patient (
                idPatient INTEGER PRIMARY KEY,
                nom TEXT NOT NULL,
                prenom TEXT NOT NULL,
                dateNaissance TEXT,
                email TEXT UNIQUE NOT NULL,
                motDePasse TEXT NOT NULL,
                telephone TEXT,
                lieuResidence TEXT,
                numeroUrgence TEXT,
                photoProfil TEXT,
                groupeSanguin TEXT,
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

export async function getAllPatients () {
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
        let fields = Object.entries(data)
            .map(([key, value]) => `${key}='${value}'`)
            .join(', ');

        db.execSync(`
            UPDATE Patient 
            SET ${fields}, derniereMiseAJour=datetime('now')
            WHERE idPatient='${idPatient}';
        `);

        console.log("✅ Patient mis à jour !");
    } catch (error) {
        console.error("❌ Erreur mise à jour patient:", error);
        throw error;
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
        // Si tu utilises un stockage local (AsyncStorage), tu peux nettoyer la session ici :
        // await AsyncStorage.removeItem('currentPatient');
        console.log("👋 Déconnexion du patient réussie !");
        return true;
    } catch (error) {
        console.error("❌ Erreur déconnexion:", error);
        return false;
    }
}

export default{
    logoutPatient,
    createPatient,
    getPatientByEmail,
    getAllPatients,
    updatePatient,
    deletePatientAccount,
    loginPatient,
    getAllPatientsId
}