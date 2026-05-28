import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  uploadResume,
  getResume,
  startInterview,
} from '../../services/interviewService.js';
import INTERVIEW_ROLES    from '../../constants/roles.js';
import DIFFICULTY_LEVELS  from '../../constants/difficulty.js';
import {
  BsDisplay,
  BsServer,
  BsLightningFill,
  BsGraphUp,
  BsCloudFill,
  BsStarFill,
  BsStar,
  BsFileEarmarkArrowUp,
  BsCheckCircleFill,
  BsCircle,
  BsArrowRight,
  BsArrowLeft,
  BsPlayCircleFill,
} from 'react-icons/bs';
import { FaPython, FaReact, FaJava } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './index.css';

const ROLE_ICONS = {
  'frontend-developer':   BsDisplay,
  'backend-developer':    BsServer,
  'full-stack-developer': BsLightningFill,
  'data-analyst':         BsGraphUp,
  'devops-engineer':      BsCloudFill,
  'python-developer':     FaPython,
  'react-developer':      FaReact,
  'java-developer':       FaJava,
};

// Returns 1–3 filled stars for each difficulty
function DifficultyStars({ id }) {
  const counts = { easy: 1, medium: 2, hard: 3 };
  const filled  = counts[id] ?? 1;
  return (
    <span className="sp-stars" aria-label={`${id} difficulty`}>
      {Array.from({ length: 3 }, (_, i) =>
        i < filled
          ? <BsStarFill key={i} className="sp-star sp-star--on"  aria-hidden="true" />
          : <BsStar     key={i} className="sp-star sp-star--off" aria-hidden="true" />
      )}
    </span>
  );
}

