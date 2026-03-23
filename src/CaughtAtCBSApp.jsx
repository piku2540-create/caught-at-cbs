import { useEffect, useMemo, useState } from 'react'

const WORDS_RAW = `
Audi, Amphitheatre, Library Basement, Reading Room, Admin Office, Seminar Hall, Computer Lab, Ground, Badminton Court, Parking Area, Main Gate, Back Gate, Notice Board, Lift Area, Faculty Block, CR Desk, Attendance Sheet, ID Check, Security Guard, Free Period, Bansiwala, Pan Hub, Nescafe, Amul, Samosa, Maggi, Cold Coffee, Canteen Rush, Chai Break,
67% Rule, Community Hours, Attendance Shortage, Internal Marks, Assignment Submission, Presentation PPT, Case Study, Group Project, Viva, Surprise Test, Mid Sem, End Sem, Notes Sharing, PDF Drive, Last Night Study, Proxy Attendance, Backlog Fear, CGPA Tension, Topper Pressure, Internals Boost, Exam Hall, Result Day, Marks Deduction, Deadline Extension,
Proxy Lagana, Notes Bhej, Last Bench, Front Bench, CR Spam, WhatsApp Mute, LinkedIn Flex, Case Comp, Placement Brag, Mass Bunk, Bunk Fail, Faculty Roast, Freeloaders, Exam Anxiety, Sleep Class, Startup Ideas, Networking Fake, CV Building, Coffee Discussion, Random Fights, Situationship, Crush Spotting, Library Stalking, Attendance Panic, Fake Attendance, Gossip Circle, Night Study,
Deloitte, EY, KPMG, ICICI, GD Round, Case Interview, HR Round, Placement Cell, Internship Hunt, Referral Jugaad, Rejection Mail, Offer Letter, Dream Company, Mock Interview, Aptitude Test, Resume Roast, LinkedIn Post, Consulting Dream, Finance Role, Alumni Connect,
Rithala Metro, Metro Rush, Auto Wala, Rickshaw Deal, G3S Mall, Movie Bunk, Food Court, Gaming Zone, Escalator Gossip, Weekend Plan, After Chill, Metro Card, Ticket Line, Return Journey, Late Night,
180DC, Enactus, FIC, FMA, FinX, Ecolution, Markit, Convergence, Dhwani, Communique, Blitz, Anthropos, APICS, Verve, Darkroom, Literary Society, Illuminati, IFSA, IMA, Bridges, Rotaract, Parivartan, Sadhana, Prayaag, Kronos, Nucleus, Lawrence, MI, QSA, Synergy, Yuva, Dreams,
Soc Recruitments, PPT Rounds, Interview Shortlist, Core Team, General Member, OC Team, POR Flex, Soc Deadlines, Event Volunteer, Soc Politics, Cross Rivalry, Recruitment Stress,
Crescendo, Crescendo Night, DJ Night, Prom Night, Fashion Show, CBS Championship, Band War, Dance Battle, Nerf War, Laser Tag, Zorbing, Blind Dating, Alla Prima, Soc Stalls, Afterparty,
Local Train, Euphoria, Jal Band, Astitva, Amritva, Millind Gaba, KR$NA, DJ Ravator, DJ Sahil, DJ Rawal, Bharg, Live Concert, Crowd Hype, Front Row, Flashlight
`

