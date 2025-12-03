import db from './dbRoom';

export async function initMessages() {
    try {
    

        db.execSync(`
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
                status TEXT DEFAULT 'envoi' CHECK(status IN ('envoi', 'envoye', 'erreur', 'lu')),
                idTmp TEXT UNIQUE
            );
        `);
        

        db.execSync(`
            CREATE INDEX IF NOT EXISTS idx_messages_urgence 
            ON Messages(idUrgence, timestamp ASC);
        `);

        console.log("✅ Table 'Messages' créée/vérifiée avec succès");
    } catch (error) {
        console.error("❌ Erreur création table Messages:", error);
        throw error;
    }
}


/**
 * Récupère uniquement les urgences qui ont au moins une discussion
 */
export async function getUrgencesAvecDiscussions() {
    try {
        const result = db.getAllSync(`
            SELECT 
                U.idUrgence,
                U.intitule,
                U.description,
                U.statut,
                U.priorite,
                U.idAssistant,
                U.idPatient,
                S.nomEtablissement,
                S.typeEtablissement,
                S.telephone,
                S.email,
                COUNT(M.id) as messageCount,
                MAX(M.timestamp) AS dernierMessage
            FROM Urgences U
            LEFT JOIN Messages M ON U.idUrgence = M.idUrgence
            LEFT JOIN ServiceSante S ON U.idAssistant = S.idService
            GROUP BY U.idUrgence
            HAVING messageCount > 0
            ORDER BY dernierMessage DESC
        `);

        return {success: true, data: result || []};

    } catch (error) {
        console.error("❌ Erreur lors de la récupération des urgences:", error);
        return {success: false, data: []};
    }
}

/**
 * Récupère les messages d'une urgence 
 */
export async function getMessagesByUrgence(idUrgence) {
    try {

        // db.execAsync("DELETE FROM Messages");

        
        const messages = db.getAllSync(
            `SELECT 
                id,
                idUrgence,
                text,
                type,
                uri,
                fileName,
                duration,
                sender,
                timestamp,
                status,
                idTmp
            FROM Messages
            WHERE idUrgence = ?
            ORDER BY timestamp ASC`,
            [idUrgence]
        );

        return{ success: true, data: messages || [] };

    } catch (error) {
        console.error("❌ Erreur récupération messages:", error);
        return  { success: false, data: [] };
    }
}


/**
 * Ajoute un message
 */
export async function addMessage(message) {
    try {

        // await db.execAsync(`
        //     ALTER TABLE Messages ADD COLUMN idTmp TEXT;
        // `);
        
        const result = await db.runAsync(
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
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
                message.idTmp
            ]
        );

        console.log("💬 Message sauvegardé, ID inséré:", result.lastInsertRowId)
        return { success: true,id: result.lastInsertRowId };

    } catch (error) {
        console.error("❌ Erreur lors de l'ajout du message :", error);
        return { success: false, error };
    }
}


/**
 * Met à jour le statut d'un message
 */
// Dans roomMessages.js (ou serviceSanteRoomService.js)

export async function updateMessageStatus(id, newStatus) {

    console.log(" dans partie patient sante id", id); 

    try {
        // La méthode runAsync retourne un objet résultat
        const result = await db.runAsync( 
            `UPDATE Messages SET status = ? WHERE idTmp = ?`,
            [newStatus, id]
        );

        // ✅ Vérification du nombre de lignes modifiées (changes)
        if (result && result.changes > 0) {
            console.log(`📌 Statut message ${id} → ${newStatus}. Lignes affectées: ${result.changes}`);
            return { success: true, changes: result.changes };
        } else {
            // Cela signifie que l'idTmp n'a pas été trouvé (0 lignes modifiées)
            console.warn(`⚠️ Mise à jour échouée: idTmp ${id} non trouvé dans la DB.`);
            return { success: false, reason: "No row updated", changes: 0 };
        }

    } catch (error) {
        console.error("❌ Erreur updateMessageStatus :", error);
        return { success: false, error };
    }
}


/**
 * Supprime un message 
 */
export async function deleteMessage(id) {
    try {
        await db.runAsync(
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

export default {
    getMessagesByUrgence,
    initMessages,
    getUrgencesAvecDiscussions,
    addMessage,
    updateMessageStatus,
    deleteMessage,
};