// Step indicator shown at the top
function StepBar({ current }) {
  const steps = ['Role', 'Difficulty', 'Resume'];
  return (
    <div className="sp-stepbar" aria-label="Setup steps">
      {steps.map((label, idx) => {
        const n       = idx + 1;
        const done    = n < current;
        const active  = n === current;
        return (
          <div key={label} className="sp-stepbar__item">
            <div className={[
              'sp-stepbar__dot',
              done   ? 'sp-stepbar__dot--done'   : '',
              active ? 'sp-stepbar__dot--active' : '',
            ].join(' ')}>
              {done ? <BsCheckCircleFill aria-hidden="true" /> : n}
            </div>
            <span className={[
              'sp-stepbar__label',
              active ? 'sp-stepbar__label--active' : '',
              done   ? 'sp-stepbar__label--done'   : '',
            ].join(' ')}>
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`sp-stepbar__line ${done ? 'sp-stepbar__line--done' : ''}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InterviewSetupPage() {
  const navigate = useNavigate();

  const [step,               setStep]               = useState(1);
  const [selectedRole,       setSelectedRole]       = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [resumeText,         setResumeText]         = useState('');
  const [resumeFileName,     setResumeFileName]     = useState('');
  const [loading,            setLoading]            = useState(false);
  const [uploadingResume,    setUploadingResume]    = useState(false);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const data = await getResume();
        if (data) {
          setResumeText(data.text);
          setResumeFileName(data.fileName);
        }
      } catch {
        // No resume yet — that's fine
      }
    };
    loadResume();
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }
    setUploadingResume(true);
    try {
      const data = await uploadResume(file);
      setResumeText(data.text);
      setResumeFileName(data.fileName);
      toast.success('Resume uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedRole)  return toast.error('Please select a role.');
    if (!resumeText)    return toast.error('Please upload your resume.');
    setLoading(true);
    try {
      const config         = DIFFICULTY_LEVELS.find((d) => d.id === selectedDifficulty);
      const totalQuestions = config?.questions ?? 5;
      const data = await startInterview(selectedRole, resumeText, totalQuestions);
      toast.success('Interview started!');
      navigate(`/interview/${data.interviewId}`, { state: { audio: data.audio } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedRole) return toast.error('Please select a role.');
    setStep((p) => Math.min(p + 1, 3));
  };

  const handleBack = () => setStep((p) => Math.max(p - 1, 1));

  // ── Loading / preparing screen ──
  if (loading) {
    return (
      <div className="sp-root sp-root--center">
        <div className="sp-orb sp-orb--amber" aria-hidden="true" />
        <div className="sp-orb sp-orb--blue"  aria-hidden="true" />
        <div className="sp-preparing">
          <span className="sp-preparing__spinner" aria-hidden="true" />
          <h2 className="sp-preparing__heading">Preparing Your Interview…</h2>
          <p className="sp-preparing__sub">
            Analysing your resume and generating personalised questions for{' '}
            <strong>{selectedRole}</strong>.
          </p>

          <ul className="sp-prep-steps" role="list">
            {[
              { label: 'Analysing resume',           done: true  },
              { label: 'Generating questions',        done: true  },
              { label: 'Setting up voice interviewer', done: false },
            ].map(({ label, done }) => (
              <li key={label} className="sp-prep-step">
                {done
                  ? <BsCheckCircleFill className="sp-prep-step__icon sp-prep-step__icon--done" aria-hidden="true" />
                  : <BsCircle          className="sp-prep-step__icon sp-prep-step__icon--pending" aria-hidden="true" />}
                <span className={`sp-prep-step__label ${done ? '' : 'sp-prep-step__label--pending'}`}>
                  {label}
                </span>
              </li>
            ))}
          </ul>

          <p className="sp-preparing__hint">This may take 10–15 seconds…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-root">
      <div className="sp-orb sp-orb--amber" aria-hidden="true" />
      <div className="sp-orb sp-orb--blue"  aria-hidden="true" />

      <div className="sp-inner">

        {/* ── Page heading ── */}
        <header className="sp-header">
          <p className="sp-header__eyebrow">New Session</p>
          <h1 className="sp-header__heading">
            Set up your <em className="sp-header__accent">Interview</em>
          </h1>
        </header>

        {/* ── Step indicator ── */}
        <StepBar current={step} />

        {/* ── Step content card ── */}
        <div className="sp-card">

          {/* ── STEP 1: Role ── */}
          {step === 1 && (
            <div className="sp-step" key="step-1">
              <h2 className="sp-step__title">Choose a Role</h2>
              <p className="sp-step__hint">Pick the position you're interviewing for.</p>

              <div className="sp-roles-grid">
                {INTERVIEW_ROLES.map((role) => {
                  const Icon     = ROLE_ICONS[role.id];
                  const selected = selectedRole === role.title;
                  return (
                    <button
                      key={role.id}
                      className={`sp-role-card ${selected ? 'sp-role-card--selected' : ''}`}
                      onClick={() => setSelectedRole(role.title)}
                      aria-pressed={selected}
                    >
                      {Icon && (
                        <span className="sp-role-card__icon" aria-hidden="true">
                          <Icon />
                        </span>
                      )}
                      <span className="sp-role-card__title">{role.title}</span>
                      <span className="sp-role-card__desc">{role.description}</span>
                      {selected && (
                        <span className="sp-role-card__check" aria-hidden="true">
                          <BsCheckCircleFill />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 2: Difficulty ── */}
          {step === 2 && (
            <div className="sp-step" key="step-2">
              <h2 className="sp-step__title">Select Difficulty</h2>
              <p className="sp-step__hint">This controls how many and how tough the questions are.</p>

              <div className="sp-difficulty-row">
                {DIFFICULTY_LEVELS.map((level) => {
                  const selected = selectedDifficulty === level.id;
                  return (
                    <button
                      key={level.id}
                      className={`sp-diff-card ${selected ? 'sp-diff-card--selected' : ''}`}
                      onClick={() => setSelectedDifficulty(level.id)}
                      aria-pressed={selected}
                    >
                      <DifficultyStars id={level.id} />
                      <span className="sp-diff-card__label">{level.label}</span>
                      <span className="sp-diff-card__desc">{level.description}</span>
                      {selected && (
                        <span className="sp-diff-card__check" aria-hidden="true">
                          <BsCheckCircleFill />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Resume ── */}
          {step === 3 && (
            <div className="sp-step" key="step-3">
              <h2 className="sp-step__title">Upload Your Resume</h2>
              <p className="sp-step__hint">
                The AI uses your resume to tailor every question to your experience.
              </p>

              {resumeText ? (
                // ── Resume already uploaded ──
                <div className="sp-resume-done">
                  <div className="sp-resume-done__left">
                    <span className="sp-resume-done__icon" aria-hidden="true">
                      <BsCheckCircleFill />
                    </span>
                    <div>
                      <p className="sp-resume-done__name">{resumeFileName}</p>
                      <p className="sp-resume-done__ready">Ready to use</p>
                    </div>
                  </div>
                  <label className="sp-resume-change">
                    Change
                    <input type="file" accept=".pdf" onChange={handleResumeUpload} hidden />
                  </label>
                </div>
              ) : (
                // ── Upload drop zone ──
                <label className={`sp-upload-zone ${uploadingResume ? 'sp-upload-zone--busy' : ''}`}>
                  <span className="sp-upload-zone__icon" aria-hidden="true">
                    {uploadingResume
                      ? <span className="sp-upload-zone__spinner" />
                      : <BsFileEarmarkArrowUp />}
                  </span>
                  <span className="sp-upload-zone__text">
                    {uploadingResume ? 'Uploading…' : 'Click to upload PDF resume'}
                  </span>
                  <span className="sp-upload-zone__sub">PDF only · Max 5 MB</span>
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploadingResume} hidden />
                </label>
              )}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="sp-nav">
            {step > 1 && (
              <button className="sp-nav__back" onClick={handleBack}>
                <BsArrowLeft aria-hidden="true" />
                Back
              </button>
            )}

            <div className="sp-nav__right">
              {step < 3 ? (
                <button className="sp-nav__next" onClick={handleNext}>
                  Next
                  <BsArrowRight aria-hidden="true" />
                </button>
              ) : (
                <button
                  className="sp-nav__start"
                  onClick={handleStartInterview}
                  disabled={!selectedRole || !resumeText}
                  aria-busy={loading}
                >
                  <BsPlayCircleFill aria-hidden="true" />
                  Start Interview
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ── Recap summary bar ── */}
        {(selectedRole || selectedDifficulty) && (
          <div className="sp-summary">
            {selectedRole && (
              <span className="sp-summary__pill">
                Role: <strong>{selectedRole}</strong>
              </span>
            )}
            {selectedDifficulty && (
              <span className="sp-summary__pill">
                Difficulty: <strong style={{ textTransform: 'capitalize' }}>{selectedDifficulty}</strong>
              </span>
            )}
            {resumeFileName && (
              <span className="sp-summary__pill sp-summary__pill--green">
                <BsCheckCircleFill aria-hidden="true" />
                Resume ready
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default InterviewSetupPage;