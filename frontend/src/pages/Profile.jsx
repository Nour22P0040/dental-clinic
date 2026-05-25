import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <h1>My Profile</h1>
      
      <div className="card">
        <h2>Personal Information</h2>
        <div style={{ marginTop: '20px' }}>
          <div className="profile-field">
            <strong>Name:</strong>
            <span>{user.firstName} {user.lastName}</span>
          </div>
          <div className="profile-field">
            <strong>Email:</strong>
            <span>{user.email}</span>
          </div>
          <div className="profile-field">
            <strong>Phone:</strong>
            <span>{user.phone}</span>
          </div>
          <div className="profile-field">
            <strong>Role:</strong>
            <span className="badge badge-info">{user.role}</span>
          </div>
        </div>
      </div>

      {user.role === 'patient' && (
        <>
          <div className="card">
            <h2>Medical Information</h2>
            <div style={{ marginTop: '20px' }}>
              <div className="profile-field">
                <strong>Date of Birth:</strong>
                <span>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="profile-field">
                <strong>Gender:</strong>
                <span>{user.gender}</span>
              </div>
              <div className="profile-field">
                <strong>Allergies:</strong>
                <span>{user.medicalHistory?.allergies?.join(', ') || 'None'}</span>
              </div>
              <div className="profile-field">
                <strong>Chronic Conditions:</strong>
                <span>{user.medicalHistory?.chronicConditions?.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Visit Statistics</h2>
            <div style={{ marginTop: '20px' }}>
              <div className="profile-field">
                <strong>Total Visits:</strong>
                <span>{user.visitCount || 0}</span>
              </div>
              <div className="profile-field">
                <strong>Total Spent:</strong>
                <span>${user.totalMoneySpent?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="profile-field">
                <strong>Last Visit:</strong>
                <span>{user.lastVisitDate ? new Date(user.lastVisitDate).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {user.role === 'doctor' && (
        <div className="card">
          <h2>Professional Information</h2>
          <div style={{ marginTop: '20px' }}>
            <div className="profile-field">
              <strong>Specialization:</strong>
              <span>{user.specialization}</span>
            </div>
            <div className="profile-field">
              <strong>License Number:</strong>
              <span>{user.licenseNumber}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
