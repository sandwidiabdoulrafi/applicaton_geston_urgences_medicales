// 📄 routePath.js
const ENDPOINT = `http://192.168.1.132:5000`;

// 🔹 Urgences
const URGENCE = `${ENDPOINT}/urgences`;
export const ADD_URGENCE = `${URGENCE}/add`;
export const DELETE_URGENCE = `${URGENCE}/delete`;
export const UPDATE_URGENCE = `${URGENCE}/update`;
export const GET_ALL_URGENCE = `${URGENCE}/getAll`;
export const SERVICE_INTERVIENT = `${URGENCE}/intervention`;

// 🔹 Services de santé
const SERVICE = `${ENDPOINT}/service`;
export const ADD_SERVICE = `${SERVICE}/add`;
export const GET_ALL_SERVICE = `${SERVICE}/get_all_service_sante`;
export const GET_SERVICE_BY_ID = (idService) => `${SERVICE}/${idService}`;
export const UPDATE_SERVICE = `${SERVICE}/update`;
export const DELETE_SERVICE = `${SERVICE}/delete`;

// 🔹 Patients
const PATIENT = `${ENDPOINT}/patient`;
export const ADD_PATIENT = `${PATIENT}/add`;
export const UPDATE_PATIENT = `${PATIENT}/update`;
export const DELETE_PATIENT = `${PATIENT}/delete`;
export const GET_ALL_PATIENTS = `${PATIENT}/get_all`;

// 🔹 Messages
    
const MESSAGE = `${ENDPOINT}/messages`;
export const ADD_MESSAGE = `${MESSAGE}/ajouter`;
export const GET_MESSAGES_BY_URGENCE = (idUrgence) => `${MESSAGE}/urgence/${idUrgence}`;
export const UPDATE_MESSAGE_STATUS = (idMessage) => `${MESSAGE}/${idMessage}`;
export const DELETE_MESSAGE = (idMessage) => `${MESSAGE}/${idMessage}`;

export default {
    ADD_URGENCE,
    DELETE_URGENCE,
    UPDATE_URGENCE,
    GET_ALL_URGENCE,
    SERVICE_INTERVIENT,

    ADD_SERVICE,
    GET_ALL_SERVICE,
    GET_SERVICE_BY_ID,
    UPDATE_SERVICE,
    DELETE_SERVICE,

    ADD_PATIENT,
    UPDATE_PATIENT,
    DELETE_PATIENT,
    GET_ALL_PATIENTS,

    ADD_MESSAGE,
    GET_MESSAGES_BY_URGENCE,
    UPDATE_MESSAGE_STATUS,
    DELETE_MESSAGE,
};
