import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const WORDS_RAW = `
Audi, Library, Basement, Reading, Admin, Seminar, Lab, Ground, Court, Parking, Gate, Notice, Lift, Faculty,
Bansiwala, Panhub, Nescafe, Amul, Samosa, Maggi, Coffee, Chai, Canteen,
Attendance, Internals, Assignment, Presentation, Case, Project, Viva, Test, Midsem, Endsem, Notes, PDF, Deadline, Backlog, CGPA, Result, Exam,
Proxy, Bunk, Bench, CR, WhatsApp, LinkedIn, Competition, Placement, Internship, Referral, Resume, Interview, Aptitude, Rejection, Offer,
Roast, Sleep, Startup, Networking, Discussion, Fights, Situationship, Crush, Stalking, Panic, Gossip, Night,
Metro, Rush, Auto, Rickshaw, Mall, Movie, Foodcourt, Gaming, Escalator, Weekend, Chill, Journey, Late,
Enactus, FinX, Markit, Dhwani, Blitz, Verve, Rotaract, Parivartan, Kronos, Nucleus,
Crescendo, Prom, Fashion, Dance, Battle, Zorbing, Dating, Stalls, Afterparty
`

const CONFUSION_PAIRS_RAW = `
Audi|Seminar, Library|Reading, Nescafe|Amul, Samosa|Maggi, Coffee|Chai, Ground|Court, Metro|Auto, Mall|Movie, Proxy|Bunk, Assignment|Case, Presentation|Viva, Notes|PDF, Exam|Result, Resume|Interview, Enactus|FinX, Blitz|Dhwani, Markit|Verve, Kronos|Nucleus, Crescendo|Prom
`

const PREETI_WORDS = [
  'Nautbook', 'Maurr', 'Mokshh', 'Prignant', 'Dabit',
  'So-oft Lonching', 'No baje', 'Mouj', 'Paneer Roall',
  'Brand', 'Practice', 'Moaan', 'Ass-Cream', 'Kofi', 'H-o-tspot',
]

const PREETI_PLACEHOLDERS = [
  'Priyanshu', 'Vanshika', 'Preeti', 'Pradeep', 'Shambhavi',
  'Prachi', 'Anjaly', 'Gargi', 'Arjun', 'Nidhi',
  'Rohan', 'Sneha', 'Kartik', 'Divya', 'Ishaan',
]

const NORMAL_PLACEHOLDERS = [
  'Priyanshu', 'Vanshika', 'Pradeep', 'Shambhavi', 'Prachi',
  'Anjaly', 'Gargi', 'Arjun', 'Nidhi', 'Rohan',
  'Sneha', 'Kartik', 'Divya', 'Ishaan', 'Preeti',
]

const EASTER_EGG_TAPS = 10
const EASTER_EGG_WINDOW_MS = 3000

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

