import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { register, emailLogin } from '../../services/authService.js';
import {
  BsMicFill,
  BsFileEarmarkTextFill,
  BsCodeSlash,
  BsBarChartFill,
  BsShieldCheck,
  BsPeopleFill,
  BsEye,
  BsEyeSlash,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function LoginPage() {
  const [isSignUp, setIsSignUp]     = useState(false);
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);

  const { login }  = useContext(AuthContext);
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await register(name, email, password);
        toast.success('Account created successfully!');
      } else {
        result = await emailLogin(email, password);
        toast.success('Welcome back!');
      }
      login(result.token, result.user);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (signUp) => {
    setIsSignUp(signUp);
    setName('');
    setEmail('');
    setPassword('');
  };

  const features = [
    { icon: <BsMicFill />,              label: 'Voice Interviews'  },
    { icon: <BsFileEarmarkTextFill />,  label: 'Resume Analysis'   },
    { icon: <BsCodeSlash />,            label: 'Live Coding'        },
    { icon: <BsBarChartFill />,         label: 'AI Scoring'         },
  ];

  const trustItems = [
    { icon: <BsShieldCheck />,  label: 'Secure & Private'    },
    { icon: <BsPeopleFill />,   label: 'Join 10,000+ users'  },
    { icon: <BsBarChartFill />, label: '5 Score Categories'  },
  ];

  return (
    <div className="lp-root">

      {/* Ambient background orbs */}
      <div className="lp-orb lp-orb--amber" aria-hidden="true" />
      <div className="lp-orb lp-orb--blue"  aria-hidden="true" />

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav__brand">
          <span className="lp-nav__dot" aria-hidden="true" />
          <span className="lp-nav__name">InterviewAI</span>
        </div>
        <span className="lp-nav__badge">Beta</span>
      </nav>

      {/* ── Two-column layout ── */}
      <main className="lp-main">

        {/* LEFT — copy & features */}
        <section className="lp-left" aria-label="Product overview">
          <div className="lp-left__eyebrow">AI-Powered Interview Coach</div>

          <h1 className="lp-left__heading">
            Practice like it's
            <br />
            <em className="lp-left__accent">the real thing.</em>
          </h1>

          <p className="lp-left__body">
            Our AI interviewer speaks, listens, and gives you honest feedback
            — so you walk into every interview with confidence.
          </p>

          {/* Feature pills */}
          <ul className="lp-features" role="list">
            {features.map(({ icon, label }) => (
              <li key={label} className="lp-feature">
                <span className="lp-feature__icon" aria-hidden="true">{icon}</span>
                <span className="lp-feature__label">{label}</span>
              </li>
            ))}
          </ul>

          {/* Trust row */}
          <ul className="lp-trust" role="list">
            {trustItems.map(({ icon, label }) => (
              <li key={label} className="lp-trust__item">
                <span className="lp-trust__icon" aria-hidden="true">{icon}</span>
                <span className="lp-trust__label">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* RIGHT — auth card */}
        <section className="lp-right" aria-label="Sign in or create account">
          <div className="lp-card">

            {/* Tab switcher */}
            <div className="lp-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={!isSignUp}
                className={`lp-tab ${!isSignUp ? 'lp-tab--active' : ''}`}
                onClick={() => switchMode(false)}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={isSignUp}
                className={`lp-tab ${isSignUp ? 'lp-tab--active' : ''}`}
                onClick={() => switchMode(true)}
              >
                Create Account
              </button>
              {/* sliding indicator */}
              <span
                className="lp-tabs__slider"
                style={{ transform: isSignUp ? 'translateX(100%)' : 'translateX(0)' }}
                aria-hidden="true"
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="lp-form" noValidate>

              {isSignUp && (
                <div className="lp-field lp-field--animate">
                  <label htmlFor="name" className="lp-label">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className="lp-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="lp-field">
                <label htmlFor="email" className="lp-label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="lp-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="lp-field">
                <label htmlFor="password" className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input lp-input--padded-right"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="lp-input-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <BsEyeSlash /> : <BsEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="lp-submit"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <span className="lp-submit__spinner" aria-hidden="true" />
                ) : null}
                {loading
                  ? 'Please wait…'
                  : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
              </button>

            </form>

            <p className="lp-card__footer">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="lp-card__switch"
                onClick={() => switchMode(!isSignUp)}
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}

export default LoginPage;