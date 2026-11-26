import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, ShieldCheck } from 'lucide-react'
import { cyberGames } from '../data/games'

export function CyberGames() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const game = cyberGames.find(item => item.id === gameId)
  const question = game?.questions[round]

  function start(id: string) {
    setGameId(id); setRound(0); setChoice(null); setSubmitted(false); setScore(0); setFinished(false)
  }

  function back() {
    setGameId(null); setRound(0); setChoice(null); setSubmitted(false); setFinished(false)
  }

  function next() {
    if (!game || !question || choice === null) return
    const nextScore = score + (choice === question.answer ? 1 : 0)
    setScore(nextScore)
    if (round === game.questions.length - 1) { setScore(nextScore); setFinished(true); return }
    setRound(round + 1); setChoice(null); setSubmitted(false)
  }

  return <section id="games" className="games-section">
    <div className="wrap">
      <div className="academy-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> PHASE 03 / PLAY TO LEARN</div><h2>Good instincts<br /><span>are built by practice.</span></h2></div><p>Short, self-contained games turn security ideas into decisions you can remember. Every scenario here is fictional and safe to explore.</p></div>
      {game && question ? <div className="game-room">
        <button className="back-to-courses" onClick={back}><ArrowLeft size={15} /> All games</button>
        {finished ? <div className="game-finished animate-course-enter"><span className="finish-icon"><ShieldCheck size={29} /></span><div className="eyebrow">ROUND COMPLETE</div><h3>{game.title}</h3><p>You got <strong>{score} of {game.questions.length}</strong> right. Every choice is a chance to build a better habit.</p><div className="finish-actions"><button className="button-primary" onClick={() => start(game.id)}><RotateCcw size={15} /> Play again</button><button className="next-lesson" onClick={back}>Choose another game <ArrowRight size={15} /></button></div></div> : <div key={round} className="game-play animate-lesson-slide">
          <div className="game-play-top"><div><span className="path-number">{game.category}</span><h3>{game.title}</h3></div><span className="round-count">{String(round + 1).padStart(2, '0')} / {String(game.questions.length).padStart(2, '0')}</span></div>
          <div className="game-question"><div className="game-symbol">{game.icon}</div><p>{question.prompt}</p></div>
          <fieldset className="game-options"><legend className="sr-only">Choose your answer</legend>{question.options.map((option, index) => <label key={option} className={`quiz-option ${choice === index ? 'selected' : ''} ${submitted && index === question.answer ? 'correct' : ''}`}><input type="radio" name={`game-${game.id}-${round}`} checked={choice === index} onChange={() => { setChoice(index); setSubmitted(false) }} /><span className="radio-custom" />{option}</label>)}</fieldset>
          <div className="game-footer">{submitted && choice !== null && <p className={choice === question.answer ? 'quiz-feedback success' : 'quiz-feedback retry'} role="status">{choice === question.answer ? <><Check size={15} /> {question.explanation}</> : <>Take another look. {question.explanation}</>}</p>}
            {submitted && choice === question.answer ? <button className="check-answer" onClick={next}>{round === game.questions.length - 1 ? 'See your result' : 'Next clue'} <ArrowRight size={14} /></button> : <button className="check-answer" disabled={choice === null} onClick={() => setSubmitted(true)}>Check choice <ArrowRight size={14} /></button>}
          </div>
        </div>}</div> : <div className="games-grid">{cyberGames.map(item => <article className="game-card" key={item.id}><div className="academy-card-top"><span className="path-number">{item.category}</span><span className="game-icon">{item.icon}</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="game-card-bottom"><span>{item.questions.length} QUICK CHALLENGES</span><button onClick={() => start(item.id)}>Play game <ArrowRight size={14} /></button></div></article>)}</div>}
    </div>
  </section>
}
