import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import axios from 'axios';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll();
      setAppointments(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'badge-info',
      confirmed: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      'no-show': 'badge-warning',
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Appointments</h1>
        {user?.role === 'patient' && (
          <button className="btn btn-primary" onClick={() => setShowBooking(!showBooking)}>
            {showBooking ? 'Cancel' : 'Book Appointment'}
          </button>
        )}
      </div>

      {showBooking && <BookingForm onSuccess={() => { setShowBooking(false); fetchAppointments(); }} />}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date & Time</th>
              {user?.role !== 'patient' && <th>Patient</th>}
              {user?.role === 'patient' && <th>Doctor</th>}
              <th>Type</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt._id}>
                <td>{format(new Date(apt.appointmentDate), 'MMM dd, yyyy HH:mm')}</td>
                {user?.role !== 'patient' && (
                  <td>{apt.patient?.firstName} {apt.patient?.lastName}</td>
                )}
                {user?.role === 'patient' && (
                  <td>Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</td>
                )}
                <td>{apt.appointmentType}</td>
                <td>{apt.reason}</td>
                <td>
                  <span className={`badge ${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </td>
                <td>
                  {apt.status === 'scheduled' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={async () => {
                        if (window.confirm('Cancel this appointment?')) {
                          try {
                            await appointmentAPI.cancel(apt._id, 'Cancelled by user');
                            toast.success('Appointment cancelled');
                            fetchAppointments();
                          } catch (error) {
                            toast.error('Failed to cancel appointment');
                          }
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BookingForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentType: 'checkup',
    reason: '',
    duration: 30,
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors');
      setDoctors(response.data.data);
      
      // Auto-select first doctor if available
      if (response.data.data.length > 0) {
        setFormData(prev => ({ ...prev, doctorId: response.data.data[0].uid }));
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to load doctors list');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    setLoading(true);
    try {
      await appointmentAPI.book(formData);
      toast.success('Appointment booked successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h2>Book New Appointment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Select Doctor *</label>
          <select
            className="form-input"
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            required
          >
            <option value="">-- Select a Doctor --</option>
            {doctors.map((doctor) => (
              <option key={doctor.uid} value={doctor.uid}>
                Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
              </option>
            ))}
          </select>
          {doctors.length === 0 && (
            <small style={{ color: '#dc2626' }}>No doctors available. Please contact admin.</small>
          )}
        </div>
        
        <div className="form-group">
          <label className="form-label">Appointment Date & Time *</label>
          <input
            type="datetime-local"
            className="form-input"
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            required
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Type *</label>
          <select
            className="form-input"
            value={formData.appointmentType}
            onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
            required
          >
            <option value="checkup">Checkup</option>
            <option value="cleaning">Cleaning</option>
            <option value="filling">Filling</option>
            <option value="root-canal">Root Canal</option>
            <option value="extraction">Extraction</option>
            <option value="crown">Crown</option>
            <option value="whitening">Whitening</option>
            <option value="orthodontics">Orthodontics</option>
            <option value="emergency">Emergency</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Duration (minutes)</label>
          <select
            className="form-input"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Reason *</label>
          <textarea
            className="form-input"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
            rows="3"
            placeholder="Describe your symptoms or reason for visit..."
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || doctors.length === 0}
        >
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
};

export default Appointments;
