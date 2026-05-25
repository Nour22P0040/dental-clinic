import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setAnalytics(response.data.data);
    } catch (error) {
      // Silently handle error - don't show toast
      console.log('Analytics not available');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.firstName}!</h1>
      <p className="subtitle">Here's your overview</p>

      {isDoctorOrAdmin && analytics && (
        <>
          <div className="stats-grid">
            <div 
              className="stat-card stat-card-clickable" 
              onClick={() => navigate('/patients')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Total Patients</h3>
                <p className="stat-value">{analytics.overview.totalPatients}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>Total Visits</h3>
                <p className="stat-value">{analytics.overview.totalVisits}</p>
              </div>
            </div>

            <div 
              className="stat-card stat-card-clickable" 
              onClick={() => navigate('/appointments')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon">🔔</div>
              <div className="stat-content">
                <h3>Upcoming Appointments</h3>
                <p className="stat-value">{analytics.overview.upcomingAppointments}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Balance</h3>
                <p className="stat-value">EGP {analytics.overview.financial.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <h2>Financial Summary</h2>
              <div className="financial-summary">
                <div className="financial-item">
                  <span>Total Income:</span>
                  <span className="income">EGP {analytics.overview.financial.totalIncome.toFixed(2)}</span>
                </div>
                <div className="financial-item">
                  <span>Total Expenses:</span>
                  <span className="expense">EGP {analytics.overview.financial.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="financial-item">
                  <span>Profit Margin:</span>
                  <span className="profit">{analytics.overview.financial.profitMargin}%</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>Recent Appointments</h2>
              <div className="appointments-list">
                {analytics.appointments.recent.slice(0, 5).map((apt) => (
                  <div key={apt._id} className="appointment-item">
                    <div>
                      <strong>{apt.patient?.firstName} {apt.patient?.lastName}</strong>
                      <p>{apt.appointmentType} - {apt.reason}</p>
                    </div>
                    <span className={`badge badge-${apt.status === 'completed' ? 'success' : 'info'}`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!isDoctorOrAdmin && (
        <div className="patient-dashboard">
          <div className="card">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
                Book Appointment
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
                View Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
