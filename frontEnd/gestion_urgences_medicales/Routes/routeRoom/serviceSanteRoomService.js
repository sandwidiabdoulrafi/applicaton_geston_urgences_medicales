// serviceSanteRoomService.js
import dbServiceSante from './serviceSanteRoom';
import 'react-native-get-random-values';

/* ------------------------- 🔹 INITIALISER LA TABLE ------------------------- */
export async function initServiceSante() {
    try {
        // 🔹 Création de la table
        dbServiceSante.execSync(`
            CREATE TABLE IF NOT EXISTS ServiceSantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idService TEXT UNIQUE,
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
                distance REAL DEFAULT 0,
                isActive INTEGER DEFAULT 1,
                lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);


        dbServiceSante.execSync(`
            CREATE TABLE IF NOT EXISTS Urgences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idUrgence TEXT,
                idPatient TEXT NOT NULL,
                idAssistant TEXT,
                intitule TEXT,
                description TEXT,
                priorite TEXT ,
                statut TEXT,
                dateCreation TEXT,
                dateIntervention TEXT,
                latitude REAL,
                longitude REAL,
                idTmp TEXT UNIQUE
            );

        `);

        

        dbServiceSante.execSync(`
            CREATE TABLE IF NOT EXISTS Patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idPatient TEXT UNIQUE,
                nom TEXT,
                prenom TEXT,
                dateNaissance TEXT,
                email TEXT,
                telephone TEXT,
                groupeSanguin TEXT,
                lieuResidence TEXT,
                maladieChronique TEXT,
                numeroUrgence TEXT,
                photoProfil TEXT,
                poids REAL,
                taille REAL,
                role TEXT DEFAULT 'patient'
            );
        `);
//         dbServiceSante.execSync(`
//     DROP TABLE IF EXISTS Messages;
// `);
        dbServiceSante.execSync(`
            CREATE TABLE IF NOT EXISTS Messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idUrgence TEXT NOT NULL,
                sender TEXT NOT NULL CHECK(sender IN ('patient','service')),
                text TEXT,
                type TEXT NOT NULL CHECK(type IN ('text', 'image', 'video', 'document', 'audio')),
                uri TEXT,
                fileName TEXT,
                duration REAL,
                timestamp TEXT NOT NULL,
                status TEXT DEFAULT 'envoi' CHECK(status IN ('envoi', 'envoye', 'erreur', 'lu'))
            );

        `);





        console.log("✅ Table ServiceSante créée/vérifiée");

    

    } catch (error) {
        console.error("❌ Erreur dans initServiceSante:", error);
    }
}

/* ------------------------- 🔹 CHECK SI SERVICE EXISTE ------------------------- */
function checkIfExists(idService) {
    try {
        const exist = dbServiceSante.getFirstSync(
            `SELECT id FROM ServiceSantes WHERE idService = ?`,
            [idService]
        );
        return !!exist;
    } catch (error) {
        console.error("❌ Erreur check exist:", error);
        return false;
    }
}

