import { useEffect, useRef, useState } from 'react'
import { LockKeyhole, Radio, ShieldCheck } from 'lucide-react'

interface RadarBlip {
  angle: number
  radius: number
  size: number
  alpha: number
  ping: number
  color: string
}

export function CyberHeroObject() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [pulseCount, setPulseCount] = useState(0)
  const [telemetryState, setTelemetryState] = useState({ ping: 14, nodes: 2048, packets: 98.4 })

  // Interactive 3D mouse parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    // Limit tilt angle between -15 and 15 degrees
    const rotX = -(y / (rect.height / 2)) * 12
    const rotY = (x / (rect.width / 2)) * 12
    setTilt({ x: rotX, y: rotY })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  // Periodic telemetry update for cinematic realism
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryState(prev => ({
        ping: Math.floor(11 + Math.random() * 6),
        nodes: prev.nodes,
        packets: +(98.2 + Math.random() * 1.5).toFixed(1),
      }))
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  // Dynamic Radar & Defense Nodes Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || navigator.userAgent.includes('jsdom')) return

    let animId: number
    const size = 420
    canvas.width = size * (window.devicePixelRatio || 1)
    canvas.height = size * (window.devicePixelRatio || 1)
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    const cx = size / 2
    const cy = size / 2

    let radarAngle = 0
    const blips: RadarBlip[] = [
      { angle: 0.8, radius: 95, size: 3, alpha: 0.9, ping: 0, color: '#b8f27e' },
      { angle: 2.3, radius: 135, size: 2.5, alpha: 0.7, ping: 0, color: '#9ed5ff' },
      { angle: 3.9, radius: 80, size: 3, alpha: 0.8, ping: 0, color: '#b8f27e' },
      { angle: 5.1, radius: 155, size: 2.5, alpha: 0.85, ping: 0, color: '#c2b5ff' },
      { angle: 5.9, radius: 115, size: 3, alpha: 0.75, ping: 0, color: '#b8f27e' },
    ]

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function render() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, size, size)

      // Draw faint cyber radar grid rings
      const rings = [60, 105, 145, 185]
      ctx.lineWidth = 1
      rings.forEach((r, idx) => {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = idx === 1 ? 'rgba(184, 242, 126, 0.14)' : 'rgba(113, 131, 145, 0.12)'
        ctx.stroke()
      })

      // Draw radar crosshairs
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(113, 131, 145, 0.12)'
      ctx.setLineDash([4, 6])
      ctx.moveTo(cx - 190, cy)
      ctx.lineTo(cx + 190, cy)
      ctx.moveTo(cx, cy - 190)
      ctx.lineTo(cx, cy + 190)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw radar beam sweep (sector with trailing alpha)
      if (!prefersReducedMotion) {
        radarAngle = (radarAngle + 0.02) % (Math.PI * 2)
      }

      const sweepSegments = 16
      const sweepSpan = Math.PI / 4.5
      for (let s = 0; s < sweepSegments; s++) {
        const segAngle = radarAngle - (s * sweepSpan) / sweepSegments
        const segAlpha = (1 - s / sweepSegments) * 0.14
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, 185, segAngle - 0.04, segAngle)
        ctx.closePath()
        ctx.fillStyle = `rgba(184, 242, 126, ${segAlpha})`
        ctx.fill()
      }

      // Leading edge of radar beam
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(radarAngle) * 185, cy + Math.sin(radarAngle) * 185)
      ctx.strokeStyle = 'rgba(184, 242, 126, 0.45)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      // Render radar blips / satellite nodes
      blips.forEach(b => {
        const bx = cx + Math.cos(b.angle) * b.radius
        const by = cy + Math.sin(b.angle) * b.radius

        // Check if radar sweep just crossed this blip
        const angleDiff = Math.abs(radarAngle - b.angle)
        if (angleDiff < 0.06 && b.ping <= 0) {
          b.ping = 1.0 // trigger ping shockwave
        }

        // Draw ping ripple wave
        if (b.ping > 0) {
          ctx.beginPath()
          ctx.arc(bx, by, b.size + (1 - b.ping) * 16, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(184, 242, 126, ${b.ping * 0.6})`
          ctx.lineWidth = 1
          ctx.stroke()
          b.ping -= 0.025
        }

        // Draw blip dot
        ctx.beginPath()
        ctx.arc(bx, by, b.size, 0, Math.PI * 2)
        ctx.fillStyle = b.color
        ctx.shadowColor = b.color
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div
      ref={containerRef}
      className="cyber-hero-stage"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => setPulseCount(c => c + 1)}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      {/* Background Cyber Grid */}
      <div className="art-grid" aria-hidden="true" />

      {/* Dynamic Radar and Defense Blips Canvas */}
      <canvas
        ref={canvasRef}
        className="cyber-radar-canvas"
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          pointerEvents: 'none',
        }}
      />

      {/* 3D Gyroscopic Hologram Orbits with Orbiting Photons */}
      <div className="cyber-gyro-wrap" aria-hidden="true">
        {/* Ring 1 - Alpha Gyro Orbit */}
        <div className="cyber-orbit orbit-gyro-alpha">
          <div className="orbit-photon photon-mint" />
        </div>

        {/* Ring 2 - Beta Gyro Orbit */}
        <div className="cyber-orbit orbit-gyro-beta">
          <div className="orbit-photon photon-blue" />
        </div>

        {/* Ring 3 - Gamma Outer Ring */}
        <div className="cyber-orbit orbit-gyro-gamma">
          <div className="orbit-photon photon-violet" />
        </div>
      </div>

      {/* Central Floating Cyber Shield (Hero Movie Object) */}
      <div className={`shield-core-wrap ${pulseCount > 0 ? 'shield-pulse-trigger' : ''}`}>
        {/* Radiant Ambient Shield Aura */}
        <div className="shield-glow" />

        {/* Futuristic Shield Shape with Laser Scan Beam */}
        <div className="shield-shape">
          {/* Vertical biometric/security laser scanner beam */}
          <div className="shield-laser-scanner" />
          <ShieldCheck size={96} strokeWidth={1.2} />
          {/* Subtle Cyber Vertex Pointers */}
          <span className="shield-pin pin-top" />
          <span className="shield-pin pin-left" />
          <span className="shield-pin pin-right" />
          <span className="shield-pin pin-bottom" />
        </div>
      </div>

      {/* Floating Holographic HUD Telemetry Badges (Moving Objects) */}
      <div className="floating-chip chip-top float-anim-1">
        <span className="chip-pulse" />
        <div>
          <div className="chip-title">
            SYSTEMS / <b>SECURE</b>
          </div>
          <div className="chip-sub">PING: {telemetryState.ping}ms · {telemetryState.nodes} NODES</div>
        </div>
      </div>

      <div className="floating-chip chip-bottom float-anim-2">
        <span className="chip-square">
          <LockKeyhole size={14} />
        </span>
        <div>
          <div className="chip-title">QUANTUM <b>DEFENSE</b></div>
          <div className="chip-sub">4096-BIT · {telemetryState.packets}% SAFE</div>
        </div>
      </div>

      {/* Cinematic Right Telemetry Chip */}
      <div className="floating-chip chip-right float-anim-3">
        <span className="chip-radar-icon">
          <Radio size={13} className="spin-slow" />
        </span>
        <div>
          <div className="chip-title">RADAR <b>SCAN</b></div>
          <div className="chip-sub">THREAT LEVEL: 0.0</div>
        </div>
      </div>

      {/* Futuristic Orbit Coordinate Labels */}
      <div className="orbit-label label-a">
        <span className="beacon-dot" />
        SYSTEMS / 01 ACTIVE
      </div>
      <div className="orbit-label label-b">
        01 — 03 <span>PATHWAYS</span>
      </div>

      {/* Floating Cyber Crosshairs (+) */}
      <div className="art-cross cross-one float-anim-2">+</div>
      <div className="art-cross cross-two float-anim-1">+</div>
      <div className="art-cross cross-three float-anim-3">+</div>
    </div>
  )
}
