import { addNewMessage, addPatient, addUrgence } from "../routeRoom/serviceSanteRoomService";

import { 
    getAllMessageForUser,
    getAllUrgencesForUser,
    getAllpatientInURgenceForSServiceSante
} from "./routesFunction";


export default async function LoadServiceSantetData(idService) {
    console.log("🚀 [LoadServiceSantetData] --- DÉMARRAGE ---");
    console.log("🆔 ID Service :", idService);

    try {
        console.log("📥 Début chargement des données pour le service :", idService);

        // ===============================
        // 🔌 Vérification connexion backend
        // ===============================
        console.log("🌐 Vérification de la connexion backend...");

        console.log("Envoi au backend : ", { idUser: idService, role: "service" });


        const testConnexion = await getAllUrgencesForUser(idService, {
            idUser: idService,
            role: "service",
        });



        console.log("🔍 Réponse testConnexion :", testConnexion);

        if (!testConnexion || testConnexion.success === false) {
            console.log("❌ Connexion backend impossible — arrêt du chargement.");
            return;
        }

        // ===============================
        // 🧹 Nettoyage des données locales
        // ===============================
        console.log("🧹 Connexion OK → Nettoyage local...");

        if (typeof clearAllLocalServiceData === "function") {
            await clearAllLocalServiceData();
            console.log("🧼 Données locales nettoyées !");
        } else {
            console.log("⚠️ clearAllLocalServiceData est introuvable !");
        }

        // ===============================
        // 1️⃣ Récupération des urgences
        // ===============================
        console.log("🔍 conserver le test car il recupere les urgences  :", testConnexion);

        const urgences = testConnexion?.data?.data || [];

        console.log("📊 Nombre d'urgences trouvées :", urgences.length);

        if (urgences.length === 0) {
            console.log("⚠️ Aucun urgence trouvée pour ce service.");
            return;
        }

        // ===============================
        // 2️⃣ Boucle sur chaque urgence
        // ===============================
        for (const urgence of urgences) {
            console.log("\n\n===============================");
            console.log("🚨 URGENCE :", urgence.idUrgence);
            console.log("===============================\n");

            console.log("➡️ Données de l'urgence :", urgence);

            // 🔹 Sauvegarde locale de l'urgence
            console.log("💾 Sauvegarde locale de l'urgence...");

            const savedUrgence = await addUrgence(urgence);

            if (!savedUrgence) {
                console.log("❌ Échec sauvegarde de l'urgence :", urgence.idUrgence);
                continue;
            }

            console.log("✅ Urgence sauvegardée localement :", urgence.idUrgence);

            // ===============================
            // 3️⃣ Récupération des patients liés à l’urgence
            // ===============================

            console.log("👥 Récupération du/des patients pour l'urgence :", urgence.idUrgence);

            const patientResponse = await getAllpatientInURgenceForSServiceSante(
                urgence.idPatient // IMPORTANT : correction
            );

            console.log("🔍 Réponse patientResponse :", patientResponse);

            const patients = patientResponse?.data?.data || [];

            console.log("📊 Nombre de patients liés :", patients.length);

            if (patients.length > 0) {
                const patient = patients[0];

                console.log("➡️ Patient trouvé :", patient);

                const res = await addPatient(patient);

                if (res?.success) {
                    console.log("💊 Patient enregistré localement :", patient.nom);
                } else {
                    console.log("⚠️ Patient déjà existant ou erreur :", res?.error);
                }
            } else {
                console.log("⚠️ Aucun patient trouvé pour cette urgence.");
            }

            // ===============================
            // 4️⃣ Charger les messages
            // ===============================
            console.log("💬 Chargement des messages pour l’urgence :", urgence.idUrgence);

            const responseMessages = await getAllMessageForUser({
                idUrgence: urgence.idUrgence,
                userId: idService,
                userRole: "service",
            });

            console.log("🔍 Réponse messages :", responseMessages);

            const messages = responseMessages?.data?.data || [];

            console.log("📨 Nombre de messages trouvés :", messages.length);

            for (const msg of messages) {
                console.log("📝 Ajout message :", msg.idMessage || msg.text);

                await addNewMessage(msg);
            }

            console.log("📦 Messages enregistrés pour l'urgence :", urgence.idUrgence);
        }

        console.log("\n🎉 FIN — Toutes les données du service ont été correctement chargées !");
        console.log("🚀 [LoadServiceSantetData] --- TERMINÉ ---");

    } catch (error) {
        console.error("❌ ERREUR FATALE LoadServiceSantetData :", error);
    }
}
