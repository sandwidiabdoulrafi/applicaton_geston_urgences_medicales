export default interface UrgenceDetail {
    id: number;
    idUrgence?: number;
    idPatient: number;
    idAssistant?: number;
    intitule: string;
    description: string;
    priorite: 'vitale' | 'grave' | 'consultation';
    statut: 'en_attente' | 'en_cours' | 'terminee';
    dateCreation: string;
    latitude?: number;
    longitude?: number;
}