function GlassButton({ children, onClick, variant = 'primary', disabled, preeti }) {
  return (
    <button type="button" className={`btn ${variant}${preeti ? ' preeti-btn' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export default function CaughtAtCBSApp() {
  const WORDS = useMemo(() => parseWords(WORDS_RAW), [])
  const CONFUSION_PAIRS = useMemo(() => parseConfusionPairs(CONFUSION_PAIRS_RAW), [])

  const [phase, setPhase] = useState('lobby')
  const [playerCount, setPlayerCount] = useState(5)
  const [nameInputs, setNameInputs] = useState(() => Array(5).fill(''))

  const [players, setPlayers] = useState([])
  const [imposterId, setImposterId] = useState(null)
  const [targetWord, setTargetWord] = useState('')
  const [imposterWord, setImposterWord] = useState('')
  const [confusionUsed, setConfusionUsed] = useState(false)

  const [turnIndex, setTurnIndex] = useState(0)
  const [revealVisible, setRevealVisible] = useState(false)

  const [preetiMode, setPreetiMode] = useState(false)
  const [preetiFlash, setPreetiFlash] = useState(false)
  const tapTimestamps = useRef([])

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

  const handleLogoTap = useCallback(() => {
    const now = Date.now()
    tapTimestamps.current.push(now)
    tapTimestamps.current = tapTimestamps.current.filter((t) => now - t <= EASTER_EGG_WINDOW_MS)
    if (tapTimestamps.current.length >= EASTER_EGG_TAPS) {
      tapTimestamps.current = []
      setPreetiMode((prev) => {
        const next = !prev
        if (next) {
          setPreetiFlash(true)
          setTimeout(() => setPreetiFlash(false), 800)
          if (navigator.vibrate) navigator.vibrate(200)
        }
        return next
      })
    }
  }, [])

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

    let chosenTargetWord
    let chosenImposterWord = ''
    let didUseConfusion = false

    if (preetiMode) {
      chosenTargetWord = pickRandom(PREETI_WORDS)
    } else {
      const useConfusion = Math.random() < 0.2
      chosenTargetWord = pickRandom(WORDS)
      if (useConfusion && CONFUSION_PAIRS.length > 0) {
        const pair = pickRandom(CONFUSION_PAIRS)
        const flip = Math.random() < 0.5
        chosenTargetWord = flip ? pair.a : pair.b
        chosenImposterWord = flip ? pair.b : pair.a
        didUseConfusion = true
      }
    }

    setPlayers(newPlayers)
    setImposterId(chosenImposter.id)
    setTargetWord(chosenTargetWord)
    setImposterWord(chosenImposterWord)
    setConfusionUsed(didUseConfusion)
    setTurnIndex(0)
    setRevealVisible(false)
    setPhase('turns')
  }

  function playSfx(_key) {}

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
  const placeholders = preetiMode ? PREETI_PLACEHOLDERS : NORMAL_PLACEHOLDERS

  const pm = preetiMode

  const styles = `
    *, *::before, *::after { box-sizing: border-box; }
    :root { color-scheme: dark; }

    .app {
      min-height: 100svh;
      padding: 18px 16px 36px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      transition: background 0.6s ease;
      background:
        ${pm
          ? `radial-gradient(900px 520px at 50% -100px, rgba(255, 100, 200, 0.45), transparent 55%),
             radial-gradient(700px 500px at 80% 110%, rgba(200, 60, 255, 0.30), transparent 58%),
             linear-gradient(180deg, #0d0010 0%, #130019 35%, #0e0016 70%, #0a0012 100%)`
          : `radial-gradient(900px 520px at 50% -120px, rgba(170, 59, 255, 0.40), transparent 55%),
             radial-gradient(760px 520px at 20% 120%, rgba(56, 189, 248, 0.28), transparent 58%),
             linear-gradient(180deg, #000 0%, #070312 35%, #050611 70%, #000814 100%)`
        };
    }

    .shell {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 2px;
    }

    .brand-row {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .brand h1 {
      margin: 0;
      font-size: clamp(28px, 7vw, 42px);
      letter-spacing: -1.3px;
      font-weight: 900;
      color: #efe9ff;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: text-shadow 0.3s ease, color 0.3s ease;
      text-shadow:
        ${pm
          ? `0 0 18px rgba(255, 100, 200, 0.6), 0 0 42px rgba(200, 60, 255, 0.35)`
          : `0 0 18px rgba(170, 59, 255, 0.35), 0 0 42px rgba(56, 189, 248, 0.18)`
        };
    }

    .brand h1.flash {
      animation: logoFlash 0.8s ease both;
    }

    @keyframes logoFlash {
      0% { transform: scale(1); }
      20% { transform: scale(1.12); filter: brightness(1.6); }
      50% { transform: scale(0.96); }
      80% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .preeti-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      background: linear-gradient(135deg, rgba(255,100,200,0.22), rgba(200,60,255,0.18));
      border: 1px solid rgba(255, 130, 210, 0.55);
      color: rgba(255, 200, 240, 0.98);
      box-shadow: 0 0 18px rgba(255, 80, 200, 0.22), 0 0 8px rgba(200, 60, 255, 0.18);
      animation: badgePulse 2s ease-in-out infinite;
    }

    @keyframes badgePulse {
      0%, 100% { box-shadow: 0 0 18px rgba(255, 80, 200, 0.22), 0 0 8px rgba(200, 60, 255, 0.18); }
      50% { box-shadow: 0 0 28px rgba(255, 80, 200, 0.40), 0 0 16px rgba(200, 60, 255, 0.28); }
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      border: 1px solid ${pm ? 'rgba(255, 130, 210, 0.30)' : 'rgba(192, 132, 252, 0.25)'};
      color: rgba(239,233,255,0.88);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.2px;
      user-select: none;
      white-space: nowrap;
    }

    .panel {
      border-radius: 24px;
      padding: 20px;
      background: ${pm ? 'rgba(255, 60, 180, 0.06)' : 'rgba(255, 255, 255, 0.06)'};
      border: 1px solid ${pm ? 'rgba(255, 130, 210, 0.40)' : 'rgba(192, 132, 252, 0.40)'};
      box-shadow:
        0 0 0 1px ${pm ? 'rgba(255, 80, 200, 0.10)' : 'rgba(56, 189, 248, 0.10)'},
        ${pm ? 'rgba(255, 80, 200, 0.22)' : 'rgba(170, 59, 255, 0.22)'} 0 22px 70px -45px,
        rgba(0, 0, 0, 0.35) 0 10px 35px -15px;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .panel:hover {
      transform: translateY(-1px);
      border-color: ${pm ? 'rgba(255, 130, 210, 0.60)' : 'rgba(56, 189, 248, 0.55)'};
    }

    .panel.compact { padding: 14px; border-radius: 18px; }

    .section-title {
      margin: 0 0 12px;
      font-size: 21px;
      color: rgba(239, 233, 255, 0.96);
      font-weight: 1000;
      letter-spacing: -0.4px;
    }

    .hint {
      color: rgba(239, 233, 255, 0.70);
      font-size: 14px;
      line-height: 1.5;
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
      gap: 6px;
    }

    label {
      color: rgba(239,233,255,0.80);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    input[type="text"] {
      width: 100%;
      padding: 13px 14px;
      border-radius: 14px;
      border: 1px solid ${pm ? 'rgba(255, 100, 200, 0.28)' : 'rgba(56, 189, 248, 0.25)'};
      background: rgba(255,255,255,0.06);
      color: rgba(239,233,255,0.95);
      outline: none;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 0.1px;
      box-shadow: inset 0 0 0 1px ${pm ? 'rgba(255, 80, 200, 0.08)' : 'rgba(170, 59, 255, 0.08)'};
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    input[type="text"]::placeholder {
      color: rgba(239,233,255,0.32);
      font-weight: 600;
    }

    input[type="text"]:focus {
      border-color: ${pm ? 'rgba(255, 120, 220, 0.65)' : 'rgba(192, 132, 252, 0.55)'};
      box-shadow: 0 0 0 3px ${pm ? 'rgba(255, 80, 200, 0.15)' : 'rgba(192, 132, 252, 0.15)'};
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
      border: 1px solid ${pm ? 'rgba(255, 120, 210, 0.40)' : 'rgba(192, 132, 252, 0.35)'};
      background: rgba(255,255,255,0.07);
      color: rgba(239,233,255,0.95);
      font-weight: 900;
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.08s ease, background 0.18s ease;
    }

    .stepper button:active { transform: scale(0.95); }
    .stepper button:disabled { opacity: 0.35; cursor: not-allowed; }

    .btn {
      width: 100%;
      padding: 15px 16px;
      border-radius: 999px;
      border: 1px solid rgba(192, 132, 252, 0.35);
      cursor: pointer;
      font-weight: 900;
      letter-spacing: 0.3px;
      font-size: 15px;
      color: rgba(255,255,255,0.96);
      box-shadow: 0 8px 24px rgba(0,0,0,0.22);
      transition: transform 0.1s ease, filter 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      filter: grayscale(20%);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      filter: brightness(1.08);
    }

    .btn:active:not(:disabled) { transform: scale(0.98); }

    .btn.primary {
      background: linear-gradient(135deg, rgba(170, 59, 255, 0.95), rgba(56, 189, 248, 0.85));
      border-color: transparent;
      box-shadow: 0 0 28px rgba(170, 59, 255, 0.28), 0 8px 24px rgba(0,0,0,0.22);
    }

    .btn.primary.preeti-btn {
      background: linear-gradient(135deg, rgba(255, 80, 200, 0.95), rgba(200, 60, 255, 0.90));
      box-shadow: 0 0 28px rgba(255, 80, 200, 0.35), 0 8px 24px rgba(0,0,0,0.22);
      border-color: transparent;
    }

    .btn.secondary {
      background: rgba(255,255,255,0.07);
      border-color: ${pm ? 'rgba(255, 120, 210, 0.40)' : 'rgba(192, 132, 252, 0.35)'};
    }

    .btn.ghost {
      background: transparent;
      border-color: rgba(239,233,255,0.20);
      color: rgba(239,233,255,0.80);
    }

    .big-word {
      font-size: clamp(26px, 7vw, 38px);
      font-weight: 1000;
      letter-spacing: -0.8px;
      color: #f0eaff;
      text-shadow: 0 0 20px ${pm ? 'rgba(255, 80, 200, 0.40)' : 'rgba(170, 59, 255, 0.30)'};
      margin: 10px 0 4px;
      word-break: break-word;
    }

    .role-message {
      font-size: 18px;
      font-weight: 1000;
      letter-spacing: -0.3px;
      color: rgba(239, 233, 255, 0.97);
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 7px 14px;
      border-radius: 999px;
      font-weight: 1000;
      font-size: 13px;
      letter-spacing: 0.5px;
      border: 1px solid rgba(56, 189, 248, 0.35);
      background: rgba(56, 189, 248, 0.12);
      color: rgba(224, 252, 255, 0.95);
      white-space: nowrap;
    }

    .role-badge.player {
      border-color: ${pm ? 'rgba(255, 130, 210, 0.60)' : 'rgba(56, 189, 248, 0.60)'};
      background: ${pm ? 'rgba(255, 100, 200, 0.15)' : 'rgba(56, 189, 248, 0.15)'};
      box-shadow: 0 0 26px ${pm ? 'rgba(255, 80, 200, 0.18)' : 'rgba(56, 189, 248, 0.18)'};
      color: ${pm ? 'rgba(255, 220, 245, 0.98)' : 'rgba(224, 252, 255, 0.95)'};
    }

    .role-badge.imposter {
      border-color: rgba(255, 54, 126, 0.62);
      background: rgba(255, 54, 126, 0.16);
      box-shadow: 0 0 28px rgba(255, 54, 126, 0.22);
      color: rgba(255, 214, 227, 0.98);
    }

    .role-badge.small {
      font-size: 11px;
      padding: 5px 10px;
      letter-spacing: 0.3px;
    }

    .revealAnim {
      animation: revealPop 320ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
    }

    @keyframes revealPop {
      from { transform: scale(0.96); opacity: 0.3; filter: blur(0.8px); }
      to { transform: scale(1); opacity: 1; filter: blur(0px); }
    }

    .fadeIn {
      animation: fadeUp 240ms ease both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .footer-note {
      color: rgba(239,233,255,0.55);
      font-size: 12px;
      margin-top: 12px;
      line-height: 1.5;
      text-align: center;
    }

    .players-list { display: grid; gap: 10px; }

    .player-card {
      text-align: left;
      padding: 14px;
      border-radius: 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid ${pm ? 'rgba(255, 120, 210, 0.20)' : 'rgba(192, 132, 252, 0.20)'};
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    .player-card .name { font-weight: 950; color: rgba(239,233,255,0.95); font-size: 14px; }
    .player-card .meta { color: rgba(239,233,255,0.60); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }

    .divider {
      height: 1px;
      width: 100%;
      background: ${pm ? 'rgba(255, 120, 210, 0.18)' : 'rgba(239,233,255,0.12)'};
      margin: 14px 0;
    }

    .progress {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
      margin: 0 0 16px;
      color: rgba(239,233,255,0.70);
      font-weight: 800;
      font-size: 12px;
    }

    .dots { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 99px;
      border: 1px solid rgba(239,233,255,0.18);
      background: rgba(255,255,255,0.05);
      transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }

    .dot.on {
      background: ${pm ? 'rgba(255, 100, 200, 0.35)' : 'rgba(56, 189, 248, 0.28)'};
      border-color: ${pm ? 'rgba(255, 130, 210, 0.65)' : 'rgba(56, 189, 248, 0.55)'};
      transform: scale(1.18);
    }

    .dot.current {
      background: ${pm ? 'rgba(255, 100, 200, 0.55)' : 'rgba(56, 189, 248, 0.44)'};
      border-color: ${pm ? 'rgba(255, 150, 220, 0.85)' : 'rgba(56, 189, 248, 0.75)'};
      transform: scale(1.14);
      box-shadow: 0 0 18px ${pm ? 'rgba(255, 80, 200, 0.30)' : 'rgba(56, 189, 248, 0.22)'};
      animation: dotPulse 1.05s ease-in-out infinite;
    }

    @keyframes dotPulse {
      0%, 100% { transform: scale(1.10); }
      50% { transform: scale(1.45); }
    }

    .stack { display: flex; flex-direction: column; gap: 10px; }

    @media (max-width: 420px) {
      .app { padding: 14px 12px 28px; }
      .panel { padding: 16px; border-radius: 20px; }
      .big-word { font-size: clamp(24px, 7.5vw, 34px); }
      .role-message { font-size: 16px; }
      .stepper button { width: 38px; height: 38px; font-size: 16px; }
      .btn { padding: 14px 16px; font-size: 14px; }
    }
  `

  return (
    <div className="app">
      <style>{styles}</style>
      <div className="shell">

        <div className="brand">
          <div className="brand-row">
            <h1
              onClick={handleLogoTap}
              className={preetiFlash ? 'flash' : ''}
              title="Tap rapidly to unlock something..."
            >
              Caught @CBS
            </h1>
            <span className="chip">offline pass-and-play</span>
          </div>
          {pm && (
            <div className="preeti-badge">
              💅 Preeti Mode Active ✦
            </div>
          )}
        </div>

        {phase === 'lobby' && (
          <div className="panel fadeIn">
            <div className="section-title">Enter players</div>
            <div className="row" style={{ marginBottom: 14 }}>
              <div className="stepper" aria-label="Player count">
                <button type="button" onClick={() => setPlayerCount((c) => Math.max(3, c - 1))} disabled={playerCount <= 3}>
                  −
                </button>
                <div className="value">{playerCount}</div>
                <button type="button" onClick={() => setPlayerCount((c) => Math.min(15, c + 1))} disabled={playerCount >= 15}>
                  +
                </button>
              </div>
              <div className="chip">3 – 15 players</div>
            </div>

            <div className="grid" style={{ marginTop: 4 }}>
              {nameInputs.map((value, idx) => (
                <div key={idx} className="field">
                  <label>{`Player ${idx + 1}`}</label>
                  <input
                    type="text"
                    value={value}
                    placeholder={`e.g. ${placeholders[idx % placeholders.length]}`}
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
            <div className="stack">
              <GlassButton onClick={startGame} disabled={!canStart} preeti={pm}>
                Start Game
              </GlassButton>
            </div>
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
              <span>{`${turnIndex + 1} / ${players.length}`}</span>
            </div>

            {!revealVisible ? (
              <>
                <div className="section-title">Pass to next player</div>
                <div className="hint">
                  <b style={{ color: 'rgba(239,233,255,0.98)' }}>{activePlayer?.name}</b> — tap below to reveal.
                </div>
                <div style={{ height: 16 }} />
                <div className="stack">
                  <GlassButton onClick={handleTapReveal} variant="primary" preeti={pm}>
                    Tap to reveal
                  </GlassButton>
                </div>
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
                          No word given. Bluff your way through.
                        </div>
                      )}
                      <div className="hint" style={{ marginTop: 8 }}>
                        Steer the conversation.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="role-message" style={{ marginTop: 14 }}>
                        Your word is
                      </div>
                      <div className="big-word" style={{ marginTop: 10 }}>
                        {targetWord}
                      </div>
                      <div className="hint" style={{ marginTop: 8 }}>
                        Share clues and spot inconsistencies.
                      </div>
                    </>
                  )}
                </div>

                <div style={{ height: 18 }} />
                <div className="stack">
                  <GlassButton onClick={handleHidePass} variant="secondary" preeti={pm}>
                    Hide &amp; Pass
                  </GlassButton>
                </div>
                <div className="footer-note">After the last player, you'll reach the Discussion screen.</div>
              </>
            )}
            <div style={{ height: 14 }} />
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
            <div style={{ height: 16 }} />
            <div className="stack">
              <GlassButton onClick={startDiscussion} variant="primary" preeti={pm}>
                Start Discussion
              </GlassButton>
              <GlassButton onClick={resetToLobby} variant="ghost">
                Restart
              </GlassButton>
            </div>
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
            <div style={{ height: 18 }} />
            <div className="stack">
              <GlassButton onClick={() => setPhase('results')} variant="primary" preeti={pm}>
                Reveal the Imposter
              </GlassButton>
              <GlassButton onClick={resetToLobby} variant="ghost">Restart</GlassButton>
            </div>
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
                  (confusion round — imposter saw <b style={{ color: 'rgba(239,233,255,0.98)' }}>{imposterWord}</b>)
                </>
              ) : (
                <> (imposter had no word)</>
              )}
            </div>
            <div style={{ height: 14 }} />
            <div style={{ textAlign: 'center' }}>
              <div className="role-badge imposter">
                Imposter: {players.find((p) => p.id === imposterId)?.name ?? '—'}
              </div>
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
                      <div style={{ fontWeight: 900, color: 'rgba(239,233,255,0.95)', fontSize: 13, marginTop: 4 }}>
                        {wordShown}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ height: 18 }} />
            <GlassButton onClick={resetToLobby} variant="primary" preeti={pm}>
              Play Again
            </GlassButton>
          </div>
        )}

      </div>
    </div>
  )
}
