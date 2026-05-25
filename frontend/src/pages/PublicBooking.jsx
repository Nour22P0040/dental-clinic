import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PublicBooking.css';

const PublicBooking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Patient Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    // Appointment Info
    doctorId: '',
    appointmentDate: '',
    appointmentType: 'checkup',
    reason: '',
    duration: 30,
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors');
      setDoctors(response.data.data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (!formData.dateOfBirth || !formData.gender) {
        toast.error('Please provide your date of birth and gender');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.doctorId || !formData.appointmentDate || !formData.reason) {
      toast.error('Please fill in all appointment details');
      return;
    }

    setLoading(true);
    try {
      // First, register the patient
      const registerResponse = await axios.post('/api/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: `Temp${Math.random().toString(36).slice(-8)}!1`, // Temporary password
        phone: formData.phone,
        role: 'patient',
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      });

      const authToken = registerResponse.data.data.authToken;

      // Then book the appointment
      await axios.post(
        '/api/appointments/book',
        {
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          appointmentType: formData.appointmentType,
          reason: formData.reason,
          duration: formData.duration,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      toast.success('Appointment booked successfully! Check your email for confirmation.');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      if (error.response?.data?.message?.includes('email')) {
        // If user already exists, try to book directly
        toast.info('Booking appointment with existing account...');
        try {
          // For existing users, they should login first
          toast.error('This email is already registered. Please login to book an appointment.');
          setTimeout(() => navigate('/login'), 2000);
        } catch (bookError) {
          toast.error('Failed to book appointment. Please try again or contact us.');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to book appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-booking-container">
      <div className="booking-header">
        <button className="btn-back-home" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>Book Your Appointment</h1>
        <p>Fill in your details to schedule your visit</p>
      </div>

      <div className="booking-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Personal Info</div>
        </div>
        <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Appointment Details</div>
        </div>
        <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Confirmation</div>
        </div>
      </div>

      <div className="booking-form-container">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="form-step">
              <h2>Personal Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-input"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-input"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📱</span>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="+20 123 456 7890"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📅</span>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">⚧</span>
                    Gender *
                  </label>
                  <select
                    name="gender"
                    className="form-input"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <button type="button" className="btn-next" onClick={handleNext}>
                Next Step →
              </button>
            </div>
          )}

          {/* Step 2: Appointment Details */}
          {step === 2 && (
            <div className="form-step">
              <h2>Appointment Details</h2>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👨‍⚕️</span>
                  Select Doctor *
                </label>
                <select
                  name="doctorId"
                  className="form-input"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select a Doctor --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.uid} value={doctor.uid}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📅</span>
                  Appointment Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="appointmentDate"
                  className="form-input"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🦷</span>
                  Appointment Type *
                </label>
                <select
                  name="appointmentType"
                  className="form-input"
                  value={formData.appointmentType}
                  onChange={handleChange}
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
                <label className="form-label">
                  <span className="label-icon">⏱️</span>
                  Duration
                </label>
                <select
                  name="duration"
                  className="form-input"
                  value={formData.duration}
                  onChange={handleChange}
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
                <label className="form-label">
                  <span className="label-icon">📝</span>
                  Reason for Visit *
                </label>
                <textarea
                  name="reason"
                  className="form-input"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe your symptoms or reason for visit..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-back" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="btn-next" onClick={handleNext}>
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="form-step">
              <h2>Confirm Your Appointment</h2>
              <div className="confirmation-details">
                <div className="detail-section">
                  <h3>Personal Information</h3>
                  <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p><strong>Date of Birth:</strong> {new Date(formData.dateOfBirth).toLocaleDateString()}</p>
                  <p><strong>Gender:</strong> {formData.gender}</p>
                </div>

                <div className="detail-section">
                  <h3>Appointment Details</h3>
                  <p><strong>Doctor:</strong> Dr. {doctors.find(d => d.uid === formData.doctorId)?.firstName} {doctors.find(d => d.uid === formData.doctorId)?.lastName}</p>
                  <p><strong>Date & Time:</strong> {new Date(formData.appointmentDate).toLocaleString()}</p>
                  <p><strong>Type:</strong> {formData.appointmentType}</p>
                  <p><strong>Duration:</strong> {formData.duration} minutes</p>
                  <p><strong>Reason:</strong> {formData.reason}</p>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-back" onClick={handleBack}>
                  ← Back
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner"></span>
                      Booking...
                    </span>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublicBooking;
