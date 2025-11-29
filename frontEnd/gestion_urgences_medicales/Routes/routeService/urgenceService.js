import roomUrgences from "../routeRoom/roomUrgences";
import * as routesFunction from "../routesBackend/routesFunction";
import roomPatient from '../routeRoom/roomPatient'




// Toujours en haut :
let idPatient = null;

const loadIdPatient = async () => {
    const idPatientroom = await roomPatient.getAllPatientsId();
    idPatient = idPatientroom[0]?.idPatient;
};

loadIdPatient();

// -------------------- CRÉER UNE URGENCE --------------------
const createUrgence = async (dataForm) => {

    

    try {
        // Étape 1 : envoyer au backend
        const response = await routesFunction.createUrgence({
            idPatient,
            ...dataForm,
        });

       
        // Étape 2 : sauvegarder localement dans Room

        const urgenceData = response.data?.data; // 🔹 seulement "data"

        if (urgenceData) {
            await roomUrgences.addNewUgenceLocal(idPatient, {
                ...urgenceData,
                synced: true,
            });
        }

        
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ Erreur lors de la création de l'urgence :", error.message);

        // Enregistrer en local même si le backend échoue
        await roomUrgences.addNewUgenceLocal(idPatient, {
            ...dataForm,
            synced: false,
        });

        return { success: false, error: error.message };
    }
};



// -------------------- METTRE À JOUR UNE URGENCE --------------------

const updateUrgence = async (data) => {

    try {
        // Étape 1 : mise à jour backend
        const response = await routesFunction.updateUrgence(data);


        console.log("✅ =====================================================================\n\n\n\n\n\n\n  avant la sauvegarde Local : ", response.data);
        // Étape 2 : mise à jour locale
        await roomUrgences.updateUgenceId(response.data);

        
        return { success: true };
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error.message);

        // Mise à jour uniquement locale si erreur réseau
        await roomUrgences.updateUgenceId(idPatient, {
            ...data,
            synced: false,
        });

        return { success: false, error: error.message };
    }
};



// -------------------- SUPPRIMER UNE URGENCE --------------------
const deleteThisUrgence = async (idUrgence, idLocal) => {
    console.log("🧹 Suppression de l'urgence :", idUrgence, " id local : ", idLocal);

    try {
        // Étape 1 : suppression backend
        await routesFunction.deleteUrgence({ idPatient, idUrgence });

        // Étape 2 : suppression locale
        await roomUrgences.deleteUrgence(idLocal);

        console.log("✅ Urgence supprimée avec succès !");
        return { success: true };
    } catch (error) {
        console.error("❌ Erreur lors de la suppression :", error.message);
        return { success: false, error: error.message };
    }
};



// -------------------- RÉCUPÉRER TOUTES LES URGENCES --------------------
const getAllUrgences = async () => {
    try {
        // Étape 1 : récupérer depuis le backend
        const response = await routesFunction.getAllUrgences();
        const urgences = response.data || [];

        // Étape 2 : synchroniser localement
        // await roomUrgences.syncUrgencesFromBackend(urgences);

        console.log("📡 Urgences récupérées :", urgences.length);
        return urgences;
    } catch (error) {
        console.error("⚠️ Erreur réseau, récupération locale :", error.message);

        const idPatient = await roomPatient.getAllPatientsId();

        // En cas d’erreur, on récupère depuis la base locale
        const urgencesLocal = await roomUrgences.getAllUrgencesLocal(idPatient);
        return urgencesLocal;
    }
};



// -------------------- SERVICE INTERVIENT SUR UNE URGENCE --------------------
const serviceIntervient = async (idService, idUrgence) => {
    console.log(`🚑 Service ${idService} intervient sur l'urgence ${idUrgence}`);

    try {
        const response = await routesFunction.serviceIntervient({
            idService,
            idUrgence,
        });

        console.log("✅ Intervention enregistrée :", response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ Erreur lors de l'intervention :", error.message);
        return { success: false, error: error.message };
    }
};



// -------------------- EXPORT DES FONCTIONS --------------------
export default {
    createUrgence,
    updateUrgence,
    deleteThisUrgence,
    getAllUrgences,
    serviceIntervient,
};
