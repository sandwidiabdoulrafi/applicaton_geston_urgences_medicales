const axios = require("axios");

exports.getDirections = async (req, res)=>{



    try{

        // on recuper les deux positions(logitude et l'altitude du patient et celui de service de sante ) venue du frontend 
        const { originLat, originLng, destLat, destLng} = req.key;

        if( !originLat || !originLng || !destLat || !destLng){
            return res.status(400).json({ message: "Paramètres manquants" });
        }


        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${apiKey}&mode=driving`;

        const responseGoogle = await axios.get(url);

        if(responseGoogle.data.status!=="OK"){
            return res.status(500).json({ message: response.data.status });
        }

        // on retourne les piont de l’itinéraire

        const points = response.data.routes[0].overview_polyline.points;

        console.log("_-_-_-_-_-_-_ points de l’itinéraire : ", points);

        // envoyer au frontend
        res.json({points});

        
    } catch(error){
        console.error(error);
        res.status(500).json({ message: "Erreur serveur" });
    }

}