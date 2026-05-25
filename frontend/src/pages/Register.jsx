import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'doctor', // Only doctor registration allowed
    specialization: '',
    licenseNumber: '',
    doctorRegistrationCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&#]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough].filter(Boolean).length;

    if (strength <= 2) {
      setPasswordStrength('weak');
    } else if (strength <= 4) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&#)');
      return;
    }

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Doctor validation
    if (!formData.specialization || !formData.licenseNumber) {
      toast.error('Specialization and license number are required');
      return;
    }
    if (!formData.doctorRegistrationCode) {
      toast.error('Doctor registration code is required');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Registration successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'strong': return '#059669';
      default: return '#e2e8f0';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h2>Staff Registration</h2>
            <p>Register as a doctor or staff member</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  First Name
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
                  Last Name
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
                <span className="label-icon">🦷</span>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="john.doe@clinic.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🦷</span>
                Password
              </label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                  <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                    {passwordStrength && `Password strength: ${passwordStrength}`}
                  </span>
                </div>
              )}
              <small className="password-hint">
                Must contain: 8+ characters, uppercase, lowercase, number, special character (@$!%*?&#)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🦷</span>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📱</span>
                Phone Number
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
                  <span className="label-icon">🏥</span>
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  className="form-input"
                  placeholder="e.g., General Dentistry"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📋</span>
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  className="form-input"
                  placeholder="License #"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🔑</span>
                Doctor Registration Code
              </label>
              <input
                type="text"
                name="doctorRegistrationCode"
                className="form-input"
                placeholder="Enter registration code"
                value={formData.doctorRegistrationCode}
                onChange={handleChange}
                required
              />
              <small className="password-hint">
                Contact administrator for the doctor registration code
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Creating Account...
                </span>
              ) : (
                'Register as Staff'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="btn btn-secondary btn-block">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
