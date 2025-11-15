const { db } = require("../config/firebaseConfig");

// Vérifie la connexion à Firestore
const checkFirebaseConnection = async (req, res) => {
    try {

        await  db.collection("patients").add({
            idPatient: "P_12345",
            nom: "Sanogo",
            prenom: "Rafi",
            dateNaissance: "1998-05-10",
            email: "rafi@example.com",
            motDePasse: "motdepasseHashe",
            telephone: "+22670123456",
            lieuResidence: "Ouagadougou",
            photoProfil: "https://url/photo.jpg",
            groupeSanguin: "O+",
            taille: "1.80",
            poids: "70",
            maladieChronique: true,
            latitude: 12.3714,
            longitude: -1.5197,
            dateInscription: "2025-11-10T09:30:00Z",
            derniereMiseAJour: "2025-11-10T09:30:00Z"
        });


        await db.collection("servicesSantes").add({
            idService: "S_001",
            nomEtablissement: "Clinique Les Étoiles",
            email: "contact@etoiles.com",
            motDePasse: "motdepasseHashe",
            telephone: "+22660123456",
            typeEtablissement: "Pharmacie",
            adresse: "Quartier Patte d’Oie",
            ville: "Ouagadougou",
            latitude: 12.358,
            longitude: -1.512,
            heureOuverture: "08:00",
            heureFermeture: "22:00",
            ouvert24h: false,
            description: "Service d’urgence 24/7 avec ambulances disponibles.",
            photoProfil: "https://url/photo.png",
            distance: 1.2,
            isActive: true,
            lastUpdated: "2025-11-10T09:30:00Z"
        });

        await db.collection("urgences").add({
            idUrgence: "U_0001",
            idPatient: "P_12345",
            idAssistant: "S_001",
            intitule: "Crise cardiaque présumée",
            description: "Douleurs thoraciques sévères et essoufflement",
            dateCreation: "2025-11-10T09:31:00Z",
            statut: "en attente",
            priorite: "haute",
            latitude: 12.361,
            longitude: -1.523
        });

        await db.collection("messages").add({
            idMessage: "M_001",
            idUrgence: "U_0001",
            text: "Ambulance en route.",
            type: "text",
            uri: null,
            fileName: null,
            duration: null,
            sender: "assistant",
            timestamp: "2025-11-10T09:32:00Z",
            status: "envoye"
        });

        await db.collection("notifications").add({
            idNotification: "N_001",
            idUrgence: "U_0001",
            titre: "Nouvelle urgence détectée",
            message: "Un patient vient de signaler une urgence près de votre position.",
            type: "alerte",
            timestamp: "2025-11-10T09:33:00Z",
            isRead: false
        })




    } catch (error) {
        console.error("❌ Erreur de connexion Firestore :", error);
        res.status(500).json({ success: false, message: "Erreur de connexion à Firestore", error: error.message });
    }
};

module.exports = { checkFirebaseConnection };
