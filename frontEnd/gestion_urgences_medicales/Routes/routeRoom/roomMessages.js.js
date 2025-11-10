import db from './dbRoom';

export async function initMessages() {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS Messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idMessage TEXT UNIQUE NOT NULL,
                idUrgence INTEGER NOT NULL,
                text TEXT,
                type TEXT NOT NULL,
                uri TEXT,
                fileName TEXT,
                duration REAL,
                sender TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT DEFAULT 'envoi',
                FOREIGN KEY (idUrgence) REFERENCES Urgences(id) ON DELETE CASCADE,
                CHECK (type IN ('text', 'image', 'video', 'document', 'audio')),
                CHECK (sender IN ('patient', 'assistant')),
                CHECK (status IN ('envoi', 'envoye', 'erreur', 'lu'))
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
 * Valide que l'ID est un entier positif valide
 */
function validateId(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
        throw new Error(`ID invalide: ${id}`);
    }
    return numId;
}

/**
 * Valide le texte d'un message
 */
function validateMessageText(text, maxLength = 5000) {
    if (typeof text !== 'string') {
        throw new Error('Le texte doit être une chaîne de caractères');
    }
    if (text.length > maxLength) {
        throw new Error(`Le texte dépasse la longueur maximale de ${maxLength} caractères`);
    }
    return text.trim();
}

/**
 * Valide le type de message
 */
function validateMessageType(type) {
    const validTypes = ['text', 'image', 'video', 'document', 'audio'];
    if (!validTypes.includes(type)) {
        throw new Error(`Type de message invalide: ${type}`);
    }
    return type;
}

/**
 * Récupère les urgences avec discussions (SÉCURISÉ)
 */
async function getUrgencesAvecDiscussions() {
    try {
        // Utilisation de requête préparée implicite via getAllSync
        const result = db.getAllSync(`
            SELECT 
                U.id AS idUrgence,
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
                MAX(M.timestamp) AS dernierMessage
            FROM Urgences U
            JOIN Messages M ON U.id = M.idUrgence
            LEFT JOIN ServiceSante S ON U.idAssistant = S.idAssistant
            GROUP BY U.id
            ORDER BY dernierMessage DESC;
        `);
        return result || [];
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des urgences:", error);
        return [];
    }
}

/**
 * Récupère les messages d'une urgence (SÉCURISÉ avec paramètres bindés)
 */
export async function getMessagesByUrgence(idUrgence) {
    try {
        // Validation de l'ID
        const validId = validateId(idUrgence);
        
        // Utilisation de requête préparée avec paramètres bindés
        const messages = db.getAllSync(
            `SELECT 
                idMessage,
                idUrgence,
                text,
                type,
                uri,
                fileName,
                duration,
                sender,
                timestamp,
                status
            FROM Messages
            WHERE idUrgence = ?
            ORDER BY timestamp ASC`,
            [validId]
        );
        
        return messages || [];
    } catch (error) {
        console.error("❌ Erreur récupération messages:", error);
        return [];
    }
}

/**
 * Ajoute un nouveau message (SÉCURISÉ)
 */
export async function addMessage(messageData) {
    try {
        // Validation des données
        const validId = validateId(messageData.idUrgence);
        const validType = validateMessageType(messageData.type);
        
        if (messageData.type === 'text' && messageData.text) {
            messageData.text = validateMessageText(messageData.text);
        }
        
        // Génération d'un ID unique si non fourni
        const idMessage = messageData.idMessage || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Insertion avec paramètres bindés
        const result = db.runSync(
            `INSERT INTO Messages (
                idMessage, idUrgence, text, type, uri, fileName, 
                duration, sender, timestamp, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                idMessage,
                validId,
                messageData.text || null,
                validType,
                messageData.uri || null,
                messageData.fileName || null,
                messageData.duration || null,
                messageData.sender,
                messageData.timestamp || new Date().toISOString(),
                messageData.status || 'envoi'
            ]
        );
        
        return {
            success: true,
            idMessage,
            insertedId: result.lastInsertRowId
        };
    } catch (error) {
        console.error("❌ Erreur ajout message:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Met à jour le statut d'un message (SÉCURISÉ)
 */
export async function updateMessageStatus(idMessage, newStatus) {
    try {
        const validStatuses = ['envoi', 'envoye', 'erreur', 'lu'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Statut invalide: ${newStatus}`);
        }
        
        const result = db.runSync(
            `UPDATE Messages 
            SET status = ? 
            WHERE idMessage = ?`,
            [newStatus, idMessage]
        );
        
        return { success: true, changes: result.changes };
    } catch (error) {
        console.error("❌ Erreur mise à jour statut:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprime un message (SÉCURISÉ)
 */
export async function deleteMessage(idMessage) {
    try {
        const result = db.runSync(
            `DELETE FROM Messages WHERE idMessage = ?`,
            [idMessage]
        );
        
        return { success: true, deleted: result.changes > 0 };
    } catch (error) {
        console.error("❌ Erreur suppression message:", error);
        return { success: false, error: error.message };
    }
}

export default {
    getMessagesByUrgence,
    initMessages,
    getUrgencesAvecDiscussions,
    addMessage,
    updateMessageStatus,
    deleteMessage,
    validateId,
    validateMessageText,
    validateMessageType
};