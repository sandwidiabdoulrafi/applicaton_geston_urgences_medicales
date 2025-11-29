export default interface Discussion {
    unreadCount: number;
    idUrgence: number;
    intitule: string;
    description: string;
    statut: string;
    priorite: string;
    idAssistant: number;
    idPatient: number;
    nomEtablissement?: string;
    typeEtablissement?: string;
    telephone?: string;
    email?: string;
    dernierMessage: string;
}