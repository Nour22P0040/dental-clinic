import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { number: '25000+', label: 'Happy Patients' },
    { number: '25+', label: 'Operating Years' },
    { number: '50+', label: 'Expert Team Members' },
    { number: '200+', label: 'Services Offered' },
  ];

  const features = [
    'Comprehensive Treatment Plans',
    'Informed Consent',
    'Convenient & Stress-Free Experience',
    'State-of-the-Art Technology',
    'Personalized Care Plans',
  ];

  const cases = [
    {
      title: 'Full Mouth Rehabilitation',
      before: '/jamnagar dentist.jpg',
      after: '/jamnagar dentist.jpg',
    },
    {
      title: 'Smile Makeover',
      before: '/jamnagar dentist.jpg',
      after: '/jamnagar dentist.jpg',
    },
    {
      title: 'Hollywood Smile',
      before: '/jamnagar dentist.jpg',
      after: '/jamnagar dentist.jpg',
    },
    {
      title: 'Full Smile Rehabilitation',
      before: '/jamnagar dentist.jpg',
      after: '/jamnagar dentist.jpg',
    },
    {
      title: 'Teeth Whitening',
      before: '/jamnagar dentist.jpg',
      after: '/jamnagar dentist.jpg',
    },
    {
      title: 'E-max Crowns',
      before: '/jamnagar dentist.jpg',
      after: '/jamnagar dentist.jpg',
    },
  ];

  const handleStaffLogin = () => {
    // If user is already logged in, navigate to their dashboard
    if (user) {
      if (user.role === 'doctor' || user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'patient') {
        navigate('/admin/appointments');
      }
    } else {
      // If not logged in, go to login page
      navigate('/login');
    }
  };

  return (
    <div className="patient-dashboard-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Our Dental Clinic!</h1>
          <p className="hero-subtitle">Your journey to a perfect smile starts here</p>
          <button className="btn-hero" onClick={() => navigate('/book')}>
            Book Your Appointment
          </button>
        </div>
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience Section */}
      <section className="experience-section">
        <div className="experience-content">
          <div className="experience-text">
            <h2 className="section-title">Experience Advanced Dental Care</h2>
            <p className="section-description">
              Discover Egypt's smile secrets with evidence-based dental care and an unforgettable 
              experience. Our clinic offers advanced treatments, affordable packages, and personalized 
              care, helping international patients achieve the smile of their dreams while exploring 
              the beauty of Egypt!
            </p>
            <ul className="features-list">
              {features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <span className="feature-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="experience-images">
            <div className="image-card">
              <img 
                src="/dentist-with-smiling-patient-604bpv0036t94zpt.jpg" 
                alt="Dentist with Smiling Patient" 
              />
              <div className="image-overlay">Expert Dental Care</div>
            </div>
            <div className="image-card">
              <img 
                src="/dentist-with-smiling-patient-604bpv0036t94zpt.jpg" 
                alt="Happy Patient" 
              />
              <div className="image-overlay">Happy Patients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cases Section */}
      <section className="cases-section">
        <h2 className="section-title">Our Cases</h2>
        <p className="section-subtitle">Individual results may vary</p>
        <div className="cases-grid">
          {cases.map((caseItem, index) => (
            <div key={index} className="case-card">
              <h3 className="case-title">{caseItem.title}</h3>
              
              <div className="case-comparison">
                <div className="case-image-wrapper">
                  <img src={caseItem.before} alt="Before" />
                  <span className="case-label before">Before</span>
                </div>
                <div className="comparison-divider">
                  <div className="divider-circle">⟷</div>
                </div>
                <div className="case-image-wrapper">
                  <img src={caseItem.after} alt="After" />
                  <span className="case-label after">After</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Consultation Section */}
      <section className="consultation-section">
        <div className="consultation-content">
          <div className="consultation-video">
            <video 
              controls
              className="video-player"
            >
              <source src="/videoplayback.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="consultation-text">
            <h2 className="section-title">Schedule an Online Consultation!</h2>
            <p className="section-description">
              Experience the highest standard of personalized dental care, all from the comfort 
              and convenience of your own home. Whether you're seeking advice, have concerns, or 
              want to explore treatment options, our expert team is here to provide the guidance 
              you need. Schedule your online consultation today and take the first step toward 
              discussing your dental health goals, concerns, and needs with a dedicated professional. 
              We are committed to delivering tailored care and ensuring that your dental journey is 
              both smooth and stress-free.
            </p>
            <button className="btn-consultation" onClick={() => navigate('/book')}>
              Online Consultation
            </button>
          </div>
        </div>
      </section>

      {/* Appointment Booking Section */}
      <section className="booking-section">
        <h2 className="section-title">Book Your Appointment</h2>
        <p className="section-description">
          Your journey toward a healthy, confident smile begins here. Schedule your visit now to 
          enjoy a comfortable, stress-free experience provided by our expert team of dedicated 
          dental specialists.
        </p>
        <div className="booking-card">
          <div className="booking-info">
            <h3>Ready to Transform Your Smile?</h3>
            <p>Choose your preferred date and time, and let us take care of the rest.</p>
            <ul className="booking-benefits">
              <li>✓ Flexible scheduling</li>
              <li>✓ Expert dental professionals</li>
              <li>✓ State-of-the-art facilities</li>
              <li>✓ Personalized treatment plans</li>
            </ul>
          </div>
          <div className="booking-action">
            <button className="btn-book-now" onClick={() => navigate('/book')}>
              Book Now
            </button>
            <p className="booking-note">Available slots fill up quickly!</p>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/book')}>
            <div className="action-icon">📅</div>
            <h3>Book Appointment</h3>
            <p>Schedule your visit with us</p>
          </div>
          <div className="action-card" onClick={handleStaffLogin}>
            <div className="action-icon">👨‍⚕️</div>
            <h3>{user ? 'Go to Dashboard' : 'Staff Login'}</h3>
            <p>{user ? `Logged in as ${user.role}` : 'Access staff dashboard'}</p>
          </div>
          <div className="action-card" onClick={() => navigate('/book')}>
            <div className="action-icon">🦷</div>
            <h3>Consultation</h3>
            <p>Get expert dental advice</p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">🦷 Dental Clinic</h3>
            <p className="footer-description">
              Your trusted partner for comprehensive dental care and beautiful smiles.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Contact Us</h4>
            <div className="footer-contact">
              <a href="mailto:nourrehab2004@gmail.com" className="footer-link">
                <span className="footer-icon">📧</span>
                nourrehab2004@gmail.com
              </a>
              <a href="https://wa.me/201067451031" target="_blank" rel="noopener noreferrer" className="footer-link">
                <span className="footer-icon">📱</span>
                01067451031
              </a>
              <div className="footer-link">
                <span className="footer-icon">📍</span>
                <span>Jamnagar, India</span>
              </div>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Follow Us</h4>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                <span className="social-icon">f</span>
                Facebook
              </a>
              <a href="https://www.instagram.com/nour_re7ab/" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                <span className="social-icon">📷</span>
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dental Clinic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PatientDashboard;
