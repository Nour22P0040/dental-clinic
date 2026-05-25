import axios from 'axios';

const API_URL = '/api';

// Appointments
export const appointmentAPI = {
  book: (data) => axios.post(`${API_URL}/appointments/book`, data),
  getAll: (params) => axios.get(`${API_URL}/appointments`, { params }),
  getUpcoming: (params) => axios.get(`${API_URL}/appointments/upcoming`, { params }),
  getById: (id) => axios.get(`${API_URL}/appointments/${id}`),
  update: (id, data) => axios.put(`${API_URL}/appointments/${id}`, data),
  cancel: (id, reason) => axios.delete(`${API_URL}/appointments/${id}`, { data: { reason } }),
};

// Patients
export const patientAPI = {
  getAll: (params) => axios.get(`${API_URL}/patients`, { params }),
  getById: (id) => axios.get(`${API_URL}/patients/${id}`),
  update: (id, data) => axios.put(`${API_URL}/patients/${id}`, data),
  updateMedicalHistory: (id, data) => axios.put(`${API_URL}/patients/${id}/medical-history`, data),
  delete: (id) => axios.delete(`${API_URL}/patients/${id}`),
};

// Transactions
export const transactionAPI = {
  create: (data) => axios.post(`${API_URL}/transactions`, data),
  getAll: (params) => axios.get(`${API_URL}/transactions`, { params }),
  getById: (id) => axios.get(`${API_URL}/transactions/${id}`),
  getByPatient: (patientId) => axios.get(`${API_URL}/transactions/patient/${patientId}`),
  update: (id, data) => axios.put(`${API_URL}/transactions/${id}`, data),
  getSummary: (params) => axios.get(`${API_URL}/transactions/summary`, { params }),
};

// Analytics
export const analyticsAPI = {
  getDashboard: (params) => axios.get(`${API_URL}/analytics/dashboard`, { params }),
  getPatient: (patientId) => axios.get(`${API_URL}/analytics/patient/${patientId}`),
  getDoctor: (doctorId, params) => axios.get(`${API_URL}/analytics/doctor/${doctorId}`, { params }),
};

// Doctors
export const doctorAPI = {
  getAll: (params) => axios.get(`${API_URL}/doctors`, { params }),
  getById: (id) => axios.get(`${API_URL}/doctors/${id}`),
};

export default {
  appointmentAPI,
  patientAPI,
  transactionAPI,
  analyticsAPI,
  doctorAPI,
};
