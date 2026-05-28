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
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

const ITEMS_PER_PAGE = 8;

function HistoryPage() {
  const navigate = useNavigate();

  const [interviews,    setInterviews]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalEntries,  setTotalEntries]  = useState(0);
  const [clearPending,  setClearPending]  = useState(false);

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

  // Build page number list — show at most 5 pages around current
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1
  );

  return (
    <div className="his-root">
      <div className="his-orb his-orb--amber" aria-hidden="true" />
      <div className="his-orb his-orb--blue"  aria-hidden="true" />

      <div className="his-inner">

        {/* ── Page header ── */}
        <header className="his-header">
          <div className="his-header__left">
            <p className="his-header__eyebrow">Your Progress</p>
            <h1 className="his-header__heading">
              Interview <em className="his-header__accent">History</em>
            </h1>
            {totalEntries > 0 && (
              <span className="his-header__badge">
                {totalEntries} interview{totalEntries !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {interviews.length > 0 && (
            <button
              className="his-clear-btn"
              onClick={handleClearAll}
              disabled={clearPending}
              aria-label="Clear all interview history"
            >
              <MdDeleteSweep className="his-clear-btn__icon" aria-hidden="true" />
              {clearPending ? 'Clearing…' : 'Clear All'}
            </button>
          )}
        </header>

        {/* ── Loading ── */}
        {loading && (
          <div className="his-loading">
            <span className="his-loading__spinner" aria-hidden="true" />
            <p className="his-loading__text">Loading history…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && interviews.length === 0 && (
          <div className="his-empty">
            <span className="his-empty__icon" aria-hidden="true">
              <BsClipboardData />
            </span>
            <h2 className="his-empty__heading">No interviews yet</h2>
            <p className="his-empty__text">
              Your completed and in-progress interviews will all appear here.
            </p>
            <button className="his-empty__cta" onClick={() => navigate('/setup')}>
              <BsPlayCircleFill aria-hidden="true" />
              Start Your First Interview
            </button>
          </div>
        )}

        {/* ── Grid + pagination ── */}
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

            {totalPages > 1 && (
              <nav className="his-pagination" aria-label="Pagination">
                {/* Prev */}
                <button
                  className="his-page-btn his-page-btn--arrow"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <BsChevronLeft />
                </button>

                {/* Page numbers */}
                {pageNumbers.map((n, idx) => {
                  const prev = pageNumbers[idx - 1];
                  const showEllipsis = prev && n - prev > 1;
                  return (
                    <span key={n} className="his-page-group">
                      {showEllipsis && (
                        <span className="his-ellipsis">…</span>
                      )}
                      <button
                        className={`his-page-btn ${n === page ? 'his-page-btn--active' : ''}`}
                        onClick={() => setPage(n)}
                        aria-current={n === page ? 'page' : undefined}
                      >
                        {n}
                      </button>
                    </span>
                  );
                })}

                {/* Next */}
                <button
                  className="his-page-btn his-page-btn--arrow"
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
    </div>
  );
}

export default HistoryPage;