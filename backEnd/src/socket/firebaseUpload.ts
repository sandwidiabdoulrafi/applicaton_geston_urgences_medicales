

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: "votre-api-key",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "votre-app-id"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload un fichier vers Firebase Storage
 */
export const uploadFileToFirebase = async (
    uri: string,
    idUrgence: number,
    fileType: 'image' | 'video' | 'document' | 'audio',
    onProgress?: (progress: number) => void
): Promise<{ url: string; fileName: string; size: number }> => {
    try {
        // 1. Convertir l'URI en Blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // 2. Générer un nom de fichier unique
        const timestamp = Date.now();
        const extension = uri.split('.').pop() || 'jpg';
        const fileName = `${fileType}_${timestamp}.${extension}`;
        const storagePath = `messages/${idUrgence}/${fileName}`;

        // 3. Créer la référence Storage
        const storageRef = ref(storage, storagePath);

        // 4. Upload avec suivi de progression
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(Math.round(progress));
                    }
                    console.log(`📤 Upload: ${Math.round(progress)}%`);
                },
                (error) => {
                    console.error('❌ Erreur upload:', error);
                    reject(error);
                },
                async () => {
                    // Upload terminé
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('✅ Fichier uploadé:', downloadURL);
                    
                    resolve({
                        url: downloadURL,
                        fileName,
                        size: blob.size
                    });
                }
            );
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload:', error);
        throw error;
    }
};

