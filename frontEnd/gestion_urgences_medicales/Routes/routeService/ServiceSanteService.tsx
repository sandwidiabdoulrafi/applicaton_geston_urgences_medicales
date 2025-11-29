
import { createService, resetAndSaveLoginData, updateService } from "../routeRoom/serviceSanteRoomService";
import * as routesFunction from "../routesBackend/routesFunction";



const getServiceSanteProximity = async(position)=>{


    try {
        const response= await routesFunction.getAllServicesProximity(position);

        return response.data;
    } catch (error) {
        console.error('erreur lors de la recuperation des service de sante dans les poximite : ', error)
    }
}

export const serviceSanteSing = async(singData)=>{


    console.log('=== DONNÉES D\'INSCRIPTION service de sante  === :::::   ',singData);
    try {
        const response = await routesFunction.createService(singData);
        if(response.data){
            
            return { success: true };
        }
        console.log("\n\\n\n\n =-=-=-=-=-= La reponse du backend : ", response.data)
    } catch (error) {
        console.error
        return { success: false };
    }
}

export const serviceSanteLogin = async(singData)=>{
    try {
        const response = await routesFunction.loginService(singData);
        if(response.data){
            // faire persiter dans le room
            console.log(" response.data response du : ", response.data);
            try {
                await resetAndSaveLoginData(response.data);
                
            } catch (error) {
                
            console.error
            }
            
        }
        console.log(" response.data response du : ", );
        return{
            success: true,
            data: {
                id: response.data.service.idService,
                email: response.data.service.email,
                role: "service",
                token: response.data.token   
            }
        }
    } catch (error) {
        
        console.error
        return{
            success: false,
            message: "Erreur réseau ou serveur"
        }
    }
}



export const saveEditServiceProfil = async(formData) => {
    try {
        const response = await routesFunction.updateService(formData);

        if (response.status === 200 && response.data.success) {
            console.log("✅ Réponse du backend :", response.data);
            
            try {
                
                await updateService(formData.idService, {
                    nomEtablissement: formData.nomEtablissement,
                    typeEtablissement: formData.typeEtablissement,
                    telephone: formData.telephone,
                    email: formData.email,
                    adresse: formData.adresse,
                    ville: formData.ville,
                    description: formData.description,
                    ouvert24h: formData.ouvert24h ? 1 : 0,
                    heureOuverture: formData.heureOuverture,
                    heureFermeture: formData.heureFermeture,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    photoProfil: formData.photoProfil,
                    lastUpdated: new Date().toISOString()
                });
                
                console.log("✅ Base de données locale mise à jour");
                
            } catch (error) {
                console.error("❌ Erreur mise à jour locale:", error);
                throw error;
            }
        }
        
        return {
            success: true,
        }
        
    } catch (error) {
        console.error("❌ Erreur saveEditServiceProfil:", error);
        return {
            success: false,
        }
    }
}

export const changePassWord = async(formData) => {
    try {
        const response = await routesFunction.updateChangePassword(formData);
        
        if (response.status === 200 && response.data.success) {
            console.log("✅ Mot de passe changé:", response.data);
            return {
                success: true,
                message: response.data.message
            };
        } else {
            return {
                success: false,
                message: response.data?.message || "Erreur lors du changement de mot de passe"
            };
        }
    } catch (error) {
        console.error("❌ Erreur changePassWord:", error);
        return {
            success: false,
            message: "Erreur réseau ou serveur"
        };
    }
}

export const LogOutService = async() => {
    try {
        const response = await routesFunction.logoutService();
        
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
    serviceSanteSing,
    getServiceSanteProximity,
    serviceSanteLogin,
    saveEditServiceProfil,
    changePassWord,
    LogOutService,
}