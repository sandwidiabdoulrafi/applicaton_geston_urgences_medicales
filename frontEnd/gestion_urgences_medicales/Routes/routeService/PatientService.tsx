import { Alert } from "react-native";
import { addPatient } from "../routeRoom/serviceSanteRoomService";
import routesFunction, { changePatientPassword, updatePatient } from "../routesBackend/routesFunction";
import roomPatient, { resetAndSaveLoginDataPatient } from "../routeRoom/roomPatient";


export const patientSing = async (singData) => {
    console.log('=== DONNÉES D\'INSCRIPTION === :::::   ',singData);
    try {
        const response = await routesFunction.createPatient(singData);

        if (response.data) {
            return { success: true };
        }
    } catch (error) {
        console.error("Erreur patientSing:", error);
        return { success: false };
    }
}


export const patientLogin = async (loginData) => {
    console.log("📡 Envoi de la requête loginPatient au backend...");

    try {
        const response = await routesFunction.loginPatient(loginData);

        console.log("📨 Réponse brute backend :", response.data);

        if (!response.data?.success) {
            console.warn("⚠️ Connexion refusée :", response.data?.message);
            return {
                success: false,
                message: response.data?.message || "Erreur de connexion"
            };
        }

        console.log("✅ Connexion validée par le backend !");
        console.log("📍 Données patient reçues :", response.data.patient);

        // 🎯 Persist dans ROOM
        try {
            console.log("💾 Sauvegarde des données patient dans ROOM...");
            await resetAndSaveLoginDataPatient(response.data);
            console.log("💾 Données patient sauvegardées avec succès !");
        } catch (roomError) {
            console.error("❌ Erreur lors de l'enregistrement dans ROOM :", roomError);
        }

        return{
            success: true,
            data: {
                id: response.data.patient.idPatient,
                email: response.data.patient.email,
                role: "patient",  
                token: response.data.token   
            }
        }



    } catch (error) {
        console.error("❌ ERREUR API patientLogin :", error);
        return {
            success: false,
            message: "Erreur réseau ou serveur"
        };
    }
};





export const patientEditInfo = async (idPatient, editData) => {

    try {
        const response = await updatePatient(idPatient, editData);

        if (response && response.status === 200 && response.data) {
            
            try {
                
                const reponseSave = await roomPatient.updatePatient(idPatient, editData);

                if (reponseSave.success) {
                    
                    return {
                        success: true,
                    };
                } else {
                    console.error("❌ Échec update Room :", reponseSave);
                }

            } catch (error) {
                console.error("❌ Erreur lors du save dans Room :", error);
                return { success: false };
            }

        } else {
            console.error("❌ Le backend n'a pas retourné de données valides :", response);
        }

        console.log("⚠️ patientEditInfo terminé avec échec");
        return { success: false };

    } catch (error) {
        console.error("❌ Erreur lors de l'envoi au backend :", error);
        return { success: false };
    }
};

export const changePassword = async (passwordData) => {
    console.log("\n🔐 Début de changePassword (frontend)");
    console.log("📥 Données reçues :", passwordData);

    try {
        console.log("🚀 Envoi de la requête au backend...");
        const response = await changePatientPassword(passwordData);

        console.log("📥 Réponse reçue du backend :", response);

        if (response && response.data) {
            if (response.data.success) {
                console.log("✅ Mot de passe changé avec succès :", response.data.message);
                return { success: true, message: response.data.message };
            } else {
                console.warn("⚠️ Backend a retourné un échec :", response.data.message);
                return { success: false, message: response.data.message };
            }
        } else {
            console.error("❌ Réponse backend invalide :", response);
            return { success: false, message: "Réponse backend invalide" };
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'envoi au backend :", error);
        return { success: false, message: error.message || "Erreur inconnue" };
    }
};






export const LogOutPatient = async() => {
    try {
        const response = await routesFunction.logoutPatient();
        
        if (response.status === 200 && response.data.success) {
            console.log("Deconnexion reuissi.");
            return {
                success: true
            };
        } else {
            return {
                success: false,
            };
        }
    } catch (error) {
        console.error("❌ Erreur LogOutService:", error);
        return {
            success: false
        };
    }
}




export default {
    patientSing,
    patientLogin,
    patientEditInfo,
    changePassword,
    LogOutPatient,
}