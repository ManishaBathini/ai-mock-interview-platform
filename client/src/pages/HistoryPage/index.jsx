import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
} from '../../services/historyService.js';
import InterviewCard from '../../components/InterviewCard';
import { MdDeleteSweep } from 'react-icons/md';
import {
  BsClipboardData,
  BsPlayCircleFill,
  BsChevronLeft,
  BsChevronRight,
  BsLightningChargeFill,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

const ITEMS_PER_PAGE = 8;

function HistoryPage() {
  const navigate = useNavigate();

  const [interviews,   setInterviews]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [clearPending, setClearPending] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getHistory(page, ITEMS_PER_PAGE);
        setInterviews(data.entries);
        setTotalPages(data.totalPages);
        setTotalEntries(data.totalEntries);
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      setInterviews((prev) => prev.filter((item) => item._id !== id));
      setTotalEntries((prev) => prev - 1);
      toast.success('Interview deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all interviews? This cannot be undone.')) return;
    setClearPending(true);
    try {
      await clearHistory();
      setInterviews([]);
      setTotalEntries(0);
      toast.success('All history cleared');
    } catch {
      toast.error('Failed to clear history');
    } finally {
      setClearPending(false);
    }
  };

  const handleCardClick = (interview) => {
    if (interview.status === 'completed') {
      navigate(`/feedback/${interview._id}`);
    } else {
      navigate(`/interview/${interview._id}`);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1
  );

  return (
    <div className="his-page">
      {/* ── Header ── */}
      <header className="his-topbar">
        <div className="his-topbar__left">
          <p className="his-topbar__eyebrow">Your Progress</p>
          <h1 className="his-topbar__heading">
            Interview <em className="his-topbar__accent">History</em>
          </h1>
          {totalEntries > 0 && (
            <p className="his-topbar__sub">
              {totalEntries} interview{totalEntries !== 1 ? 's' : ''} recorded
            </p>
          )}
        </div>

        <div className="his-topbar__actions">
          <button
            className="his-new-btn"
            onClick={() => navigate('/setup')}
          >
            <BsLightningChargeFill aria-hidden="true" />
            New Interview
          </button>
          {interviews.length > 0 && (
            <button
              className="his-clear-btn"
              onClick={handleClearAll}
              disabled={clearPending}
              aria-label="Clear all interview history"
            >
              <MdDeleteSweep aria-hidden="true" />
              {clearPending ? 'Clearing…' : 'Clear All'}
            </button>
          )}
        </div>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="his-loading" role="status">
          <div className="his-spinner" aria-hidden="true" />
          <p>Loading history…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && interviews.length === 0 && (
        <div className="his-empty">
          <div className="his-empty__icon" aria-hidden="true">
            <BsClipboardData />
          </div>
          <h2 className="his-empty__heading">No interviews yet</h2>
          <p className="his-empty__sub">
            Your completed and in-progress interviews will all appear here.
          </p>
          <button className="his-new-btn" onClick={() => navigate('/setup')}>
            <BsPlayCircleFill aria-hidden="true" />
            Start Your First Interview
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && interviews.length > 0 && (
        <>
          <div className="his-grid">
            {interviews.map((interview) => (
              <InterviewCard
                key={interview._id}
                interview={interview}
                onClick={() => handleCardClick(interview)}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <nav className="his-pagination" aria-label="Pagination">
              <button
                className="his-pg-arrow"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <BsChevronLeft />
              </button>

              {pageNumbers.map((n, idx) => {
                const prev = pageNumbers[idx - 1];
                const showEllipsis = prev && n - prev > 1;
                return (
                  <span key={n} className="his-pg-group">
                    {showEllipsis && <span className="his-ellipsis">…</span>}
                    <button
                      className={`his-pg-num ${n === page ? 'his-pg-num--active' : ''}`}
                      onClick={() => setPage(n)}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  </span>
                );
              })}

              <button
                className="his-pg-arrow"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <BsChevronRight />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default HistoryPage;