
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getHistory, deleteHistoryItem } from '../../services/historyService.js';
import InterviewCard from '../../components/InterviewCard';
import {
  BsChatSquareTextFill,
  BsCheckCircleFill,
  BsTrophyFill,
  BsPlayCircleFill,
  BsChatSquareText,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';
 
function HomePage() {
  const { user }   = useContext(AuthContext);
  const navigate   = useNavigate();
 
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
 
  return (
    <div className="hp-page">
 
      {/* Ambient orbs — same as every page */}
      <div className="hp-orb hp-orb--amber" aria-hidden="true" />
      <div className="hp-orb hp-orb--blue"  aria-hidden="true" />
 
      {/* ── Welcome ── */}
      <div className="hp-welcome">
        <h1 className="hp-welcome__heading">
          Welcome back, <em className="hp-welcome__name">{firstName}!</em>
        </h1>
        <p className="hp-welcome__subtitle">
          Practice makes perfect. Start a mock interview and get AI-powered feedback.
        </p>
      </div>
 
      {/* ── Stats row ── */}
      <div className="hp-stats-row">
        <div className="hp-stat-card">
          <BsChatSquareTextFill className="hp-stat-card__icon" aria-hidden="true" />
          <span className="hp-stat-card__number">{allInterviews.length}</span>
          <span className="hp-stat-card__label">Interviews</span>
        </div>
        <div className="hp-stat-card">
          <BsCheckCircleFill className="hp-stat-card__icon" aria-hidden="true" />
          <span className="hp-stat-card__number">{completedCount}</span>
          <span className="hp-stat-card__label">Completed</span>
        </div>
        <div className="hp-stat-card">
          <BsTrophyFill className="hp-stat-card__icon" aria-hidden="true" />
          <span className="hp-stat-card__number">{avgScore || '—'}</span>
          <span className="hp-stat-card__label">Avg Score</span>
        </div>
      </div>
 
      {/* ── CTA button — centred ── */}
      <div className="hp-cta">
        <button className="hp-cta__btn" onClick={() => navigate('/setup')}>
          <BsPlayCircleFill className="hp-cta__icon" aria-hidden="true" />
          Start New Interview
        </button>
      </div>
 
      {/* ── Recent interviews ── */}
      <div className="hp-recent">
        <div className="hp-recent__header">
          <h2 className="hp-recent__heading">Recent Interviews</h2>
          {recentInterviews.length > 0 && (
            <button className="hp-recent__view-all" onClick={() => navigate('/history')}>
              View All
            </button>
          )}
        </div>
 
        {loading && (
          <div className="hp-loading">
            <span className="hp-loading__spinner" aria-hidden="true" />
            <p className="hp-loading__text">Loading interviews…</p>
          </div>
        )}
 
        {!loading && recentInterviews.length === 0 && (
          <div className="hp-empty">
            <BsChatSquareText className="hp-empty__icon" aria-hidden="true" />
            <h3 className="hp-empty__heading">No interviews yet</h3>
            <p className="hp-empty__text">Start your first mock interview to see it here.</p>
            <button className="hp-empty__btn" onClick={() => navigate('/setup')}>
              <BsPlayCircleFill aria-hidden="true" />
              Start Interview
            </button>
          </div>
        )}
 
        {!loading && recentInterviews.length > 0 && (
          <div className="hp-grid">
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
      </div>
 
    </div>
  );
}
 
export default HomePage;