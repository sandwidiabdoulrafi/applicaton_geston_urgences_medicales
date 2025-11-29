import axios from "axios"

import { ADD_URGENCE, LOGOUT_PATIENT, CHANGE_PASSWORD_PATIENT, LOGOUT_SERVICE, CHANGE_PASSWORD, LOGIN_PATIENT, LOGIN_SERVICE, UPLOAD_MEDIA_MESSAGE, DELETE_URGENCE, UPDATE_URGENCE, GET_ALL_URGENCE, SERVICE_INTERVIENT, ADD_SERVICE, GET_ALL_SERVICE_PROXY, GET_SERVICE_BY_ID, UPDATE_SERVICE, DELETE_SERVICE, ADD_PATIENT, UPDATE_PATIENT, DELETE_PATIENT, GET_ALL_PATIENTS, ADD_MESSAGE, GET_MESSAGES_BY_URGENCE, UPDATE_MESSAGE_STATUS, DELETE_MESSAGE } from './routePath';


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
export const logoutService = (data) => api.post(LOGOUT_SERVICE);
export const loginService = (data) => api.post(LOGIN_SERVICE, data);
export const getAllServicesProximity = (patientPosition) => api.get(GET_ALL_SERVICE_PROXY,patientPosition);
export const getServiceById = (id) => api.get(GET_SERVICE_BY_ID(id));
export const updateService = (data) => api.patch(UPDATE_SERVICE, data);

export const updateChangePassword = (data) => api.post(CHANGE_PASSWORD, data);
export const deleteService = (data) => api.delete(DELETE_SERVICE, { data });

// ----------------- PATIENTS -----------------
export const createPatient = (data) => api.post(ADD_PATIENT, data);
export const changePatientPassword = (data) => api.post(CHANGE_PASSWORD_PATIENT, data);
export const loginPatient = (data) => api.post(LOGIN_PATIENT, data);
export const logoutPatient = (data) => api.post(LOGOUT_PATIENT);
export const updatePatient = (idPatient,data) => api.patch(UPDATE_PATIENT, {idPatient,data});
export const deletePatient = (data) => api.delete(DELETE_PATIENT, { data });
export const getAllPatients = () => api.get(GET_ALL_PATIENTS);

// ----------------- MESSAGES -----------------
export const addMessage = (data) => api.post(ADD_MESSAGE, data);
export const getMessagesByUrgence = (idUrgence) => api.get(GET_MESSAGES_BY_URGENCE(idUrgence));
export const updateMessageStatus = (idMessage, data) => api.put(UPDATE_MESSAGE_STATUS(idMessage), data);
export const deleteMessage = (idMessage) => api.delete(DELETE_MESSAGE(idMessage));
// export const uploadMediaMessage = (data) => api.post(UPLOAD_MEDIA_MESSAGE,data,);
export const uploadMediaMessage = (data) => axios.post(UPLOAD_MEDIA_MESSAGE, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });


export default {

    createUrgence,
    uploadMediaMessage,
    deleteUrgence,
    updateUrgence,
    getAllServicesProximity,
    serviceIntervient,
    loginService,

    createService,
    getAllUrgences,
    
    
    getServiceById,
    updateService,
    deleteService,

    createPatient,
    updatePatient,
    deletePatient,
    getAllPatients,
    loginPatient,
    changePatientPassword,
    logoutPatient,

    
    addMessage,
    getMessagesByUrgence,
    updateMessageStatus,
    deleteMessage

}