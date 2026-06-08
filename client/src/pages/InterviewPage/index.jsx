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
  BsArrowRight,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

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
  const [code,             setCode]             = useState('');
  const [codeLanguage,     setCodeLanguage]     = useState('javascript');
  const [codeEvaluation,   setCodeEvaluation]   = useState(null);
  const [currentAudio,     setCurrentAudio]     = useState(null);
  const [audioKey,         setAudioKey]         = useState(0);
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
          if (audio) { setCurrentAudio(audio); setInterviewerState(STATE_SPEAKING); }
          else { setInterviewerState(STATE_SPEAKING); setTimeout(() => setInterviewerState(STATE_LISTENING), 3000); }
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
    setTextAnswer(''); setCode(''); setCodeEvaluation(null); setShowTextFallback(false);
  };

  const processAnswerResult = (result) => {
    if (result.isComplete) {
      setFarewellMessage('Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report…');
      setInterviewerState(STATE_FAREWELL);
      if (result.audio) {
        setTimeout(() => { setCurrentAudio(result.audio); setAudioKey((p) => p + 1); }, 100);
        setTimeout(() => handleEndInterview(), 10000);
      } else { setTimeout(() => handleEndInterview(), 4000); }
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
    setSubmitting(true); setInterviewerState(STATE_THINKING);
    try {
      const result = await submitTextAnswer(id, answerText);
      processAnswerResult(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
      setInterviewerState(STATE_LISTENING);
    } finally { setSubmitting(false); }
  };

  const handleRecordingComplete = async (audioBlob) => {
    setSubmitting(true); setInterviewerState(STATE_THINKING);
    try {
      const data = await transcribeAudio(audioBlob);
      const answerText = data.text && !data.text.startsWith('[') ? data.text : 'The candidate provided a verbal response.';
      const result = await submitTextAnswer(id, answerText);
      processAnswerResult(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
      setInterviewerState(STATE_LISTENING);
    } finally { setSubmitting(false); }
  };

  const handleSubmitText = () => {
    if (!textAnswer.trim()) return toast.error('Please type your answer.');
    submitAndProcess(textAnswer);
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) return toast.error('Please write some code.');
    setSubmitting(true); setInterviewerState(STATE_THINKING);
    try {
      const result = await submitCode(id, code, codeLanguage);
      setCodeEvaluation(result.evaluation);
      toast.success(`Code evaluated: ${result.evaluation.score}/100`);
      if (result.isComplete) {
        setFarewellMessage('Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report…');
        setInterviewerState(STATE_FAREWELL);
        if (result.audio) {
          setTimeout(() => { setCurrentAudio(result.audio); setAudioKey((p) => p + 1); }, 100);
          setTimeout(() => handleEndInterview(), 10000);
        } else { setTimeout(() => handleEndInterview(), 4000); }
        return;
      }
      setTimeout(() => processAnswerResult(result), 2500);
    } catch {
      toast.error('Failed to evaluate code');
      setInterviewerState(STATE_LISTENING);
    } finally { setSubmitting(false); }
  };

  const handleEndInterview = async () => {
    setEnding(true);
    try { await endInterview(id); navigate(`/feedback/${id}`); }
    catch { toast.error('Failed to generate feedback'); }
    finally { setEnding(false); }
  };

  if (loading) {
    return (
      <div className="iv-loading">
        <div className="iv-loading__spinner" aria-hidden="true" />
        <p>Loading interview…</p>
      </div>
    );
  }

  const isCodeQuestion  = currentQuestion?.isCodeQuestion;
  const isSpeaking      = interviewerState === STATE_SPEAKING;
  const isThinking      = interviewerState === STATE_THINKING;
  const isListening     = interviewerState === STATE_LISTENING;
  const isFarewell      = interviewerState === STATE_FAREWELL;

  return (
    <div className="iv-root">

      {/* ── Progress strip — replaces old topbar ── */}
      <div className="iv-progress-strip">
        <div className="iv-progress-strip__label">
          Question {currentQuestionNum} <span>of {totalQuestions}</span>
        </div>
        <div className="iv-progress-strip__track">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`iv-progress-seg ${
                i < currentQuestionNum ? 'iv-progress-seg--done' :
                i === currentQuestionNum - 1 ? 'iv-progress-seg--active' : ''
              }`}
            />
          ))}
        </div>
        {currentQuestionNum >= totalQuestions && isListening && (
          <button
            className="iv-end-btn"
            onClick={handleEndInterview}
            disabled={ending}
          >
            {ending ? 'Generating…' : <>End Interview <BsArrowRight /></>}
          </button>
        )}
      </div>

      {/* ── Two column body ── */}
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
              <span className="iv-pill iv-pill--speaking">
                <span className="iv-pill__dot" /> Speaking
              </span>
            )}
            {isThinking && (
              <span className="iv-pill iv-pill--thinking">
                <span className="iv-pill__spin" /> Thinking…
              </span>
            )}
            {isListening && (
              <span className="iv-pill iv-pill--listening">
                <BsMicFill aria-hidden="true" /> Your turn
              </span>
            )}
            {isFarewell && (
              <span className="iv-pill iv-pill--farewell">
                <span className="iv-pill__spin" /> Wrapping up
              </span>
            )}
          </div>

          {/* Audio */}
          {currentAudio && (
            <div className="iv-audio-wrap">
              <AudioPlayer key={audioKey} audioBase64={currentAudio} autoPlay onEnded={handleAudioEnded} />
            </div>
          )}

          {/* Farewell */}
          {isFarewell && (
            <div className="iv-farewell">
              <p className="iv-farewell__text">{farewellMessage}</p>
              <div className="iv-farewell__dots" aria-hidden="true">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Speech bubble */}
          {!isFarewell && !isThinking && interviewerText && (
            <div className="iv-bubble">
              <p className="iv-bubble__text">{interviewerText}</p>
              {isListening && currentAudio && (
                <button className="iv-bubble__replay"
                  onClick={() => { setAudioKey((p) => p + 1); setInterviewerState(STATE_SPEAKING); }}>
                  ↩ Hear again
                </button>
              )}
            </div>
          )}

          {/* Question card */}
          {!isFarewell && currentQuestion && !isThinking && (
            <div className="iv-question">
              <div className="iv-question__tags">
                <span className="iv-q-tag iv-q-tag--num">Q{currentQuestionNum}</span>
                <span className="iv-q-tag">{currentQuestion.type}</span>
                {isCodeQuestion && (
                  <span className="iv-q-tag iv-q-tag--code">
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
              const n    = i + 1;
              const done = n < currentQuestionNum;
              const cur  = n === currentQuestionNum;
              return (
                <div key={i}
                  className={`iv-dot ${done ? 'iv-dot--done' : ''} ${cur ? 'iv-dot--cur' : ''}`}>
                  {done ? <BsCheck aria-hidden="true" /> : n}
                </div>
              );
            })}
          </div>

        </section>

        {/* ══ RIGHT — Answer panel ══ */}
        <section className="iv-right" aria-label="Your answer">

          {/* Placeholder */}
          {(isSpeaking || isThinking || isFarewell) && (
            <div className="iv-placeholder">
              <div className="iv-placeholder__icon" aria-hidden="true">
                {isSpeaking  && <BsMicFill />}
                {(isThinking || isFarewell) && <span className="iv-placeholder__spin" />}
              </div>
              <p className="iv-placeholder__title">
                {isSpeaking && 'Listen carefully…'}
                {isThinking && 'Processing your answer…'}
                {isFarewell && 'Generating your feedback…'}
              </p>
              <p className="iv-placeholder__sub">
                {isSpeaking && 'Natalie is speaking. Your response panel will appear when she\'s done.'}
                {isThinking && 'Natalie is reviewing your answer and preparing the next question.'}
                {isFarewell && 'Almost done! Your detailed report will be ready in a moment.'}
              </p>
            </div>
          )}

          {/* Voice / Text answer */}
          {isListening && !isCodeQuestion && (
            <div className="iv-answer">
              <div className="iv-answer__header">
                <h3 className="iv-answer__title">Your Response</h3>
                <p className="iv-answer__hint">Speak or type your answer below</p>
              </div>

              {/* Voice card */}
              <div className="iv-voice-card">
                <div className="iv-voice-card__top">
                  <span className="iv-voice-card__icon"><BsRecordCircleFill /></span>
                  <div>
                    <p className="iv-voice-card__label">Voice Answer</p>
                    <p className="iv-voice-card__hint">Speak clearly · max 5 minutes</p>
                  </div>
                </div>
                {!submitting
                  ? <VoiceRecorder onRecordingComplete={handleRecordingComplete} disabled={submitting} />
                  : <div className="iv-processing">
                      <span className="iv-processing__spin" />
                      <p>Processing your answer…</p>
                    </div>
                }
              </div>

              {/* Text fallback */}
              <div className="iv-fallback">
                <button className="iv-fallback__toggle"
                  onClick={() => setShowTextFallback((v) => !v)}>
                  <span><BsKeyboardFill /> {showTextFallback ? 'Hide text input' : 'Prefer typing instead?'}</span>
                  <span className={`iv-fallback__arrow ${showTextFallback ? 'open' : ''}`}>▾</span>
                </button>
                {showTextFallback && (
                  <div className="iv-fallback__body">
                    <textarea className="iv-textarea"
                      placeholder="Type your answer here…"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      rows={5} disabled={submitting} />
                    <button className="iv-submit-btn" onClick={handleSubmitText}
                      disabled={submitting || !textAnswer.trim()}>
                      {submitting ? 'Submitting…' : 'Submit Answer'}
                      {!submitting && <BsArrowRight />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code answer */}
          {isListening && isCodeQuestion && (
            <div className="iv-code-panel">
              <div className="iv-code-panel__header">
                <h3 className="iv-code-panel__title">
                  <BsCodeSlash />
                  {currentQuestion.codeType === 'fix' ? 'Fix the Code'
                    : currentQuestion.codeType === 'explain' ? 'Explain the Code'
                    : 'Write Your Solution'}
                </h3>
                <select className="iv-lang-select" value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              {currentQuestion.codeSnippet && (
                <div className="iv-snippet">
                  <p className="iv-snippet__label">
                    {currentQuestion.codeType === 'fix' ? 'Buggy Code' : 'Code to Explain'}
                  </p>
                  <pre className="iv-snippet__pre">{currentQuestion.codeSnippet}</pre>
                </div>
              )}

              {currentQuestion.codeType !== 'explain' ? (
                <>
                  <div className="iv-editor-wrap">
                    <CodeEditor
                      value={code || (currentQuestion.codeType === 'fix' ? currentQuestion.codeSnippet || '' : '')}
                      onChange={(val) => setCode(val || '')}
                      language={currentQuestion.codeLanguage || codeLanguage}
                    />
                  </div>
                  <button className="iv-submit-btn" onClick={handleSubmitCode}
                    disabled={submitting || !code.trim()}>
                    {submitting ? 'Evaluating…'
                      : currentQuestion.codeType === 'fix' ? 'Submit Fixed Code'
                      : 'Submit Solution'}
                    {!submitting && <BsArrowRight />}
                  </button>
                </>
              ) : (
                <div className="iv-explain">
                  <p className="iv-explain__hint">Explain verbally or type below.</p>
                  {!submitting
                    ? <VoiceRecorder onRecordingComplete={async (blob) => {
                        setSubmitting(true); setInterviewerState(STATE_THINKING);
                        try {
                          const data = await transcribeAudio(blob);
                          const text = data.text || 'Verbal explanation provided.';
                          setCode(text); setTimeout(() => handleSubmitCode(), 100);
                        } catch { setCode('Verbal explanation provided.'); setTimeout(() => handleSubmitCode(), 100); }
                      }} disabled={submitting} />
                    : <div className="iv-processing"><span className="iv-processing__spin" /><p>Processing…</p></div>
                  }
                  <div className="iv-fallback">
                    <button className="iv-fallback__toggle" onClick={() => setShowTextFallback((v) => !v)}>
                      <span><BsKeyboardFill /> {showTextFallback ? 'Hide' : 'Prefer typing?'}</span>
                      <span className={`iv-fallback__arrow ${showTextFallback ? 'open' : ''}`}>▾</span>
                    </button>
                    {showTextFallback && (
                      <div className="iv-fallback__body">
                        <textarea className="iv-textarea" placeholder="Type your explanation…"
                          value={code} onChange={(e) => setCode(e.target.value)}
                          rows={5} disabled={submitting} />
                        <button className="iv-submit-btn" onClick={handleSubmitCode}
                          disabled={submitting || !code.trim()}>
                          {submitting ? 'Evaluating…' : 'Submit Explanation'} {!submitting && <BsArrowRight />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {codeEvaluation && (
                <div className={`iv-eval ${codeEvaluation.isCorrect ? 'iv-eval--ok' : 'iv-eval--fail'}`}>
                  <div className="iv-eval__top">
                    <span className="iv-eval__verdict">
                      {codeEvaluation.isCorrect
                        ? <><BsCheckCircleFill /> Correct</>
                        : <><BsXCircleFill /> Needs Improvement</>}
                    </span>
                    <span className="iv-eval__score">{codeEvaluation.score}/100</span>
                  </div>
                  <p className="iv-eval__feedback">{codeEvaluation.feedback}</p>
                  {codeEvaluation.suggestions && (
                    <p className="iv-eval__tip"><strong>Tip:</strong> {codeEvaluation.suggestions}</p>
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