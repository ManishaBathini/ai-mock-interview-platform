import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getInterview,
  submitTextAnswer,
  transcribeAudio,
  submitCode,
  endInterview,
} from '../../services/interviewService.js';
import VoiceRecorder from '../../components/VoiceRecorder';
import AudioPlayer   from '../../components/AudioPlayer';
import CodeEditor    from '../../components/CodeEditor';
import { FaUserTie } from 'react-icons/fa';
import {
  BsRecordCircleFill,
  BsKeyboardFill,
  BsCodeSlash,
  BsCheck,
  BsCheckCircleFill,
  BsXCircleFill,
  BsMicFill,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

// Interviewer state constants
const STATE_SPEAKING  = 'speaking';
const STATE_THINKING  = 'thinking';
const STATE_LISTENING = 'listening';
const STATE_FAREWELL  = 'farewell';

function InterviewPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ending,     setEnding]     = useState(false);

  const [interviewerState, setInterviewerState] = useState(STATE_SPEAKING);

  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textAnswer,       setTextAnswer]       = useState('');

  const [code,           setCode]           = useState('');
  const [codeLanguage,   setCodeLanguage]   = useState('javascript');
  const [codeEvaluation, setCodeEvaluation] = useState(null);

  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioKey,     setAudioKey]     = useState(0);

  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);
  const [totalQuestions,     setTotalQuestions]     = useState(5);
  const [currentQuestion,    setCurrentQuestion]    = useState(null);
  const [interviewerText,    setInterviewerText]    = useState('');
  const [farewellMessage,    setFarewellMessage]    = useState('');

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const data = await getInterview(id);
        setCurrentQuestionNum(data.currentQuestion);
        setTotalQuestions(data.totalQuestions);

        if (data.questions?.length > 0) {
          const idx = data.currentQuestion - 1;
          setCurrentQuestion(data.questions[idx] || data.questions[0]);
        }

        const interviewerMsgs = data.messages.filter((m) => m.role === 'interviewer');
        if (data.currentQuestion === 1 && interviewerMsgs.length >= 1) {
          setInterviewerText(interviewerMsgs[0].content);
        } else if (interviewerMsgs.length > 0) {
          setInterviewerText(interviewerMsgs[interviewerMsgs.length - 1].content);
        }

        if (data.currentQuestion === 1) {
          const audio = location.state?.audio || data.lastAudio;
          if (audio) {
            setCurrentAudio(audio);
            setInterviewerState(STATE_SPEAKING);
          } else {
            setInterviewerState(STATE_SPEAKING);
            setTimeout(() => setInterviewerState(STATE_LISTENING), 3000);
          }
        } else {
          setInterviewerState(STATE_LISTENING);
        }
      } catch {
        toast.error('Failed to load interview');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    loadInterview();
  }, [id, navigate, location.state]);

  const handleAudioEnded = () => {
    if (interviewerState === STATE_FAREWELL) return;
    setTimeout(() => setInterviewerState(STATE_LISTENING), 3000);
  };

  const resetAnswerFields = () => {
    setTextAnswer('');
    setCode('');
    setCodeEvaluation(null);
    setShowTextFallback(false);
  };

  const processAnswerResult = (result) => {
    if (result.isComplete) {
      setFarewellMessage(
        'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report…'
      );
      setInterviewerState(STATE_FAREWELL);
      if (result.audio) {
        setTimeout(() => {
          setCurrentAudio(result.audio);
          setAudioKey((p) => p + 1);
        }, 100);
        setTimeout(() => handleEndInterview(), 10000);
      } else {
        setTimeout(() => handleEndInterview(), 4000);
      }
      return;
    }

    setInterviewerText(result.response);
    setCurrentQuestionNum(result.currentQuestion);
    setCurrentQuestion(result.question);
    setCurrentAudio(result.audio);
    setAudioKey((p) => p + 1);
    resetAnswerFields();
    setInterviewerState(STATE_SPEAKING);
    if (!result.audio) setTimeout(() => setInterviewerState(STATE_LISTENING), 3000);
  };

  const submitAndProcess = async (answerText) => {
    setSubmitting(true);
    setInterviewerState(STATE_THINKING);
    try {
      const result = await submitTextAnswer(id, answerText);
      processAnswerResult(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
      setInterviewerState(STATE_LISTENING);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordingComplete = async (audioBlob) => {
    setSubmitting(true);
    setInterviewerState(STATE_THINKING);
    try {
      const data       = await transcribeAudio(audioBlob);
      const answerText = data.text && !data.text.startsWith('[')
        ? data.text
        : 'The candidate provided a verbal response.';
      const result = await submitTextAnswer(id, answerText);
      processAnswerResult(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
      setInterviewerState(STATE_LISTENING);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitText = () => {
    if (!textAnswer.trim()) return toast.error('Please type your answer.');
    submitAndProcess(textAnswer);
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) return toast.error('Please write some code.');
    setSubmitting(true);
    setInterviewerState(STATE_THINKING);
    try {
      const result = await submitCode(id, code, codeLanguage);
      setCodeEvaluation(result.evaluation);
      toast.success(`Code evaluated: ${result.evaluation.score}/100`);

      if (result.isComplete) {
        setFarewellMessage(
          'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report…'
        );
        setInterviewerState(STATE_FAREWELL);
        if (result.audio) {
          setTimeout(() => { setCurrentAudio(result.audio); setAudioKey((p) => p + 1); }, 100);
          setTimeout(() => handleEndInterview(), 10000);
        } else {
          setTimeout(() => handleEndInterview(), 4000);
        }
        return;
      }
      setTimeout(() => processAnswerResult(result), 2500);
    } catch {
      toast.error('Failed to evaluate code');
      setInterviewerState(STATE_LISTENING);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndInterview = async () => {
    setEnding(true);
    try {
      await endInterview(id);
      navigate(`/feedback/${id}`);
    } catch {
      toast.error('Failed to generate feedback');
    } finally {
      setEnding(false);
    }
  };

  // ── Loading screen ──
  if (loading) {
    return (
      <div className="iv-loading">
        <span className="iv-loading__spinner" aria-hidden="true" />
        <p className="iv-loading__text">Loading interview…</p>
      </div>
    );
  }

  const isCodeQuestion  = currentQuestion?.isCodeQuestion;
  const progressPercent = (currentQuestionNum / totalQuestions) * 100;
  const isSpeaking      = interviewerState === STATE_SPEAKING;
  const isThinking      = interviewerState === STATE_THINKING;
  const isListening     = interviewerState === STATE_LISTENING;
  const isFarewell      = interviewerState === STATE_FAREWELL;

  return (
    <div className="iv-root">

      {/* ── Top bar ── */}
      <header className="iv-topbar">

        {/* Brand */}
        <div className="iv-topbar__brand">
          <span className="iv-topbar__dot" aria-hidden="true" />
          <span className="iv-topbar__name">InterviewAI</span>
        </div>

        {/* Progress */}
        <div className="iv-topbar__progress">
          <span className="iv-topbar__q-label">
            Question {currentQuestionNum} of {totalQuestions}
          </span>
          <div className="iv-progress-track" role="progressbar"
            aria-valuenow={currentQuestionNum} aria-valuemax={totalQuestions}>
            <div className="iv-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* End button */}
        <div className="iv-topbar__actions">
          {currentQuestionNum >= totalQuestions && isListening && (
            <button
              className="iv-end-btn"
              onClick={handleEndInterview}
              disabled={ending}
              aria-busy={ending}
            >
              {ending ? (
                <><span className="iv-end-btn__spinner" aria-hidden="true" /> Generating…</>
              ) : 'End Interview'}
            </button>
          )}
        </div>
      </header>

      {/* ── Main two-column body ── */}
      <main className="iv-body">

        {/* ══ LEFT — Interviewer panel ══ */}
        <section className="iv-left" aria-label="Interviewer">

          {/* Avatar */}
          <div className="iv-avatar">
            <div className={`iv-avatar__ring ${isSpeaking ? 'iv-avatar__ring--pulse' : ''}`}>
              <div className="iv-avatar__circle">
                <FaUserTie className="iv-avatar__icon" aria-hidden="true" />
              </div>
            </div>
            <div className="iv-avatar__info">
              <p className="iv-avatar__name">Natalie</p>
              <p className="iv-avatar__role">AI Interviewer</p>
            </div>
          </div>

          {/* Status pill */}
          <div className="iv-status">
            {isSpeaking && (
              <span className="iv-status__pill iv-status__pill--speaking">
                <span className="iv-status__blink" aria-hidden="true" />
                Speaking
              </span>
            )}
            {isThinking && (
              <span className="iv-status__pill iv-status__pill--thinking">
                <span className="iv-status__spinner" aria-hidden="true" />
                Thinking
              </span>
            )}
            {isListening && (
              <span className="iv-status__pill iv-status__pill--listening">
                <BsMicFill aria-hidden="true" />
                Your turn
              </span>
            )}
            {isFarewell && (
              <span className="iv-status__pill iv-status__pill--farewell">
                <span className="iv-status__spinner" aria-hidden="true" />
                Wrapping up
              </span>
            )}
          </div>

          {/* Audio player */}
          {currentAudio && (
            <div className="iv-audio-wrap">
              <AudioPlayer
                key={audioKey}
                audioBase64={currentAudio}
                autoPlay={true}
                onEnded={handleAudioEnded}
              />
            </div>
          )}

          {/* Farewell message */}
          {isFarewell && (
            <div className="iv-farewell">
              <p className="iv-farewell__text">{farewellMessage}</p>
              <span className="iv-farewell__spinner" aria-hidden="true" />
            </div>
          )}

          {/* Interviewer speech bubble */}
          {!isFarewell && !isThinking && interviewerText && (
            <div className="iv-bubble">
              <p className="iv-bubble__text">{interviewerText}</p>
              {isListening && currentAudio && (
                <button
                  className="iv-bubble__replay"
                  onClick={() => { setAudioKey((p) => p + 1); setInterviewerState(STATE_SPEAKING); }}
                >
                  ↩ Hear again
                </button>
              )}
            </div>
          )}

          {/* Question callout */}
          {!isFarewell && currentQuestion && !isThinking && (
            <div className="iv-question">
              <div className="iv-question__badges">
                <span className="iv-question__num">Q{currentQuestionNum}</span>
                <span className="iv-question__type">{currentQuestion.type}</span>
                {isCodeQuestion && (
                  <span className="iv-question__code-tag">
                    <BsCodeSlash aria-hidden="true" /> Code
                  </span>
                )}
              </div>
              <p className="iv-question__text">{currentQuestion.text}</p>
            </div>
          )}

          {/* Timeline dots */}
          <div className="iv-timeline" aria-label="Progress">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const n          = i + 1;
              const isAnswered = n < currentQuestionNum;
              const isCurrent  = n === currentQuestionNum;
              return (
                <div
                  key={i}
                  className={[
                    'iv-dot',
                    isAnswered ? 'iv-dot--done'    : '',
                    isCurrent  ? 'iv-dot--current' : '',
                  ].join(' ')}
                  aria-label={`Question ${n}${isAnswered ? ' (answered)' : isCurrent ? ' (current)' : ''}`}
                >
                  {isAnswered ? <BsCheck aria-hidden="true" /> : n}
                </div>
              );
            })}
          </div>

        </section>

        {/* ══ RIGHT — Answer panel ══ */}
        <section className="iv-right" aria-label="Your answer">

          {/* Speaking / thinking / farewell placeholder */}
          {(isSpeaking || isThinking || isFarewell) && (
            <div className="iv-right__placeholder">
              <div className="iv-placeholder__icon" aria-hidden="true">
                {isSpeaking  && <BsMicFill />}
                {isThinking  && <span className="iv-placeholder__spinner" />}
                {isFarewell  && <span className="iv-placeholder__spinner" />}
              </div>
              <p className="iv-placeholder__text">
                {isSpeaking && 'Listen carefully to Natalie…'}
                {isThinking && 'Natalie is preparing the next question…'}
                {isFarewell && 'Generating your feedback report…'}
              </p>
            </div>
          )}

          {/* ── Listening: voice or text answers ── */}
          {isListening && !isCodeQuestion && (
            <div className="iv-answer-block">

              {/* Voice section */}
              <div className="iv-voice">
                <div className="iv-voice__header">
                  <BsRecordCircleFill className="iv-voice__icon" aria-hidden="true" />
                  <div>
                    <h3 className="iv-voice__title">Record Your Answer</h3>
                    <p className="iv-voice__hint">Speak clearly — max 5 minutes</p>
                  </div>
                </div>

                <div className="iv-voice__recorder">
                  {!submitting ? (
                    <VoiceRecorder onRecordingComplete={handleRecordingComplete} disabled={submitting} />
                  ) : (
                    <div className="iv-processing">
                      <span className="iv-processing__spinner" aria-hidden="true" />
                      <p className="iv-processing__text">Processing your answer…</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Text fallback */}
              <div className="iv-text-fallback">
                <button
                  className="iv-text-fallback__toggle"
                  onClick={() => setShowTextFallback((v) => !v)}
                >
                  <span className="iv-text-fallback__label">
                    <BsKeyboardFill aria-hidden="true" />
                    {showTextFallback ? 'Hide text input' : 'Prefer typing instead?'}
                  </span>
                  <span className={`iv-text-fallback__arrow ${showTextFallback ? 'iv-text-fallback__arrow--open' : ''}`}>
                    ▾
                  </span>
                </button>

                {showTextFallback && (
                  <div className="iv-text-area-block">
                    <textarea
                      className="iv-textarea"
                      placeholder="Type your answer here…"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      rows={5}
                      disabled={submitting}
                    />
                    <button
                      className="iv-submit-btn"
                      onClick={handleSubmitText}
                      disabled={submitting || !textAnswer.trim()}
                    >
                      {submitting ? 'Submitting…' : 'Submit Answer'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Listening: code questions ── */}
          {isListening && isCodeQuestion && (
            <div className="iv-code-block">

              <div className="iv-code-block__header">
                <h3 className="iv-code-block__title">
                  <BsCodeSlash aria-hidden="true" />
                  {currentQuestion.codeType === 'fix'
                    ? 'Fix the Code'
                    : currentQuestion.codeType === 'explain'
                    ? 'Explain the Code'
                    : 'Write Your Solution'}
                </h3>
                <select
                  className="iv-lang-select"
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              {/* Snippet display */}
              {currentQuestion.codeSnippet && (
                <div className="iv-snippet">
                  <p className="iv-snippet__label">
                    {currentQuestion.codeType === 'fix' ? 'Buggy Code' : 'Code to Explain'}
                  </p>
                  <pre className="iv-snippet__pre">{currentQuestion.codeSnippet}</pre>
                </div>
              )}

              {/* Code editor or explain mode */}
              {currentQuestion.codeType !== 'explain' ? (
                <>
                  <div className="iv-editor-wrap">
                    <CodeEditor
                      value={code || (currentQuestion.codeType === 'fix' ? currentQuestion.codeSnippet || '' : '')}
                      onChange={(val) => setCode(val || '')}
                      language={currentQuestion.codeLanguage || codeLanguage}
                    />
                  </div>
                  <button
                    className="iv-submit-btn"
                    onClick={handleSubmitCode}
                    disabled={submitting || !code.trim()}
                  >
                    {submitting
                      ? 'Evaluating…'
                      : currentQuestion.codeType === 'fix'
                      ? 'Submit Fixed Code'
                      : 'Submit Solution'}
                  </button>
                </>
              ) : (
                <div className="iv-explain-block">
                  <p className="iv-explain-block__hint">
                    Explain verbally what this code does, or type your explanation below.
                  </p>
                  <div className="iv-voice__recorder">
                    {!submitting ? (
                      <VoiceRecorder
                        onRecordingComplete={async (audioBlob) => {
                          setSubmitting(true);
                          setInterviewerState(STATE_THINKING);
                          try {
                            const data = await transcribeAudio(audioBlob);
                            const text = data.text || 'Verbal explanation provided.';
                            setCode(text);
                            setTimeout(() => handleSubmitCode(), 100);
                          } catch {
                            setCode('Verbal explanation provided.');
                            setTimeout(() => handleSubmitCode(), 100);
                          }
                        }}
                        disabled={submitting}
                      />
                    ) : (
                      <div className="iv-processing">
                        <span className="iv-processing__spinner" aria-hidden="true" />
                        <p className="iv-processing__text">Processing your explanation…</p>
                      </div>
                    )}
                  </div>

                  {/* Text fallback inside explain */}
                  <div className="iv-text-fallback">
                    <button
                      className="iv-text-fallback__toggle"
                      onClick={() => setShowTextFallback((v) => !v)}
                    >
                      <span className="iv-text-fallback__label">
                        <BsKeyboardFill aria-hidden="true" />
                        {showTextFallback ? 'Hide' : 'Prefer typing your explanation?'}
                      </span>
                      <span className={`iv-text-fallback__arrow ${showTextFallback ? 'iv-text-fallback__arrow--open' : ''}`}>
                        ▾
                      </span>
                    </button>
                    {showTextFallback && (
                      <div className="iv-text-area-block">
                        <textarea
                          className="iv-textarea"
                          placeholder="Type your explanation…"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          rows={5}
                          disabled={submitting}
                        />
                        <button
                          className="iv-submit-btn"
                          onClick={handleSubmitCode}
                          disabled={submitting || !code.trim()}
                        >
                          {submitting ? 'Evaluating…' : 'Submit Explanation'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Code evaluation result */}
              {codeEvaluation && (
                <div className={`iv-eval ${codeEvaluation.isCorrect ? 'iv-eval--correct' : 'iv-eval--wrong'}`}>
                  <div className="iv-eval__header">
                    <span className="iv-eval__status">
                      {codeEvaluation.isCorrect
                        ? <><BsCheckCircleFill aria-hidden="true" /> Correct</>
                        : <><BsXCircleFill aria-hidden="true" /> Needs Improvement</>}
                    </span>
                    <span className="iv-eval__score">{codeEvaluation.score}/100</span>
                  </div>
                  <p className="iv-eval__feedback">{codeEvaluation.feedback}</p>
                  {codeEvaluation.suggestions && (
                    <p className="iv-eval__tip">
                      <strong>Tip:</strong> {codeEvaluation.suggestions}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default InterviewPage;