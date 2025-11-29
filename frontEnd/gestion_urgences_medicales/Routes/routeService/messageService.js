
import * as routesFunction from "../routesBackend/routesFunction";

const uploadMedia = async(data)=>{

    console.log("\n\n frond send media to backend : ", data);


    try {
        const response = await  routesFunction.uploadMediaMessage(data)
        if(!response.ok){

            console.log("\n\n\n response backend : ", response.data);

            return { success: true, data: response.data };
        }
    } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde du fichier seulement :", error.message);
    }
}




export default {
    uploadMedia,
}