/* -------------------------  CREATE ------------------------- */
export async function createService(service) {
    try {
        
        
    console.log('le service du backend : ',service );

        // 🔹 Pas de doublon
        if (checkIfExists(service.idService)) {
            console.log(`⚠ Service "${idService}" existe déjà → insertion ignorée`);
            return true;
        }

        // 🔹 Vérification des champs obligatoires
        if (!service.nomEtablissement || service.latitude == null || service.longitude == null) {
            console.error("❌ Champs obligatoires manquants :", {
                nomEtablissement: service.nomEtablissement,
                latitude: service.latitude,
                longitude: service.longitude
            });
            return false;
        }

        const values = [
            service.idService,
            service.nomEtablissement,
            service.email || '',
            service.telephone || '',
            service.typeEtablissement || 'Non spécifié',
            service.adresse || '',
            service.ville || '',
            service.latitude,
            service.longitude,
            service.heureOuverture || '08:00',
            service.heureFermeture || '17:00',
            service.ouvert24h || 0,
            service.description || '',
            service.photoProfil || null,
            service.distance || 0,
            service.isActive !== undefined ? service.isActive : 1,
            service.lastUpdated ?? new Date().toISOString()
        ];

        // ✅ runSync pour les placeholders
        dbServiceSante.runSync(
            `INSERT INTO ServiceSantes (
                idService, nomEtablissement, email, telephone, typeEtablissement,
                adresse, ville, latitude, longitude, heureOuverture,
                heureFermeture, ouvert24h, description, photoProfil,
                distance, isActive, lastUpdated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
        );

        console.log(`✅ Service "${service.nomEtablissement}" inséré`);
        return true;

    } catch (error) {
        console.error("❌ Erreur création service:", error);
        console.error("📋 Données reçues:", service);
        return false;
    }
}

/* ------------------------- 🔹 READ ------------------------- */
export async function getUserService() {
    try {
        return dbServiceSante.getAllSync(`SELECT * FROM ServiceSantes;`);
    } catch (error) {
        console.error("❌ Erreur récupération services:", error);
        return [];
    }
}

export async function getServiceById(idService) {
    try {
        return dbServiceSante.getFirstSync(
            `SELECT * FROM ServiceSantes WHERE idService=?`,
            [idService]
        );
    } catch (error) {
        console.error("❌ Erreur récupération service:", error);
        return null;
    }
}

export async function getUserServices() {
    try {
        return dbServiceSante.getAllSync(`SELECT * FROM ServiceSantes;`);
    } catch (error) {
        console.error("❌ Erreur récupération IDs services:", error);
        return [];
    }
}

/* ------------------------- 🔹 UPDATE ------------------------- */
export async function updateService(idService, data) {
    try {
        // Vérifier si le service existe
        const exists = checkIfExists(idService);
        if (!exists) {
            console.warn(`⚠️ Service avec idService "${idService}" introuvable.`);
            return false;
        }

        // Préparer les champs à mettre à jour dynamiquement
        const fields = [];
        const values = [];

        for (const key in data) {
            if (data[key] !== undefined && key !== "idService") {
                fields.push(`${key} = ?`);
                values.push(data[key]);
            }
        }

        // Toujours mettre à jour lastUpdated
        fields.push("lastUpdated = ?");
        values.push(new Date().toISOString());

        // Ajouter idService pour le WHERE
        values.push(idService);

        // Construire la requête SQL
        const sql = `UPDATE ServiceSantes SET ${fields.join(", ")} WHERE idService = ?`;

        // Exécuter la mise à jour
        dbServiceSante.runSync(sql, values);

        console.log(`✅ Service "${idService}" mis à jour avec succès !`);
        return true;

    } catch (error) {
        console.error("❌ Erreur mise à jour service:", error);
        throw error;
    }
}


/* ------------------------- 🔹 DELETE ------------------------- */
export async function deleteService(idService) {
    try {
        dbServiceSante.execSync(
            `DELETE FROM ServiceSantes WHERE idService=?`,
            [idService]
        );

        console.log("🗑️ Service supprimé");
        return true;
    } catch (error) {
        console.error("❌ Erreur suppression service:", error);
        return false;
    }
}






















// -_-_-_-_-_-_-_-_-_-_-_-__URGENCES__-_-_-_-_-_-_-_-_-_-_-
export async function addUrgence(urgence) {
    console.log("🔄 Données urgence à sauvegarder :", urgence);

    try {
        await dbServiceSante.runAsync(
            `
            INSERT INTO Urgences (
                idUrgence,
                idPatient,
                idAssistant,
                intitule,
                description,
                priorite,
                statut,
                dateCreation,
                latitude,
                longitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
                urgence.idUrgence,
                urgence.idPatient,
                urgence.idAssistant,
                urgence.intitule,
                urgence.description,
                urgence.priorite,
                urgence.statut ,
                urgence.dateCreation,
                urgence.latitude,
                urgence.longitude,
            ]
        );

        console.log("✅ Urgence enregistrée avec succès !");
        return { success: true };
    } catch (error) {
        console.error("❌ Erreur lors de l'ajout de l'urgence :", error);
        return { success: false, error };
    }
}



