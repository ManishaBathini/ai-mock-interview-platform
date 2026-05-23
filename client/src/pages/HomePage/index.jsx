import { useState, useEffect, useContext, useRef } from 'react';
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
  BsArrowRight,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

/* ── animated counter ── */
function useCountUp(target, duration = 900, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (target === 0) { setVal(0); return; }
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);
  return val;
}

function HomePage() {
  const { user }  = useContext(AuthContext);
  const navigate  = useNavigate();

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [allInterviews,    setAllInterviews]    = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [mounted,          setMounted]          = useState(false);
  const [statsActive,      setStatsActive]      = useState(false);
  const statsRef = useRef(null);

  /* mount trigger */
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  /* stats intersection */
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsActive(true); },
      { threshold: 0.2 }
    );
    if (statsRef.current) io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

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
    } catch (error) {
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
  const avgScore =
    allInterviews.length > 0
      ? Math.round(
          allInterviews
            .filter((i) => i.overallScore)
            .reduce((sum, i) => sum + i.overallScore, 0) /
            (allInterviews.filter((i) => i.overallScore).length || 1)
        )
      : 0;

  const cTotal     = useCountUp(allInterviews.length, 900, statsActive);
  const cCompleted = useCountUp(completedCount,       900, statsActive);
  const cAvg       = useCountUp(avgScore,             900, statsActive);

  return (
    <div className={`home-page ${mounted ? 'home-page--in' : ''}`}>

      {/* ── topbar ── */}
      <div className="home-topbar">
        <span className="home-topbar-brand">AI Interview Coach</span>
        <span className="home-topbar-div" />
        <span className="home-topbar-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* ── welcome ── */}
      <div className="home-welcome">
        <p className="home-overline">Dashboard</p>
        <h1 className="home-welcome-heading">
          <em className="home-heading-em">Hello,</em>
          <span className="home-heading-name">{user?.name?.split(' ')[0]}.</span>
        </h1>
        <p className="home-welcome-subtitle">
          Practice makes perfect. Start a mock interview and get AI-powered feedback.
        </p>
      </div>

      {/* ── stats row ── */}
      <div
        ref={statsRef}
        className={`home-stats-row ${statsActive ? 'home-stats-row--in' : ''}`}
      >
        <div className="home-stat-card" style={{ '--d': '0ms' }}>
          <BsChatSquareTextFill className="home-stat-icon" />
          <span className="home-stat-number">{cTotal}</span>
          <span className="home-stat-label">Interviews</span>
        </div>
        <div className="home-stat-rule" />
        <div className="home-stat-card" style={{ '--d': '100ms' }}>
          <BsCheckCircleFill className="home-stat-icon" />
          <span className="home-stat-number">{cCompleted}</span>
          <span className="home-stat-label">Completed</span>
        </div>
        <div className="home-stat-rule" />
        <div className="home-stat-card" style={{ '--d': '200ms' }}>
          <BsTrophyFill className="home-stat-icon" />
          <span className="home-stat-number">{cAvg}</span>
          <span className="home-stat-label">Avg Score</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="home-cta-container">
        <button className="home-start-btn" onClick={() => navigate('/setup')}>
          <BsPlayCircleFill className="home-start-icon" />
          Start New Interview
          <BsArrowRight className="home-start-arrow" />
          <span className="home-start-fill" />
        </button>
      </div>

      {/* ── recent interviews ── */}
      <div className="home-recent-section">
        <div className="home-section-header">
          <h2 className="home-section-heading">Recent Interviews</h2>
          {recentInterviews.length > 0 && (
            <button
              className="home-view-all-btn"
              onClick={() => navigate('/history')}
            >
              View all <BsArrowRight className="home-view-arrow" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="home-loading-state">
            <span className="home-spinner" />
            <p className="home-loading-text">Loading interviews…</p>
          </div>
        ) : recentInterviews.length === 0 ? (
          <div className="home-empty-state">
            <BsChatSquareText className="home-empty-icon" />
            <div className="home-empty-text-group">
              <h3 className="home-empty-heading">No interviews yet</h3>
              <p className="home-empty-text">Start your first mock interview to see it here.</p>
            </div>
            <button className="home-empty-cta-btn" onClick={() => navigate('/setup')}>
              <BsPlayCircleFill /> Begin now
            </button>
          </div>
        ) : (
          <ul className="home-interviews-list">
            {recentInterviews.map((interview, i) => (
              <li
                key={interview._id}
                className="home-interview-row"
                style={{ '--i': i }}
              >
                <InterviewCard
                  interview={interview}
                  onClick={() => handleCardClick(interview)}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default HomePage;