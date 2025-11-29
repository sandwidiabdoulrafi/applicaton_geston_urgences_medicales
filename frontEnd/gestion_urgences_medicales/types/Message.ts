export default interface Message {
    idMessage: string;
    idUrgence: number;
    text?: string;
    type: 'text' | 'image' | 'video' | 'document' | 'audio';
    uri?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    sender: 'patient' | 'assistant';
    timestamp: string;
    status: 'envoi' | 'envoye' | 'erreur' | 'lu';
}




// export default interface NewMessage {
//     id?: number; 
//     idMessage: string; // UUID
//     idUrgence: number;
//     idEmeteur: number;

//     sender: "patient" | "service";

//     text?: string | null;

//     type: "text" | "image" | "video" | "document" | "audio";

//     uri?: string | null;      
//     fileName?: string | null; 
//     duration?: number | null; 

//     timestamp: string; 
//     status: "envoi" | "envoye" | "erreur" | "lu";
// }
