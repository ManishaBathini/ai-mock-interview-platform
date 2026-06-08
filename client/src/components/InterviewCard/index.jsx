import { MdDelete } from 'react-icons/md';
import { BsArrowRight, BsPlayFill } from 'react-icons/bs';
import getScoreColor from '../../constants/scoreColors.js';
import './index.css';

function InterviewCard({ interview, onClick, onDelete }) {
  const date = new Date(interview.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isCompleted = interview.status === 'completed';
  const hasScore =
    interview.overallScore !== null && interview.overallScore !== undefined;

  const scoreColor = hasScore ? getScoreColor(interview.overallScore) : '#16a34a';

  return (
    <div
      className={`ic-root ${isCompleted ? 'ic--done' : 'ic--progress'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Header */}
      <div className="ic-header">
        <h3 className="ic-role">{interview.role}</h3>
        <span className={`ic-badge ${isCompleted ? 'ic-badge--done' : 'ic-badge--progress'}`}>
          {isCompleted ? 'Completed' : 'In Progress'}
        </span>
      </div>

      {/* Meta */}
      <div className="ic-meta">
        <span>{date}</span>
        <span className="ic-meta__dot" aria-hidden="true" />
        <span>{interview.totalQuestions} questions</span>
      </div>

      {/* Score OR Resume CTA */}
      {hasScore ? (
        <div className="ic-score-block">
          <div className="ic-score">
            <span className="ic-score__value" style={{ color: scoreColor }}>
              {interview.overallScore}
            </span>
            <span className="ic-score__denom">/100</span>
          </div>
          {/* Progress bar */}
          <div className="ic-bar" aria-label={`Score: ${interview.overallScore} out of 100`}>
            <div
              className="ic-bar__fill"
              style={{
                width: `${interview.overallScore}%`,
                background: scoreColor,
              }}
            />
          </div>
        </div>
      ) : (
        <button
          className="ic-resume"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label="Resume interview"
        >
          <BsPlayFill aria-hidden="true" />
          Resume Interview
        </button>
      )}

      {/* Footer */}
      <div className="ic-footer">
        <span className="ic-view">
          {isCompleted ? 'View feedback' : 'Continue'} <BsArrowRight aria-hidden="true" />
        </span>
        <button
          className="ic-delete"
          onClick={(e) => { e.stopPropagation(); onDelete(interview._id); }}
          aria-label="Delete interview"
        >
          <MdDelete aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  );
}

export default InterviewCard;