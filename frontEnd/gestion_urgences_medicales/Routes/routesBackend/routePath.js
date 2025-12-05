// 📄 routePath.js
// const ENDPOINT = `http://192.168.1.132:5000`; 

const ENDPOINT = `http://192.168.11.220:5000`; 


// 🔹 Urgences
const URGENCE = `${ENDPOINT}/urgences`;
export const ADD_URGENCE = `${URGENCE}/add`;
export const DELETE_URGENCE = `${URGENCE}/delete`;
export const UPDATE_URGENCE = `${URGENCE}/update`;
export const GET_ALL_URGENCE = `${URGENCE}/get_all`;
export const SERVICE_INTERVIENT = `${URGENCE}/intervention`;

// 🔹 Services de santé
const SERVICE = `${ENDPOINT}/services`;
export const ADD_SERVICE = `${SERVICE}/add`;
export const LOGIN_SERVICE=`${SERVICE}/login`;
export const LOGOUT_SERVICE=`${SERVICE}/logout`;
export const CHANGE_PASSWORD=`${SERVICE}/change_password`;
export const GET_ALL_SERVICE_PROXY = `${SERVICE}/get_all_service_sante_proxy`;
export const GET_SERVICE_BY_ID = (idService) => `${SERVICE}/${idService}`;
export const UPDATE_SERVICE = `${SERVICE}/update`;
export const DELETE_SERVICE = `${SERVICE}/delete`;

// 🔹 Patients
const PATIENT = `${ENDPOINT}/patients`;
export const LOGIN_PATIENT = `${PATIENT}/login`;
export const CHANGE_PASSWORD_PATIENT = `${PATIENT}/change_password`;
export const LOGOUT_PATIENT = `${PATIENT}/logout`;
export const ADD_PATIENT = `${PATIENT}/add`;
export const UPDATE_PATIENT = `${PATIENT}/update`;
export const DELETE_PATIENT = `${PATIENT}/delete`;
export const GET_ALL_PATIENTS = `${PATIENT}/get_all`;

// 🔹 Messages
const MESSAGE = `${ENDPOINT}/messages`;
export const ADD_MESSAGE = `${MESSAGE}/ajouter`;
export const GET_MESSAGES_BY_URGENCE = (idUrgence) => `${MESSAGE}/urgence/${idUrgence}`;
export const UPDATE_MESSAGE_STATUS = (idMessage) => `${MESSAGE}/${idMessage}`;
export const UPLOAD_MEDIA_MESSAGE = `${MESSAGE}/upload`;
export const DELETE_MESSAGE = (idMessage) => `${MESSAGE}/${idMessage}`;




// Messages d'un utilisateur
export const GET_ALL_MESSAGE_USER = (idUrgence) => `${MESSAGE}/message/${idUrgence}`;

// Urgences d'un utilisateur
export const GET_ALL_URGENCES_USER = (idUser) => `${URGENCE}/user/${idUser}`;

// Services intervenant dans une urgence
export const GET_SERVICES_IN_URGENCE = (idService) => `${SERVICE}/service/${idService}`;

// Patients d’une urgence
export const GET_PATIENTS_IN_URGENCE = (idUrgence) => `${PATIENT}/patient/${idUrgence}`;






export default {
    ADD_URGENCE,
    DELETE_URGENCE,
    UPDATE_URGENCE,
    GET_ALL_URGENCE,
    SERVICE_INTERVIENT,

    ADD_SERVICE,
    GET_ALL_SERVICE_PROXY,
    GET_SERVICE_BY_ID,
    UPDATE_SERVICE,
    DELETE_SERVICE,
    UPLOAD_MEDIA_MESSAGE,

    ADD_PATIENT,
    UPDATE_PATIENT,
    DELETE_PATIENT,
    GET_ALL_PATIENTS,

    ADD_MESSAGE,
    GET_MESSAGES_BY_URGENCE,
    UPDATE_MESSAGE_STATUS,
    DELETE_MESSAGE,



    GET_ALL_MESSAGE_USER,
    GET_ALL_URGENCES_USER,
    GET_SERVICES_IN_URGENCE,
    GET_PATIENTS_IN_URGENCE
};