// ➤ Mise à jour du statut d'une urgence après la réponse du backend
export async function updateStatusToAccep(updateData) {


    console.log("🔄 Données urgence à mettre à jour :", updateData);

    try {

        
        await dbServiceSante.runAsync(
            `
            UPDATE Urgences
            SET 
                statut = ?, 
                idAssistant = ?, 
                dateIntervention = ?
            WHERE idUrgence = ?
        `,
            [
                updateData.statut,
                updateData.idAssistant,
                updateData.dateIntervention,
                updateData.idUrgence
            ]
        );

        console.log("✅ Urgence mise à jour avec succès !");
        return { success: true };

    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour de l'urgence :", error);
        return { success: false, error };
    }
}

export async function getAllUrgence (){
    try {

        const urgences = await dbServiceSante.getAllSync(`SELECT id, idUrgence, idPatient, intitule, priorite, statut, dateIntervention FROM Urgences`);


        return { success: true, data: urgences };
    } catch (error) {
    

        console.error("❌ Erreur la recuperation de toutes les urgence dont le service participe  :", error);
        return { success: false, error };
    }
}


    export async function getUrgenceById (idUrgence){
        console.log("id de l'urgence a recupere est : ", idUrgence);

        try {
            const response = await dbServiceSante.getAllSync(
                `SELECT * from Urgences WHERE idUrgence = ?`,[idUrgence]
            );
            if (!response || response.length === 0) {
                console.warn("Aucune urgence trouvée pour l'id :", idUrgence);
                return null;
            }
            return response[0];
            
        } catch (error) {
            console.error(" \n Erreur lors de la recupreration de l urgence selectionner : ",error);
        }

    }











// pour la suppression 

export async function deleteUrgence(idUrgence) {
    try {
        await dbServiceSante.runAsync(
            `DELETE FROM Urgences WHERE idUrgence = ?`,
            [idUrgence]
        );

        console.log(`🗑️ Urgence ${idUrgence} supprimée.`);
        return { success: true };
    } catch (error) {
        console.error("❌ Erreur suppression urgence :", error);
        return { success: false, error };
    }
}

























// -_-_-_-_-_-_-_-_-_-_-_-__PATIENTS__-_-_-_-_-_-_-_-_-_-_-

