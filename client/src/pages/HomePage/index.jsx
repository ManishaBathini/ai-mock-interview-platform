import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getHistory, deleteHistoryItem } from '../../services/historyService.js';
import InterviewCard from '../../components/InterviewCard';
import {
  BsPlayCircleFill,
  BsChatSquareText,
  BsArrowRight,
  BsGraphUpArrow,
  BsCheckCircleFill,
  BsLightningChargeFill,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function HomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [allInterviews,    setAllInterviews]    = useState([]);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const allData = await getHistory(1, 100);
        setAllInterviews(allData.entries);
        setRecentInterviews(allData.entries.slice(0, 3));
      } catch (error) {
        console.error('Failed to load history:', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      setAllInterviews((prev) => {
        const updated = prev.filter((item) => item._id !== id);
        setRecentInterviews(updated.slice(0, 3));
        return updated;
      });
      toast.success('Interview deleted');
    } catch {
      toast.error('Failed to delete interview');
    }
  };

  const handleCardClick = (interview) => {
    if (interview.status === 'completed') {
      navigate(`/feedback/${interview._id}`);
    } else {
      navigate(`/interview/${interview._id}`);
    }
  };

  const completedCount = allInterviews.filter((i) => i.status === 'completed').length;
  const scoredItems    = allInterviews.filter((i) => i.overallScore);
  const avgScore       = scoredItems.length
    ? Math.round(scoredItems.reduce((sum, i) => sum + i.overallScore, 0) / scoredItems.length)
    : 0;

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const stats = [
    {
      icon: <BsChatSquareText />,
      label: 'Total Interviews',
      value: allInterviews.length,
      accent: 'stat--blue',
      hint: 'All time sessions',
    },
    {
      icon: <BsCheckCircleFill />,
      label: 'Completed',
      value: completedCount,
      accent: 'stat--green',
      hint: 'Fully reviewed',
    },
    {
      icon: <BsGraphUpArrow />,
      label: 'Average Score',
      value: avgScore ? `${avgScore}%` : '—',
      accent: 'stat--amber',
      hint: 'Across all sessions',
    },
  ];

  return (
    <div className="hp-page">
      {/* Ambient orbs */}
      <div className="hp-orb hp-orb--1" aria-hidden="true" />
      <div className="hp-orb hp-orb--2" aria-hidden="true" />

      {/* Top bar */}
      <header className="hp-topbar">
        <p className="hp-topbar__date">{today}</p>
        <button
          className="hp-cta hp-cta--sm"
          onClick={() => navigate('/setup')}
          aria-label="Start new interview"
        >
          <BsLightningChargeFill aria-hidden="true" />
          New Interview
        </button>
      </header>

      {/* Hero */}
      <section className="hp-hero">
        <div className="hp-hero__text">
          <p className="hp-hero__label">Dashboard</p>
          <h1 className="hp-hero__heading">
            Welcome back, <em className="hp-hero__name">{firstName}.</em>
          </h1>
          <p className="hp-hero__sub">
            Every practice session brings you closer to the role you want.
            Keep the momentum going.
          </p>
        </div>
        <button className="hp-cta" onClick={() => navigate('/setup')}>
          <BsPlayCircleFill aria-hidden="true" />
          Start New Interview
          <BsArrowRight className="hp-cta__arrow" aria-hidden="true" />
        </button>
      </section>

      {/* Stats */}
      <div className="hp-stats">
        {stats.map(({ icon, label, value, accent, hint }) => (
          <div key={label} className={`hp-stat ${accent}`}>
            <div className="hp-stat__icon" aria-hidden="true">{icon}</div>
            <div className="hp-stat__body">
              <span className="hp-stat__label">{label}</span>
              <span className="hp-stat__value">{value}</span>
              <span className="hp-stat__hint">{hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent interviews */}
      <section className="hp-recent">
        <div className="hp-recent__header">
          <h2 className="hp-recent__title">Recent Interviews</h2>
          {recentInterviews.length > 0 && (
            <button className="hp-view-all" onClick={() => navigate('/history')}>
              View all <BsArrowRight aria-hidden="true" />
            </button>
          )}
        </div>

        {loading && (
          <div className="hp-loading" role="status" aria-live="polite">
            <div className="hp-spinner" aria-hidden="true" />
            <p>Loading interviews…</p>
          </div>
        )}

        {!loading && recentInterviews.length === 0 && (
          <div className="hp-empty">
            <div className="hp-empty__icon" aria-hidden="true">
              <BsChatSquareText />
            </div>
            <h3 className="hp-empty__heading">No interviews yet</h3>
            <p className="hp-empty__sub">
              Start your first mock interview to track your progress here.
            </p>
            <button className="hp-cta hp-cta--outline" onClick={() => navigate('/setup')}>
              <BsPlayCircleFill aria-hidden="true" />
              Start Interview
            </button>
          </div>
        )}

        {!loading && recentInterviews.length > 0 && (
          <div className="hp-cards">
            {recentInterviews.map((interview) => (
              <InterviewCard
                key={interview._id}
                interview={interview}
                onClick={() => handleCardClick(interview)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;