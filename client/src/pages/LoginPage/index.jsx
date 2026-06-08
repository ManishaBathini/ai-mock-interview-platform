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
  BsArrowRight,
  BsCheckCircleFill,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function LoginPage() {
  const [isSignUp,     setIsSignUp]     = useState(false);
  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [focused,      setFocused]      = useState('');

  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

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
    {
      icon: <BsMicFill />,
      label: 'Voice Interviews',
      desc: 'Real-time AI speech analysis',
      color: 'feat-blue',
    },
    {
      icon: <BsFileEarmarkTextFill />,
      label: 'Resume Analysis',
      desc: 'Tailored question generation',
      color: 'feat-indigo',
    },
    {
      icon: <BsCodeSlash />,
      label: 'Live Coding',
      desc: 'In-browser IDE with feedback',
      color: 'feat-violet',
    },
    {
      icon: <BsBarChartFill />,
      label: 'AI Scoring',
      desc: '5 performance dimensions',
      color: 'feat-sky',
    },
  ];

  return (
    <div className="lp-root">
      {/* Ambient background orbs */}
      <div className="lp-orb lp-orb--1" aria-hidden="true" />
      <div className="lp-orb lp-orb--2" aria-hidden="true" />
      <div className="lp-orb lp-orb--3" aria-hidden="true" />

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav__brand">
          
          <span className="lp-nav__name">🎤 InterviewAI</span>
        </div>
        <span className="lp-nav__badge">AI Powered</span>
      </nav>

      {/* ── Main layout ── */}
      <main className="lp-main">

        {/* LEFT */}
        <section className="lp-left" aria-label="Product overview">

          <div className="lp-eyebrow">
            <span className="lp-eyebrow__dot" />
            <span>AI-Powered Interview Coach</span>
          </div>

          <h1 className="lp-heading">
            Ace Your Next Interview<br />
            <em className="lp-heading__em">with AI Feedback.</em>
          </h1>

          <p className="lp-subheading">
            Practice with a conversational AI that listens, adapts, and delivers
            the precise feedback that turns candidates into hires.
          </p>

          {/* Feature grid */}
          <div className="lp-features">
            {features.map(({ icon, label, desc, color }) => (
              <div key={label} className={`lp-feature ${color}`}>
                <div className="lp-feature__icon" aria-hidden="true">{icon}</div>
                <div>
                  <div className="lp-feature__label">{label}</div>
                  <div className="lp-feature__desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div className="lp-trust">
            {[
              { icon: <BsShieldCheck />,  text: 'SOC-2 secure & private'    },
              { icon: <BsPeopleFill />,   text: '10,000+ candidates trained' },
              { icon: <BsCheckCircleFill />, text: '94% interview success rate' },
            ].map(({ icon, text }) => (
              <div key={text} className="lp-trust__item">
                <span className="lp-trust__icon" aria-hidden="true">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT — Auth card */}
        <section className="lp-right" aria-label="Sign in or create account">
          <div className="lp-card">

            {/* Card header */}
            <div className="lp-card__header">
              <h2 className="lp-card__title">
                {isSignUp ? 'Create account' : 'Good to see you again.'}
              </h2>
              <p className="lp-card__sub">
                {isSignUp
                  ? 'Start your free account — no credit card needed.'
                  : 'Sign in to continue your practice sessions.'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="lp-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={!isSignUp}
                className={`lp-tab${!isSignUp ? ' lp-tab--active' : ''}`}
                onClick={() => switchMode(false)}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={isSignUp}
                className={`lp-tab${isSignUp ? ' lp-tab--active' : ''}`}
                onClick={() => switchMode(true)}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="lp-form" noValidate>

              {isSignUp && (
                <div className={`lp-field lp-field--slide ${focused === 'name' ? 'lp-field--focused' : ''}`}>
                  <label htmlFor="name" className="lp-label">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className="lp-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className={`lp-field ${focused === 'email' ? 'lp-field--focused' : ''}`}>
                <label htmlFor="email" className="lp-label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="lp-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  required
                  autoComplete="email"
                />
              </div>

              <div className={`lp-field ${focused === 'password' ? 'lp-field--focused' : ''}`}>
                <div className="lp-label-row">
                  <label htmlFor="password" className="lp-label">Password</label>
                  {!isSignUp && (
                    <button type="button" className="lp-forgot">Forgot?</button>
                  )}
                </div>
                <div className="lp-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input lp-input--padded"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
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
                  <>
                    <span className="lp-spinner" aria-hidden="true" />
                    Please wait…
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <BsArrowRight className="lp-submit__arrow" aria-hidden="true" />
                  </>
                )}
              </button>

            </form>

            <p className="lp-switch">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="lp-switch__link"
                onClick={() => switchMode(!isSignUp)}
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </p>

            <p className="lp-secure">
              <BsShieldCheck aria-hidden="true" />
              Protected by industry-standard encryption
            </p>

          </div>
        </section>

      </main>
    </div>
  );
}

export default LoginPage;