export async function addPatient(patient) {
    console.log("\n\n\n\n\n\\n\n\ -_-_-_-_-_-_-_-_-_-_-_-__🔄 Données patient à sauvegarder :", patient);

    try {
        // 1️⃣ Vérifier si l'email existe déjà
        const existing = await dbServiceSante.getAllSync(
            "SELECT * FROM Patients WHERE email = ?",
            [patient.email]
        );

        if (existing) {
            console.log("⚠️ Email déjà utilisé :", patient.email);
            return {
                success: false,
                message: "Cet email est déjà enregistré."
            };
        }

        // 2️⃣ Insérer si l'email n'existe pas
        await dbServiceSante.runAsync(
            `INSERT INTO Patients 
                (idPatient, nom, prenom, dateNaissance, email, telephone, groupeSanguin, lieuResidence, maladieChronique, numeroUrgence, photoProfil, poids, taille, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patient.idPatient,
                patient.nom,
                patient.prenom,
                patient.dateNaissance,
                patient.email,
                patient.telephone,
                patient.groupeSanguin,
                patient.lieuResidence,
                patient.maladieChronique,
                patient.numeroUrgence,
                patient.photoProfil,
                patient.poids,
                patient.taille,
                patient.role ?? "patient"
            ]
        );

        console.log("\n\n\n\n\n\\n\n\ -_-_-_-_-_-_-_-_-_-_-_-_✅ Patient enregistré !");
        return { success: true };

    } catch (error) {
        console.error("❌ Erreur ajout patient :", error);
        return { success: false, error };
    }
}



export async function getPatientById(idPatient) {
    try {
        const patient = await dbServiceSante.getFirstAsync(
            `SELECT * FROM Patients WHERE idPatient = ? LIMIT 1`,
            [idPatient]
        );
        
        return patient ?? null;
    } catch (error) {
        console.error("❌ Erreur getPatientById :", error);
        return null;
    }
}


export async function deletePatient(idPatient) {
    try {
        await dbServiceSante.runAsync(
            `DELETE FROM Patients WHERE idPatient = ?`,
            [idPatient]
        );

        console.log(`🗑️ Patient ${idPatient} supprimé.`);
        return { success: true };
    } catch (error) {
        console.error("❌ Erreur suppression patient :", error);
        return { success: false, error };
    }
}


















//-_-_-_-_-_-_-_-_-_-_-_-_-_-____Message____-_-_-_-_-_-_-_-_-_-_-_-_-_-



export async function addNewMessage(message) {


    console.log(" +=+=+=_=_=_=-=-=-+_=-  • addNewMessage : message:", message);

    try {
        const update = await dbServiceSante.runAsync(
            `
            INSERT INTO Messages (
                idUrgence,
                sender,
                text,
                type,
                uri,
                fileName,
                duration,
                timestamp,
                status,
                idTmp
            ) VALUES (?, ?,?, ?, ?, ?, ?, ?, ?,?)
        `,
            [
                message.idUrgence,
                message.sender,
                message.text ?? null,
                message.type,
                message.uri ?? null,
                message.fileName ?? null,
                message.duration ?? null,
                message.timestamp,
                message.status ?? "envoi",
                message.idTmp ?? null,
            ]
        );

        const id = update?.lastID || message.idTmp; 
        console.log("💬 Message sauvegardé, pas besoin de idFirebase car id est auto increnmental je choisie id  :", id);
        
        console.log("💬 Message sauvegardé ");
        return { success: true };

    } catch (error) {
        console.error("❌ Erreur lors de l'ajout du message :", error);
        return { success: false, error };
    }
}



/**
 * 🟦 Mettre à jour le statut d’un message (envoye, lu, erreur…)
 */
export async function updateMessageStatut(idTmp, newStatus) {

    console.log(":=;=;=;=;=;==::::::::::::::::::: dans partie Service sante idTmp", idTmp); // id est l'ID réel du message (BDD/Firebase)

    try {
        const result = await dbServiceSante.runAsync( 
            // ✅ CORRECTION : Chercher par l'ID principal
            `UPDATE Messages SET status = ? WHERE idTmp = ?`, 
            [newStatus, idTmp]
        );

        if (result && result.changes > 0) {
            console.log(`📌 Statut message ${idTmp} → ${newStatus}. Lignes affectées: ${result.changes}`);
            return { success: true, changes: result.changes };
        } else {
            console.warn(`⚠️ Mise à jour échouée: ID ${idTmp} non trouvé dans la DB.`);
            return { success: false, reason: "No row updated", changes: 0 };
        }
    } catch (error) {
        console.error("❌ Erreur updateMessageStatus :", error);
        return { success: false, error };
    }
}
/**
 * 🟥 Supprimer un message
 */
export async function deleteMessageById(id) {
    try {
        await dbServiceSante.runAsync(
            `DELETE FROM Messages WHERE id = ?`,
            [id]
        );

        console.log(`🗑️ Message supprimé : ${id}`);
        return { success: true };

    } catch (error) {
        console.error("❌ Erreur deleteMessage :", error);
        return { success: false, error };
    }
}


export async function getAllMessageById(idUrgence) {
    try {

        // dbServiceSante.execAsync("DELETE FROM Messages");

        const messages = await dbServiceSante.getAllSync(
            `
            SELECT 
                m.*,        
                u.intitule  
            FROM Messages m
            LEFT JOIN Urgences u
                ON m.idUrgence = u.id
            WHERE m.idUrgence = ?
            ORDER BY m.timestamp ASC
            `,
            [idUrgence]
        );

        return { success: true, data: messages };

    } catch (error) {
        console.error("❌ Erreur getAllMessageById :", error);
        return { success: false, error, data: [] };
    }
}


// Récupérer toutes les urgences avec leur dernier message
export async function getServicesAvecUrgence() {
    try {
        const query = `
            SELECT 
                u.idUrgence, 
                u.intitule,
                u.description,
                u.priorite,
                u.statut,
                u.dateCreation,
                m.text AS lastMessageText,
                m.type AS lastMessageType,
                m.timestamp AS lastMessageTimestamp,
                m.sender AS lastMessageSender
            FROM Urgences u
            LEFT JOIN Messages m 
                ON m.idUrgence = u.idUrgence 
                AND m.timestamp = (
                    SELECT MAX(timestamp) 
                    FROM Messages 
                    WHERE idUrgence = u.idUrgence
                )
            ORDER BY u.dateCreation DESC
        `;

        const urgences = await dbServiceSante.getAllSync(query);

        const urgencs = await dbServiceSante.getAllSync(`SELECT * FROM Urgences`);

        return {success: true , data: urgences}; 
    } catch (error) {
        console.error("❌ Erreur récupération urgences avec dernier message :", error);
        return {success: false}; 
    }
}



export async function resetAndSaveLoginData(loginData) {



    try {
        ;
        
        //  Vider toutes les tables
        await clearAllTables();
        
        // Sauvegarder le service
        if (loginData.service) {

            
            await createService(loginData.service);
        }
        
        //  Sauvegarder les urgences et leurs données associées
        if (loginData.urgences && loginData.urgences.length > 0) {
            await saveUrgencesFromLogin(loginData.urgences);
        }
        
        //  Sauvegarder le token (optionnel - à utiliser avec AsyncStorage)
        // await AsyncStorage.setItem('authToken', loginData.token);
        
        console.log("✅ ===== RÉINITIALISATION ET SAUVEGARDE TERMINÉES =====\n");
        return { success: true };
        
    } catch (error) {
        console.error("❌ Erreur resetAndSaveLoginData:", error);
        return { success: false, error };
    }
}



async function clearAllTables() {
    try {
        console.log("🗑️ Suppression de toutes les données...");
        
        // Supprimer dans l'ordre (Messages avant Urgences à cause des FK potentielles)
        await dbServiceSante.runAsync(`DELETE FROM Messages`);
        console.log("   ✓ Messages supprimés");
        
        await dbServiceSante.runAsync(`DELETE FROM Urgences`);
        console.log("   ✓ Urgences supprimées");
        
        await dbServiceSante.runAsync(`DELETE FROM Patients`);
        console.log("   ✓ Patients supprimés");
        
        await dbServiceSante.runAsync(`DELETE FROM ServiceSantes`);
        console.log("   ✓ Services supprimés");
        
        
    } catch (error) {
        console.error("❌ Erreur clearAllTables:", error);
        throw error;
    }
}

async function savePatientFromUrgence(patient) {
    try {
        // Vérifier si le patient existe déjà
        const existing = await dbServiceSante.getFirstSync(
            `SELECT idPatient FROM Patients WHERE idPatient = ?`,
            [patient.idPatient]
        );
        
        if (existing) {
            console.log(`   ⚠️ Patient ${patient.nom} existe déjà, ignoré`);
            return;
        }
        
        await dbServiceSante.runAsync(
            `INSERT INTO Patients (
                idPatient, nom, prenom, dateNaissance, email, telephone,
                groupeSanguin, lieuResidence, maladieChronique, numeroUrgence,
                photoProfil, poids, taille, role
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patient.idPatient,
                patient.nom || '',
                patient.prenom || '',
                patient.dateNaissance || null,
                patient.email || '',
                patient.telephone || '',
                patient.groupeSanguin || '',
                patient.lieuResidence || '',
                patient.maladieChronique || '',
                patient.numeroUrgence || '',
                patient.photoProfil || '',
                patient.poids || null,
                patient.taille || null,
                patient.role || 'patient'
            ]
        );
        
        console.log(`   ✓ Patient ${patient.nom} ${patient.prenom} sauvegardé`);
        
    } catch (error) {
        console.error("❌ Erreur savePatientFromUrgence:", error);
        throw error;
    }
}

