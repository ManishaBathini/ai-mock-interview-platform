import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import {
  BsSpeedometer2,
  BsPlusCircle,
  BsClockHistory,
  BsBoxArrowRight,
} from 'react-icons/bs';
import './index.css';

const NAV_ITEMS = [
  { label: 'Dashboard',      path: '/',        icon: <BsSpeedometer2 /> },
  { label: 'New Interview',  path: '/setup',   icon: <BsPlusCircle />   },
  { label: 'History',        path: '/history', icon: <BsClockHistory /> },
];

function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <aside className="sb-root">
      {/* Brand */}
      <div className="sb-brand">
         
        <span className="sb-brand-name">🎤 InterviewAI</span>
      </div>

      {/* Nav */}
      <nav className="sb-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, path, icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              className={`sb-item${active ? ' sb-item--active' : ''}`}
              onClick={() => navigate(path)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="sb-item__icon" aria-hidden="true">{icon}</span>
              <span className="sb-item__label">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar" aria-hidden="true">{initials}</div>
          <div className="sb-user__info">
            <span className="sb-user__name">{user?.name ?? 'User'}</span>
            <span className="sb-user__email">{user?.email ?? ''}</span>
          </div>
        </div>
        <button
          className="sb-logout"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <BsBoxArrowRight aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;