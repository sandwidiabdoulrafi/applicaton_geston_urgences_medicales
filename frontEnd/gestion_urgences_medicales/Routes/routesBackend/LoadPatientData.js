import { 
    getAllMessageForUser,
    getAllUrgencesForUser,
    getAllServiceInURgenceForPatient
} from "../routesBackend/routesFunction";

import { addMessage } from "../routeRoom/roomMessages.js";
import { addNewUgenceLocal } from "@/Routes/routeRoom/roomUrgences.js";
import { savePatientServices } from "@/Routes/routeRoom/roomPatient.js";
import { clearAllLocalData } from "@/Routes/routeRoom/roomPatient.js";

export default async function LoadPatientData(idPatient) {
    try {
        console.log("📥 Chargement des données pour le patient :", idPatient);

        // ===============================
        // 🔌 Vérification de la connexion backend
        // ===============================
        console.log("🌐 Vérification connexion backend…");

        const testConnexion = await getAllUrgencesForUser(idPatient, {
            idUser: idPatient,
            role: "patient"
        });

        if (!testConnexion || testConnexion.success === false) {
            console.log("❌ Pas de connexion backend – STOP.");
            return;
        }

        // ===============================
        // 🧹 Connexion OK → nettoyer local
        // ===============================
        await clearAllLocalData();


        // ===============================
        // 1️⃣ RÉCUPÉRATION DES URGENCES
        // ===============================
        console.log("🔄 Récupération des urgences liées au patient");

        const urgences = testConnexion?.data?.data || [];

        if (urgences.length === 0) {
            console.log("⚠️ Aucune urgence trouvée pour ce patient.");
            return;
        }

        // ===============================
        // 2️⃣ POUR CHAQUE URGENCE
        // ===============================
        for (const urgence of urgences) {
            console.log("📌 Urgence trouvée :", urgence);

            await addNewUgenceLocal(idPatient, urgence);


            // ===============================
            // 3️⃣ Charger les services associés
            // ===============================
            const servicesResponse =
                await getAllServiceInURgenceForPatient(urgence.idAssistant);

            const services = servicesResponse.data?.data || [];

            if (services.length > 0) {
                const service = services[0];

                const res = await savePatientServices(service);

                if (res.status === "saved") {
                    console.log("💊 Service enregistré :", service.nomEtablissement);
                } else if (res.status === "exists") {
                    console.log("⚠️ Service déjà existant :", service.nomEtablissement);
                }
            }


            // ===============================
            // 4️⃣ Charger les messages
            // ===============================
            console.log("💬 Chargement messages pour l'urgence :", urgence.idUrgence);

            const responseMessages =
                await getAllMessageForUser({ idUrgence: urgence.idUrgence });

            const messages = responseMessages?.data?.data || [];

            for (const msg of messages) {
                await addMessage(msg);
            }
        }

        console.log("🎉 Données patient rechargées sans redondance !");
    } catch (error) {
        console.error("❌ Erreur LoadPatientData :", error);
    }
}
