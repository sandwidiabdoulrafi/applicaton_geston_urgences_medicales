





export default async function envoyerUrgenceServeur(idPatient, dataForm){

    const response = await fetch("https://ton-api/urgence", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            idPatient,
            ...dataForm
        })
    });

    return response.json(); // on retourne l'id ugence serveur 

}