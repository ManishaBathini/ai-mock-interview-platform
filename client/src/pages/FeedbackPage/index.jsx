import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterview } from '../../services/interviewService.js';
import ScoreCard from '../../components/ScoreCard';
import getScoreColor from '../../constants/scoreColors.js';
import {
  BsCheckCircleFill,
  BsArrowUpRight,
  BsJournalText,
  BsArrowRepeat,
  BsHouseDoorFill,
  BsStarFill,
  BsArrowLeft,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

const CATEGORY_MAP = [
  { key: 'communicationSkills', label: 'Communication',      emoji: '🗣' },
  { key: 'technicalKnowledge',  label: 'Technical Knowledge', emoji: '💡' },
  { key: 'problemSolving',      label: 'Problem Solving',     emoji: '🧩' },
  { key: 'codeQuality',         label: 'Code Quality',        emoji: '💻' },
  { key: 'confidence',          label: 'Confidence',          emoji: '🎯' },
];

function FeedbackPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getInterview(id);
        if (!data.feedback) {
          toast.error('No feedback available for this interview.');
          navigate('/');
          return;
        }
        setInterview(data);
      } catch {
        toast.error('Failed to load feedback');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="fb-loading">
        <div className="fb-loading__spinner" aria-hidden="true" />
        <p>Loading feedback…</p>
      </div>
    );
  }

  if (!interview?.feedback) return null;

  const { feedback, role, overallScore, createdAt } = interview;
  const { categoryScores, strengths, areasOfImprovement, finalAssessment } = feedback;

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const scoreLabel =
    overallScore >= 80 ? 'Excellent'  :
    overallScore >= 65 ? 'Good'       :
    overallScore >= 45 ? 'Fair'       : 'Needs Work';

  const scoreColor = getScoreColor(overallScore);

  return (
    <div className="fb-root">
      {/* ambient orbs */}
      <div className="fb-orb fb-orb--1" aria-hidden="true" />
      <div className="fb-orb fb-orb--2" aria-hidden="true" />

      <div className="fb-inner">

       

        {/* ── Page header ── */}
        <header className="fb-header">
          <div className="fb-header__eyebrow">
            <span className="fb-header__dot" />
            Interview Complete
          </div>
          <h1 className="fb-header__heading">
            Your <em className="fb-header__accent">Feedback</em>
          </h1>
          <p className="fb-header__meta">
            <span className="fb-header__role">{role}</span>
            <span className="fb-header__sep" aria-hidden="true">·</span>
            <span className="fb-header__date">{formattedDate}</span>
          </p>
        </header>

        {/* ── Score hero ── */}
        <section className="fb-score-hero" aria-label="Overall score">
          {/* Big ring */}
          <div className="fb-ring" style={{ '--score-color': scoreColor }}>
            <svg className="fb-ring__svg" viewBox="0 0 120 120">
              {/* track */}
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              {/* progress */}
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={scoreColor} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 326.7} 326.7`}
                strokeDashoffset="0"
                transform="rotate(-90 60 60)"
                className="fb-ring__arc"
              />
            </svg>
            <div className="fb-ring__inner">
              <span className="fb-ring__number" style={{ color: scoreColor }}>
                {overallScore}
              </span>
              <span className="fb-ring__denom">/100</span>
            </div>
          </div>

          {/* Verdict + meta */}
          <div className="fb-score-info">
            <div className="fb-verdict" style={{ color: scoreColor }}>
              <BsStarFill aria-hidden="true" />
              {scoreLabel}
            </div>
            <p className="fb-score-info__label">Overall Score</p>
            <p className="fb-score-info__sub">{role} · {formattedDate}</p>

            {/* Mini category bars */}
            {categoryScores && (
              <div className="fb-mini-bars">
                {CATEGORY_MAP.map(({ key, label }) => {
                  const s = categoryScores[key]?.score ?? 0;
                  return (
                    <div key={key} className="fb-mini-bar">
                      <span className="fb-mini-bar__label">{label}</span>
                      <div className="fb-mini-bar__track">
                        <div
                          className="fb-mini-bar__fill"
                          style={{ width: `${s}%`, background: getScoreColor(s) }}
                        />
                      </div>
                      <span className="fb-mini-bar__val">{s}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Category cards ── */}
        {categoryScores && (
          <section className="fb-section">
            <h2 className="fb-section__heading">Category Breakdown</h2>
            <div className="fb-categories">
              {CATEGORY_MAP.map(({ key, label, emoji }) => {
                const s = categoryScores[key]?.score ?? 0;
                const color = getScoreColor(s);
                return (
                  <div key={key} className="fb-cat-card">
                    <div className="fb-cat-card__top">
                      <span className="fb-cat-card__emoji" aria-hidden="true">{emoji}</span>
                      <div className="fb-cat-card__info">
                        <span className="fb-cat-card__label">{label}</span>
                        <span className="fb-cat-card__score" style={{ color }}>{s}<span className="fb-cat-card__denom">/100</span></span>
                      </div>
                    </div>
                    <div className="fb-cat-card__bar">
                      <div
                        className="fb-cat-card__fill"
                        style={{ width: `${s}%`, background: color }}
                      />
                    </div>
                    {categoryScores[key]?.comment && (
                      <p className="fb-cat-card__comment">
                        {categoryScores[key].comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Two column: strengths + improvements ── */}
        <div className="fb-two-col">

          {strengths?.length > 0 && (
            <section className="fb-callout fb-callout--green">
              <div className="fb-callout__header">
                <BsCheckCircleFill className="fb-callout__icon" aria-hidden="true" />
                <h2 className="fb-callout__heading">Strengths</h2>
              </div>
              <ul className="fb-callout__list" role="list">
                {strengths.map((item, i) => (
                  <li key={i} className="fb-callout__item">
                    <span className="fb-callout__bullet" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {areasOfImprovement?.length > 0 && (
            <section className="fb-callout fb-callout--amber">
              <div className="fb-callout__header">
                <BsArrowUpRight className="fb-callout__icon" aria-hidden="true" />
                <h2 className="fb-callout__heading">Areas for Improvement</h2>
              </div>
              <ul className="fb-callout__list" role="list">
                {areasOfImprovement.map((item, i) => (
                  <li key={i} className="fb-callout__item">
                    <span className="fb-callout__bullet" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        {/* ── Final assessment ── */}
        {finalAssessment && (
          <section className="fb-callout fb-callout--blue">
            <div className="fb-callout__header">
              <BsJournalText className="fb-callout__icon" aria-hidden="true" />
              <h2 className="fb-callout__heading">Final Assessment</h2>
            </div>
            <p className="fb-assessment">{finalAssessment}</p>
          </section>
        )}

        {/* ── Actions ── */}
        <div className="fb-actions">
          <button className="fb-actions__primary" onClick={() => navigate('/setup')}>
            <BsArrowRepeat aria-hidden="true" />
            Practice Again
          </button>
          <button className="fb-actions__outline" onClick={() => navigate('/')}>
            <BsHouseDoorFill aria-hidden="true" />
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

export default FeedbackPage;