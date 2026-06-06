import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">SkillPath</Link>
        <div className="nav-links">
          <Link to="/jobs">Jobs</Link>
          {user && <Link to="/profile">Profile</Link>}
          {user && <Link to="/applications">My Applications</Link>}
          <Link to="/saved-jobs">Saved Jobs</Link>
          {user && <Link to="/recommendations">ML Recommendations</Link>}
          {user && <Link to="/advisor">AI Advisor</Link>}
          {user?.role === 'admin' && <Link to="/admin/jobs/new">+ Post Job</Link>}
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register" className="btn-primary">Sign up</Link>}
          {user && (
            <>
              <span className="user-chip">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn-ghost">Log out</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
