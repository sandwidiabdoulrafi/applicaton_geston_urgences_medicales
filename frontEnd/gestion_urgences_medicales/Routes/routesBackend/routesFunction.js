import axios from "axios"

import { ADD_URGENCE, DELETE_URGENCE, UPDATE_URGENCE, GET_ALL_URGENCE, SERVICE_INTERVIENT, ADD_SERVICE, GET_ALL_SERVICE, GET_SERVICE_BY_ID, UPDATE_SERVICE, DELETE_SERVICE, ADD_PATIENT, UPDATE_PATIENT, DELETE_PATIENT, GET_ALL_PATIENTS, ADD_MESSAGE, GET_MESSAGES_BY_URGENCE, UPDATE_MESSAGE_STATUS, DELETE_MESSAGE } from './routePath';


export const api = axios.create({
    baseURL:"",
    headers: {
        "content-type" : "application/json"
    }
})


// ----------------- URGENCES -----------------
export const createUrgence = (data) => api.post(ADD_URGENCE, data);
export const deleteUrgence = (data) => api.delete(DELETE_URGENCE, { data });
export const updateUrgence = (data) => api.put(UPDATE_URGENCE, data);
export const getAllUrgences = () => api.get(GET_ALL_URGENCE);
export const serviceIntervient = (data) => api.post(SERVICE_INTERVIENT, data);

// ----------------- SERVICES -----------------
export const createService = (data) => api.post(ADD_SERVICE, data);
export const getAllServices = () => api.get(GET_ALL_SERVICE);
export const getServiceById = (id) => api.get(GET_SERVICE_BY_ID(id));
export const updateService = (data) => api.patch(UPDATE_SERVICE, data);
export const deleteService = (data) => api.delete(DELETE_SERVICE, { data });

// ----------------- PATIENTS -----------------
export const createPatient = (data) => api.post(ADD_PATIENT, data);
export const updatePatient = (data) => api.patch(UPDATE_PATIENT, data);
export const deletePatient = (data) => api.delete(DELETE_PATIENT, { data });
export const getAllPatients = () => api.get(GET_ALL_PATIENTS);

// ----------------- MESSAGES -----------------
export const addMessage = (data) => api.post(ADD_MESSAGE, data);
export const getMessagesByUrgence = (idUrgence) => api.get(GET_MESSAGES_BY_URGENCE(idUrgence));
export const updateMessageStatus = (idMessage, data) => api.put(UPDATE_MESSAGE_STATUS(idMessage), data);
export const deleteMessage = (idMessage) => api.delete(DELETE_MESSAGE(idMessage));


export default {

    createUrgence,
    deleteUrgence,
    updateUrgence,
    getAllUrgences,
    serviceIntervient,

    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,

    createPatient,
    updatePatient,
    deletePatient,
    getAllPatients,

    
    addMessage,
    getMessagesByUrgence,
    updateMessageStatus,
    deleteMessage

}