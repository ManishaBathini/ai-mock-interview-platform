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
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

// Maps the camelCase keys from the API to readable labels
const CATEGORY_MAP = [
  { key: 'communicationSkills', label: 'Communication Skills' },
  { key: 'technicalKnowledge',  label: 'Technical Knowledge'  },
  { key: 'problemSolving',      label: 'Problem Solving'       },
  { key: 'codeQuality',         label: 'Code Quality'          },
  { key: 'confidence',          label: 'Confidence'            },
];

function FeedbackPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

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

  // ── Loading screen ──
  if (loading) {
    return (
      <div className="fb-loading">
        <span className="fb-loading__spinner" aria-hidden="true" />
        <p className="fb-loading__text">Loading feedback…</p>
      </div>
    );
  }

  if (!interview?.feedback) return null;

  const { feedback, role, overallScore, createdAt } = interview;
  const { categoryScores, strengths, areasOfImprovement, finalAssessment } = feedback;

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
  });

  // Decide a label based on the overall score
  const scoreLabel =
    overallScore >= 80 ? 'Excellent'  :
    overallScore >= 60 ? 'Good'       :
    overallScore >= 40 ? 'Fair'       : 'Needs Work';

  return (
    <div className="fb-root">
      <div className="fb-orb fb-orb--amber" aria-hidden="true" />
      <div className="fb-orb fb-orb--blue"  aria-hidden="true" />

      <div className="fb-inner">

        {/* ── Page header ── */}
        <header className="fb-header">
          <p className="fb-header__eyebrow">Interview Complete</p>
          <h1 className="fb-header__heading">
            Your <em className="fb-header__accent">Feedback</em>
          </h1>
          <p className="fb-header__meta">
            <span className="fb-header__role">{role}</span>
            <span className="fb-header__sep" aria-hidden="true">·</span>
            <span className="fb-header__date">{formattedDate}</span>
          </p>
        </header>

        {/* ── Overall score hero ── */}
        <section className="fb-score-hero" aria-label="Overall score">
          <div
            className="fb-score-ring"
            style={{ '--ring-color': getScoreColor(overallScore) }}
          >
            <span
              className="fb-score-ring__number"
              style={{ color: getScoreColor(overallScore) }}
            >
              {overallScore}
            </span>
            <span className="fb-score-ring__denom">/100</span>
          </div>

          <div className="fb-score-meta">
            <p className="fb-score-meta__label">Overall Score</p>
            <p
              className="fb-score-meta__verdict"
              style={{ color: getScoreColor(overallScore) }}
            >
              <BsStarFill aria-hidden="true" />
              {scoreLabel}
            </p>
          </div>
        </section>

        {/* ── Category breakdown ── */}
        {categoryScores && (
          <section className="fb-section">
            <h2 className="fb-section__heading">Category Breakdown</h2>
            <div className="fb-categories-grid">
              {CATEGORY_MAP.map(({ key, label }) => (
                <ScoreCard
                  key={key}
                  label={label}
                  score={categoryScores[key]?.score ?? 0}
                  comment={categoryScores[key]?.comment}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Strengths ── */}
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

        {/* ── Areas of improvement ── */}
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

        {/* ── Action buttons ── */}
        <div className="fb-actions">
          <button className="fb-actions__primary" onClick={() => navigate('/setup')}>
            <BsArrowRepeat aria-hidden="true" />
            Retake Interview
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