async function saveMessagesFromUrgence(messages) {
    try {
        console.log(` Sauvegarde de ${messages.length} message(s)...`);
        
        for (const message of messages) {
            await dbServiceSante.runAsync(
                `INSERT INTO Messages (
                    idUrgence,sender,
                    text, type, uri, fileName, duration, timestamp, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    message.idUrgence,
                    message.sender || 'patient',
                    message.text || null,
                    message.type || 'text',
                    message.uri || null,
                    message.fileName || null,
                    message.duration || null,
                    message.timestamp || new Date().toISOString(),
                    message.status || 'envoye'
                ]
            );
        }
        
        console.log(`   ✓ ${messages.length} message(s) sauvegardé(s)`);
        
    } catch (error) {
        console.error("❌ Erreur saveMessagesFromUrgence:", error);
        throw error;
    }
}




async function saveUrgencesFromLogin(urgences) {
    try {
        console.log(`🚨 Sauvegarde de ${urgences.length} urgence(s)...`);
        
        for (const urgence of urgences) {
            // 1️⃣ Sauvegarder le patient s'il existe
            if (urgence.patient) {
                await savePatientFromUrgence(urgence.patient);
            }
            
            // 2️⃣ Sauvegarder l'urgence
            await dbServiceSante.runAsync(
                `INSERT INTO Urgences (
                    idUrgence, idPatient, idAssistant, intitule, description,
                    priorite, statut, dateCreation, dateIntervention,
                    latitude, longitude
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    urgence.idUrgence,
                    urgence.idPatient,
                    urgence.idAssistant || null,
                    urgence.intitule || '',
                    urgence.description || '',
                    urgence.priorite || 'moyenne',
                    urgence.statut || 'en_attente',
                    urgence.dateCreation || new Date().toISOString(),
                    urgence.dateIntervention || null,
                    urgence.latitude || 0,
                    urgence.longitude || 0
                ]
            );
            
            console.log(`   ✓ Urgence "${urgence.intitule}" sauvegardée`);
            
            // 3️⃣ Sauvegarder les messages de l'urgence
            if (urgence.messages && urgence.messages.length > 0) {
                await saveMessagesFromUrgence(urgence.idUrgence, urgence.messages);
            }
        }
        
        console.log("✅ Toutes les urgences sauvegardées\n");
        
    } catch (error) {
        console.error("❌ Erreur saveUrgencesFromLogin:", error);
        throw error;
    }
}

