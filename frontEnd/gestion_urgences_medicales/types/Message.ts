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
