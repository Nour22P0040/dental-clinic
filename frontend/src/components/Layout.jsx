import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div 
          className="navbar-brand" 
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <span className="brand-icon">🦷</span>
          <h2>Dental Clinic</h2>
        </div>
        <div className="navbar-menu">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/appointments" className="nav-link">Appointments</Link>
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <>
              <Link to="/patients" className="nav-link">Patients</Link>
              <Link to="/transactions" className="nav-link">Transactions</Link>
            </>
          )}
        </div>
        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.firstName} {user?.lastName}</span>
            <span className="user-role">({user?.role})</span>
          </div>
          <Link to="/profile" className="nav-link">Profile</Link>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