export const getAllUrgenceId = async()=>{
    try {
        const idUrgences = await dbServiceSante.getAllSync(`SELECT idUrgence FROM Urgences`)
        return{success : true, data : idUrgences}
    } catch (error) {
        console.log("erreur lors de la recuperation des idUrgence");
        return{success : fales}
    }
}


export const clearAllLocalServiceData = async () => {
    try {
        console.log("🧹 Suppression de toutes les données locales (ServiceSante)…");

        await dbServiceSante.execAsync("DELETE FROM ServiceSantes;");
        await dbServiceSante.execAsync("DELETE FROM Urgences;");
        await dbServiceSante.execAsync("DELETE FROM Patients;");
        await dbServiceSante.execAsync("DELETE FROM Messages;");

        console.log("✅ Toutes les données locales ont été supprimées !");
        return { success: true };

    } catch (error) {
        console.error("❌ Erreur clearAllLocalServiceData :", error);
        return { success: false, error };
    }
};




/* ------------------------- 🔹 EXPORT ------------------------- */
export default {
    initServiceSante,
    createService,
    getUserService,
    getServiceById,
    getUserServices,
    updateService,
    deleteService,

    // ============Urgences========
    getAllUrgence,
    addUrgence,
    deleteUrgence,
    getUrgenceById,
    updateStatusToAccep,
    getAllUrgenceId,

    // ============Patients========

    addPatient,
    deletePatient,
    getPatientById,

    //==============messages========

    getAllMessageById,
    deleteMessageById,
    updateMessageStatut,
    addNewMessage,
    getServicesAvecUrgence,

    //+++++++++++ renitialisation de tout le donne car le login revient avec des info backend 

    resetAndSaveLoginData,
    clearAllLocalServiceData
    
};
