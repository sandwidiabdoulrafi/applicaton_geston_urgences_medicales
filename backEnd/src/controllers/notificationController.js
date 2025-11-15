const { db } = require("../config/firebaseConfig");

const getNotif = async (req, res) => {
    try {
        const snapshot = await db.collection("notifications").get();
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error("❌ Erreur récupération notifications :", error);
        res.status(500).json({ success: false, message: "Erreur lors de la récupération" });
    }
};

const updateNotif = async (req, res) => {
    try {
        const { id, ...data } = req.body;
        await db.collection("notifications").doc(id).update(data);
        res.status(200).json({ success: true, message: "Notification mise à jour" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur lors de la mise à jour" });
    }
};

const deleteNotif = async (req, res) => {
    try {
        const { id } = req.body;
        await db.collection("notifications").doc(id).delete();
        res.status(200).json({ success: true, message: "Notification supprimée" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
    }
};

const markAsRead = async(req,res)=>{
    try{

    }catch(error){

    }
}



const markAllAsRead = async(req,res)=>{
    try{
        
    }catch(error){
        
    }
}




module.exports = { getNotif, updateNotif, deleteNotif };
