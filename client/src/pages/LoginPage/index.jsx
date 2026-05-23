import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { register, emailLogin } from '../../services/authService.js';
import {
  BsCameraVideo, BsMicFill, BsFileEarmarkTextFill,
  BsCodeSlash, BsBarChartFill, BsShieldCheck,
  BsCheckLg, BsPeopleFill, BsArrowRight, BsEye, BsEyeSlash,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

const FEATURES = [
  { icon: BsMicFill,             label: 'Voice interviews' },
  { icon: BsCodeSlash,           label: 'Live coding'      },
  { icon: BsBarChartFill,        label: 'AI scoring'       },
  { icon: BsFileEarmarkTextFill, label: 'Resume analysis'  },
];

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = isSignUp
        ? await register(name, email, password)
        : await emailLogin(email, password);
      toast.success(isSignUp ? 'Account created!' : 'Welcome back!');
      login(result.token, result.user);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-page">

      {/* ── Top bar ── */}
      <div className="lp-topbar">
        <div className="lp-brand">
          <div className="lp-brand-icon"><BsCameraVideo /></div>
          <span className="lp-brand-name">InterviewAI</span>
        </div>
        <div className="lp-status-badge">
          <span className="lp-status-dot" />
          Free to start
        </div>
      </div>

      {/* ── Above card: heading & sub ── */}
      <div className="lp-above-card">
        <p className="lp-eyebrow">
          {isSignUp ? 'Join 10,000+ candidates' : 'Your next role awaits'}
        </p>
        <h1 className="lp-heading">
          {isSignUp ? <>Let's get <em>started.</em></> : <>Ready to <em>ace it?</em></>}
        </h1>
        <p className="lp-sub">
          {isSignUp
            ? 'Create your free account and start practicing today.'
            : 'Sign in and continue where you left off.'}
        </p>
      </div>

      {/* ── Card: auth form only ── */}
      <div className="lp-card">
        {/* Segment */}
        <div className="lp-seg">
          <button
            className={`lp-seg-btn${!isSignUp ? ' lp-seg-btn--on' : ''}`}
            onClick={() => setIsSignUp(false)}
          >Sign in</button>
          <button
            className={`lp-seg-btn${isSignUp ? ' lp-seg-btn--on' : ''}`}
            onClick={() => setIsSignUp(true)}
          >Create account</button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="lp-field lp-field--animate">
              <div className="lp-field-inner">
                <input
                  id="name" type="text" className="lp-input"
                  placeholder="Full name"
                  value={name} onChange={e => setName(e.target.value)} required
                />
                <label className="lp-label" htmlFor="name">Full name</label>
              </div>
            </div>
          )}

          <div className="lp-field">
            <div className="lp-field-inner">
              <input
                id="email" type="email" className="lp-input"
                placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <label className="lp-label" htmlFor="email">Email address</label>
            </div>
          </div>

          <div className="lp-field">
            <div className="lp-pwd-wrap">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="lp-input"
                placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6}
              />
              <label className="lp-label" htmlFor="password">Password</label>
              <button
                type="button" className="lp-eye"
                onClick={() => setShowPwd(v => !v)}
                aria-label="Toggle password visibility"
              >
                {showPwd ? <BsEyeSlash /> : <BsEye />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="lp-row-end">
              <a className="lp-link" href="#">Forgot password?</a>
            </div>
          )}

          <button
            type="submit"
            className={`lp-btn${loading ? ' lp-btn--loading' : ''}`}
            disabled={loading}
          >
            {loading
              ? <span className="lp-spinner" />
              : <>{isSignUp ? 'Create account' : 'Sign in'} <BsArrowRight className="lp-arrow" /></>}
          </button>
        </form>
      </div>

      {/* ── Below card: features + trust ── */}
      <div className="lp-below-card">
        <div className="lp-features">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="lp-feat">
              <div className="lp-feat-ico"><Icon /></div>
              <span className="lp-feat-txt">{label}</span>
            </div>
          ))}
        </div>

        <div className="lp-trust">
          <div className="lp-trust-item">
            <BsShieldCheck className="lp-ti-gold" /> 256-bit secure
          </div>
          <div className="lp-trust-sep" />
          <div className="lp-trust-item">
            <BsCheckLg className="lp-ti-gold" /> Free forever
          </div>
          <div className="lp-trust-sep" />
          <div className="lp-trust-item">
            <BsPeopleFill /> 10k+ hired
          </div>
        </div>
      </div>

    </div>
  );
}