const CONFUSION_PAIRS_RAW = `
Audi|Seminar Hall, Nescafe|Amul, Samosa|Maggi, Cold Coffee|Chai Break, Library Basement|Reading Room, Ground|Badminton Court, Bansiwala|Pan Hub, Rithala Metro|Metro Station, G3S Mall|Mall, Proxy|Bunk, 67% Rule|Attendance Shortage, Community Hours|Punishment, Assignment|Case Study, Presentation|Viva, Deloitte|EY, KPMG|ICICI, GD Round|Interview, Resume|CV, FinX|FMA, Enactus|180DC, Blitz|Dhwani, Markit|Convergence, Kronos|Nucleus
`

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function parseWords(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseConfusionPairs(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [a, b] = pair.split('|').map((x) => x.trim())
      if (!a || !b) return null
      return { a, b }
    })
    .filter(Boolean)
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function GlassButton({ children, onClick, variant = 'primary', disabled }) {
  return (
    <button type="button" className={`btn ${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export default function CaughtAtCBSApp() {
  const WORDS = useMemo(() => parseWords(WORDS_RAW), [])
  const CONFUSION_PAIRS = useMemo(() => parseConfusionPairs(CONFUSION_PAIRS_RAW), [])

  const [phase, setPhase] = useState('lobby') // lobby -> turns -> discussion -> results
  const [playerCount, setPlayerCount] = useState(5)
  const [nameInputs, setNameInputs] = useState(() => Array(5).fill(''))

  const [players, setPlayers] = useState([])
  const [imposterId, setImposterId] = useState(null)
  const [targetWord, setTargetWord] = useState('')
  const [imposterWord, setImposterWord] = useState('')
  const [confusionUsed, setConfusionUsed] = useState(false)

  const [turnIndex, setTurnIndex] = useState(0)
  const [revealVisible, setRevealVisible] = useState(false)

  useEffect(() => {
    setNameInputs((prev) => {
      const next = Array(playerCount).fill('')
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i]
      return next
    })
  }, [playerCount])

  const canStart = useMemo(() => {
    const cleaned = nameInputs.map((n) => n.trim())
    if (playerCount < 3 || playerCount > 15) return false
    if (cleaned.some((n) => !n)) return false
    const lowered = cleaned.map((n) => n.toLowerCase())
    return new Set(lowered).size === playerCount
  }, [nameInputs, playerCount])

  function startGame() {
    const cleaned = nameInputs.map((n) => n.trim())
    if (cleaned.some((n) => !n)) {
      alert(`Fill all ${playerCount} player names first.`)
      return
    }

    const newPlayers = cleaned.slice(0, 15).map((name, idx) => ({
      id: newId(),
      name,
      order: idx,
    }))

    const chosenImposter = pickRandom(newPlayers)
    const useConfusion = Math.random() < 0.2 // 20% confusion mode

    // Logic requirement:
    // - Members see the selected target word.
    // - Imposter never sees the selected target word.
    // - In confusion mode, imposter sees a different word.
    let chosenTargetWord = pickRandom(WORDS)
    let chosenImposterWord = '' // default: imposter has NO word visible in normal mode

    if (useConfusion && CONFUSION_PAIRS.length > 0) {
      const pair = pickRandom(CONFUSION_PAIRS)
      const flip = Math.random() < 0.5
      chosenTargetWord = flip ? pair.a : pair.b
      chosenImposterWord = flip ? pair.b : pair.a
    }

    setPlayers(newPlayers)
    setImposterId(chosenImposter.id)
    setTargetWord(chosenTargetWord)
    setImposterWord(chosenImposterWord)
    setConfusionUsed(Boolean(chosenImposterWord))
    setTurnIndex(0)
    setRevealVisible(false)
    setPhase('turns')
  }

  function playSfx(_key) {
    // Optional sound hook placeholder (wire an actual audio file later if desired).
  }

  function handleTapReveal() {
    playSfx('reveal')
    setRevealVisible(true)
  }

  function handleHidePass() {
    playSfx('pass')
    setRevealVisible(false)
    const next = turnIndex + 1
    if (next >= players.length) {
      setPhase('discussionStart')
      return
    }
    setTurnIndex(next)
  }

  function startDiscussion() {
    playSfx('start_discussion')
    setPhase('discussion')
  }

  function resetToLobby() {
    setPhase('lobby')
    setPlayers([])
    setImposterId(null)
    setTargetWord('')
    setImposterWord('')
    setConfusionUsed(false)
    setTurnIndex(0)
    setRevealVisible(false)
  }

  const activePlayer = players[turnIndex]
  const activeIsImposter = Boolean(activePlayer && activePlayer.id === imposterId)

  const styles = `
    :root { color-scheme: dark; }
    .app {
      min-height: 100svh;
      padding: 18px 14px 28px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      background:
        radial-gradient(900px 520px at 50% -120px, rgba(170, 59, 255, 0.40), transparent 55%),
        radial-gradient(760px 520px at 20% 120%, rgba(56, 189, 248, 0.28), transparent 58%),
        linear-gradient(180deg, #000 0%, #070312 35%, #050611 70%, #000814 100%);
    }
    .shell {
      width: 100%;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .brand {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 10px;
      margin-top: 6px;
    }
    .brand h1 {
      margin: 0;
      font-size: clamp(30px, 7vw, 44px);
      letter-spacing: -1.3px;
      font-weight: 900;
      color: #efe9ff;
      text-shadow:
        0 0 18px rgba(170, 59, 255, 0.35),
        0 0 42px rgba(56, 189, 248, 0.18);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(192, 132, 252, 0.25);
      color: rgba(239,233,255,0.92);
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.2px;
      user-select: none;
      white-space: nowrap;
    }
    .panel {
      border-radius: 26px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(192, 132, 252, 0.40);
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.12),
        rgba(170, 59, 255, 0.28) 0 22px 70px -45px,
        rgba(0, 0, 0, 0.35) 0 10px 35px -15px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }
    .panel:hover {
      transform: translateY(-1px);
      border-color: rgba(56, 189, 248, 0.55);
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.18),
        rgba(170, 59, 255, 0.30) 0 26px 80px -50px,
        rgba(0, 0, 0, 0.38) 0 12px 40px -18px;
    }
    .panel.compact { padding: 14px; border-radius: 22px; }
    .section-title {
      margin: 0 0 10px;
      font-size: 22px;
      color: rgba(239, 233, 255, 0.96);
      font-weight: 1000;
      letter-spacing: -0.4px;
    }
    .hint {
      color: rgba(239, 233, 255, 0.72);
      font-size: 14px;
      line-height: 1.4;
      margin-top: 6px;
    }
    .grid {
      display: grid;
      gap: 10px;
      grid-template-columns: 1fr;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    label {
      color: rgba(239,233,255,0.85);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }
    input[type="text"] {
      width: 100%;
      padding: 14px 14px;
      border-radius: 16px;
      border: 1px solid rgba(56, 189, 248, 0.25);
      background: rgba(255,255,255,0.06);
      color: rgba(239,233,255,0.95);
      outline: none;
      font-weight: 800;
      letter-spacing: 0.1px;
      box-shadow: inset 0 0 0 1px rgba(170, 59, 255, 0.08);
    }
    input[type="text"]::placeholder { color: rgba(239,233,255,0.35); font-weight: 700; }
    input[type="text"]:focus {
      border-color: rgba(192, 132, 252, 0.55);
      box-shadow: 0 0 0 4px rgba(192, 132, 252, 0.15);
    }
    .row {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
    .stepper {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .stepper .value {
      min-width: 36px;
      text-align: center;
      font-weight: 900;
      color: rgba(239,233,255,0.95);
      font-size: 16px;
    }
    .stepper button {
      width: 40px;
      height: 40px;
      border-radius: 14px;
      border: 1px solid rgba(192, 132, 252, 0.35);
      background: rgba(255,255,255,0.06);
      color: rgba(239,233,255,0.95);
      font-weight: 900;
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.08s ease;
    }
    .stepper button:active { transform: scale(0.98); }
    .btn {
      width: 100%;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(192, 132, 252, 0.35);
      cursor: pointer;
      font-weight: 950;
      letter-spacing: 0.2px;
      font-size: 16px;
      color: rgba(255,255,255,0.95);
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.10),
        0 18px 45px rgba(0,0,0,0.25);
      transition: transform 0.08s ease, filter 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      user-select: none;
    }
    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      filter: grayscale(20%);
    }
    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: rgba(56, 189, 248, 0.58);
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.16),
        0 0 26px rgba(170, 59, 255, 0.20),
        0 22px 60px rgba(0,0,0,0.30);
      filter: brightness(1.05);
    }
    .btn.primary {
      background: linear-gradient(135deg, rgba(170, 59, 255, 0.95), rgba(56, 189, 248, 0.85));
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.12),
        0 0 28px rgba(170, 59, 255, 0.28),
        0 12px 30px rgba(170, 59, 255, 0.22),
        0 8px 22px rgba(56, 189, 248, 0.16);
    }
    .btn.secondary {
      background: rgba(255,255,255,0.06);
      border-color: rgba(192, 132, 252, 0.35);
      color: rgba(239,233,255,0.95);
    }
    .btn.ghost {
      background: transparent;
      border-color: rgba(239,233,255,0.25);
      color: rgba(239,233,255,0.92);
    }
    .btn:active { transform: scale(0.99); }
    .big-word {
      font-size: clamp(28px, 7vw, 40px);
      font-weight: 1000;
      letter-spacing: -1px;
      color: #f0eaff;
      text-shadow: 0 0 20px rgba(170, 59, 255, 0.3);
      margin: 10px 0 4px;
      word-break: break-word;
    }
    .role-message {
      font-size: 18px;
      font-weight: 1000;
      letter-spacing: -0.3px;
      color: rgba(239, 233, 255, 0.97);
      text-shadow: 0 0 18px rgba(56, 189, 248, 0.18);
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 12px;
      border-radius: 999px;
      font-weight: 1000;
      letter-spacing: 0.3px;
      border: 1px solid rgba(56, 189, 248, 0.35);
      background: rgba(56, 189, 248, 0.12);
      color: rgba(224, 252, 255, 0.95);
      white-space: nowrap;
    }
    .role-badge.player {
      border-color: rgba(56, 189, 248, 0.60);
      background: rgba(56, 189, 248, 0.15);
      box-shadow: 0 0 26px rgba(56, 189, 248, 0.18);
    }
    .role-badge.imposter {
      border-color: rgba(255, 54, 126, 0.62);
      background: rgba(255, 54, 126, 0.16);
      box-shadow: 0 0 28px rgba(255, 54, 126, 0.22);
      color: rgba(255, 214, 227, 0.98);
    }
    .role-badge.small {
      transform: scale(0.92);
      font-size: 12px;
      padding: 6px 10px;
      letter-spacing: 0.2px;
      border-radius: 999px;
    }
    .revealAnim {
      animation: revealPop 320ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
    }
    @keyframes revealPop {
      from {
        transform: scale(0.97);
        opacity: 0.35;
        filter: blur(0.6px);
      }
      to {
        transform: scale(1);
        opacity: 1;
        filter: blur(0px);
      }
    }
    .fadeIn {
      animation: fadeUp 240ms ease both;
    }
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .footer-note {
      color: rgba(239,233,255,0.62);
      font-size: 12px;
      margin-top: 10px;
      line-height: 1.4;
    }
    .players-list { display: grid; gap: 10px; }
    .player-card {
      text-align: left;
      padding: 12px 12px;
      border-radius: 18px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(192, 132, 252, 0.2);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    .player-card .name { font-weight: 950; color: rgba(239,233,255,0.95); }
    .player-card .meta { color: rgba(239,233,255,0.70); font-size: 12px; font-weight: 800; }
    .divider { height: 1px; width: 100%; background: rgba(239,233,255,0.12); margin: 10px 0; }
    .progress { display: flex; gap: 8px; align-items: center; justify-content: center; margin: 2px 0 12px; color: rgba(239,233,255,0.75); font-weight: 900; font-size: 12px; }
    .dots { display: flex; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 99px; border: 1px solid rgba(239,233,255,0.2); background: rgba(255,255,255,0.05); transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease; }
    .dot.on { background: rgba(56, 189, 248, 0.28); border-color: rgba(56, 189, 248, 0.55); transform: scale(1.18); box-shadow: 0 0 16px rgba(56, 189, 248, 0.16); }
    .dot.current {
      background: rgba(56, 189, 248, 0.44);
      border-color: rgba(56, 189, 248, 0.75);
      transform: scale(1.14);
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.22);
      animation: dotPulse 1.05s ease-in-out infinite;
    }
    @keyframes dotPulse {
      0%,
      100% { transform: scale(1.10); }
      50% { transform: scale(1.45); }
    }
    @media (max-width: 420px) {
      .app {
        padding: 14px 12px 20px;
      }
      .panel {
        padding: 14px;
        border-radius: 22px;
      }
      .big-word {
        font-size: clamp(26px, 7.2vw, 38px);
      }
      .role-message {
        font-size: 16px;
      }
      .stepper button {
        width: 38px;
        height: 38px;
      }
    }
  `

  return (
    <div className="app">
      <style>{styles}</style>
      <div className="shell">
        <div className="brand">
          <h1>Caught @CBS</h1>
          <span className="chip">offline pass-and-play</span>
        </div>

        {phase === 'lobby' && (
          <div className="panel">
            <div className="section-title">Enter players</div>
            <div className="row" style={{ marginBottom: 10 }}>
              <div className="stepper" aria-label="Player count">
                <button type="button" onClick={() => setPlayerCount((c) => Math.max(3, c - 1))} disabled={playerCount <= 3}>
                  -
                </button>
                <div className="value">{playerCount}</div>
                <button type="button" onClick={() => setPlayerCount((c) => Math.min(15, c + 1))} disabled={playerCount >= 15}>
                  +
                </button>
              </div>
              <div className="chip">3-15 players</div>
            </div>

            <div className="grid" style={{ marginTop: 12 }}>
              {nameInputs.map((value, idx) => (
                <div key={idx} className="field">
                  <label>{`Player ${idx + 1}`}</label>
                  <input
                    type="text"
                    value={value}
                    placeholder={`e.g. ${idx === 0 ? 'Aarav' : 'Kiara'}`}
                    onChange={(e) => {
                      const next = [...nameInputs]
                      next[idx] = e.target.value
                      setNameInputs(next)
                    }}
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>

            <div className="divider" />
            <GlassButton onClick={startGame} disabled={!canStart}>
              Start Game
            </GlassButton>
            <div className="footer-note">
              Pass the device: each person taps to reveal their secret, discuss, then reveal the imposter.
            </div>
          </div>
        )}

        {phase === 'turns' && players.length > 0 && (
          <div className="panel">
            <div className="progress">
              <div className="dots" aria-hidden="true">
                {players.map((p, i) => (
                  <div
                    key={p.id}
                    className={`dot ${i < turnIndex ? 'on' : ''} ${i === turnIndex ? 'current' : ''}`}
                  />
                ))}
              </div>
              <span>{`Reveal turn ${turnIndex + 1} / ${players.length}`}</span>
            </div>

            {!revealVisible ? (
              <>
                <div className="section-title">Pass to next player</div>
                <div className="hint">
                  <b style={{ color: 'rgba(239,233,255,0.98)' }}>{activePlayer?.name}</b> — tap to reveal.
                </div>
                <div style={{ height: 14 }} />
                <GlassButton onClick={handleTapReveal} variant="primary">
                  Tap to reveal
                </GlassButton>
                <div className="footer-note">No spoilers. Keep it on this device.</div>
              </>
            ) : (
              <>
                <div className="section-title">{activePlayer?.name}</div>
                <div className="revealAnim" style={{ textAlign: 'center', paddingTop: 8 }}>
                  <div className={`role-badge ${activeIsImposter ? 'imposter' : 'player'}`}>
                    {activeIsImposter ? 'IMPOSTER' : 'PLAYER'}
                  </div>

                  {activeIsImposter ? (
                    <>
                      <div className="role-message" style={{ marginTop: 14 }}>
                        You are the Imposter 😈
                      </div>
                      {confusionUsed ? (
                        <>
                          <div className="hint" style={{ marginTop: 10 }}>
                            You were given a different word:
                          </div>
                          <div className="big-word" style={{ marginTop: 12 }}>
                            {imposterWord}
                          </div>
                        </>
                      ) : (
                        <div className="hint" style={{ marginTop: 10 }}>
                          No word in normal mode. Bluff your way.
                        </div>
                      )}
                      <div className="hint" style={{ marginTop: 8 }}>
                        Steer the conversation.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="role-message" style={{ marginTop: 14 }}>
                        Your selected word
                      </div>
                      <div className="big-word" style={{ marginTop: 10 }}>
                        {targetWord}
                      </div>
                      <div className="hint" style={{ marginTop: 8 }}>
                        Share what you remember and spot inconsistencies.
                      </div>
                    </>
                  )}
                </div>

                <div style={{ height: 16 }} />
                <GlassButton onClick={handleHidePass} variant="secondary">
                  Hide & Pass
                </GlassButton>
                <div className="footer-note">After the last player, you’ll get the Discussion screen.</div>
              </>
            )}
            <div style={{ height: 12 }} />
            <GlassButton onClick={resetToLobby} variant="ghost">
              Restart
            </GlassButton>
          </div>
        )}

        {phase === 'discussionStart' && (
          <div className="panel fadeIn">
            <div className="section-title">Start Discussion</div>
            <div className="hint" style={{ marginTop: 0 }}>
              Everyone talks. Your job: figure out who is the imposter.
            </div>
            <div style={{ height: 14 }} />
            <GlassButton onClick={startDiscussion} variant="primary">
              Start Discussion
            </GlassButton>
            <div style={{ height: 10 }} />
            <GlassButton onClick={resetToLobby} variant="ghost">
              Restart
            </GlassButton>
          </div>
        )}

        {phase === 'discussion' && (
          <div className="panel">
            <div className="section-title">Discussion</div>
            <div className="hint" style={{ marginTop: 0 }}>
              Compare stories. Watch for confident detours. Imposter: blend in.
            </div>
            <div style={{ height: 12 }} />
            <div className="panel compact">
              <div className="hint" style={{ marginTop: 0 }}>
                Imposter: use vague clues and steer the conversation. Members: compare stories and spot inconsistencies about the word.
              </div>
            </div>
            <div style={{ height: 16 }} />
            <GlassButton onClick={() => setPhase('results')} variant="primary">
              Reveal
            </GlassButton>
            <div style={{ height: 10 }} />
            <GlassButton onClick={resetToLobby} variant="ghost">Restart</GlassButton>
          </div>
        )}

        {phase === 'results' && (
          <div className="panel">
            <div className="section-title">Final Reveal</div>
            <div className="hint" style={{ marginTop: 0 }}>
              Target word: <b style={{ color: 'rgba(239,233,255,0.98)' }}>{targetWord}</b>
              {confusionUsed ? (
                <>
                  {' '}
                  (confusion round: imposter saw <b style={{ color: 'rgba(239,233,255,0.98)' }}>{imposterWord}</b>)
                </>
              ) : (
                <> (normal round: imposter had no word visible)</>
              )}
            </div>
            <div style={{ height: 12 }} />
            <div style={{ textAlign: 'center' }}>
              <div className="role-badge imposter">Imposter: {players.find((p) => p.id === imposterId)?.name ?? '—'}</div>
            </div>

            <div className="divider" />
            <div className="players-list">
              {players.map((p) => {
                const isImposter = p.id === imposterId
                const wordShown = isImposter ? (confusionUsed ? imposterWord : '—') : targetWord
                return (
                  <div key={p.id} className="player-card">
                    <div>
                      <div className="name">{p.name}</div>
                      <div style={{ marginTop: 8 }}>
                        <div className={`role-badge ${isImposter ? 'imposter' : 'player'} small`}>
                          {isImposter ? 'IMPOSTER' : 'PLAYER'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="meta">Word</div>
                      <div style={{ fontWeight: 1000, color: 'rgba(239,233,255,0.95)', fontSize: 13 }}>
                        {wordShown}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ height: 16 }} />
            <GlassButton onClick={resetToLobby} variant="primary">Play Again</GlassButton>
          </div>
        )}
      </div>
    </div>
  )
}

