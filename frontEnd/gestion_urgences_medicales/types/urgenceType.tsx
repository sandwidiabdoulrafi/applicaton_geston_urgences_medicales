interface UrgenceSevice {
    id: number;
    idUrgence: string; 
    idPatient: string; 
    intitule: string; 
    priorite?: string;
    statut: string; 
    dateIntervention?: string;
}









interface UrgenceComplet {
    id: number;                   
    idUrgence: string;           
    idPatient: string;
    idAssistant?: string;      
    intitule: string;            
    description?: string;         
    priorite?: string;
    statut: string;  
    dateCreation?: string;    
    dateIntervention?: string;    
    latitude?: number;
    longitude?: number;
}



export { UrgenceComplet, UrgenceSevice };
