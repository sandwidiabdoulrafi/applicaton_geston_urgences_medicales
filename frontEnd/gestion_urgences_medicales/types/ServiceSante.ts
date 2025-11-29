export default interface ServiceSante {
    id: number; 
    idEtablissement: string,
    nomEtablissement: string; 
    typeEtablissement: string; 
    telephone: string; 
    adresse: string; 
    ville: string; 
    email:string, 
    ouvert24h: boolean; 
    heureOuverture: string;
    heureFermeture: string;
    description: string;
    photoProfil: string;
    latitude: number;
    isActive: boolean;
    longitude: number;
    lastUpdated:  Date;
    motDePasse: string;
}
