import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  baseAlpha: number
  glyph?: string
}

const CYBER_GLYPHS = ['01', '0x', 'SYN', 'ACK', 'SEC', '◈', '◇', '⬡', 'λ', '4096', 'AES']

export function CyberBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || navigator.userAgent.includes('jsdom')) return

    let animId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const isMobile = width < 768
    const count = isMobile ? 22 : 45
    const particles: Particle[] = []

    const mouse = { x: -9999, y: -9999, active: false }

    for (let i = 0; i < count; i++) {
      const hasGlyph = i % 4 === 0
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: hasGlyph ? 10 : Math.random() * 2 + 1,
        alpha: Math.random() * 0.35 + 0.15,
        baseAlpha: Math.random() * 0.35 + 0.15,
        glyph: hasGlyph ? CYBER_GLYPHS[Math.floor(Math.random() * CYBER_GLYPHS.length)] : undefined,
      })
    }

    function onResize() {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    function onMouseLeave() {
      mouse.active = false
    }

    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let lastTime = performance.now()

    function render(now: number) {
      if (!ctx || !canvas) return

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      // Connect particles
      const connectionDist = isMobile ? 85 : 120
      const connectDistSq = connectionDist * connectionDist

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distSq = dx * dx + dy * dy

          if (distSq < connectDistSq) {
            const dist = Math.sqrt(distSq)
            const alpha = (1 - dist / connectionDist) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = `rgba(184, 242, 126, ${alpha})`
            ctx.lineWidth = 0.75
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }

        // Connect to mouse if close
        if (mouse.active) {
          const mdx = p1.x - mouse.x
          const mdy = p1.y - mouse.y
          const mDistSq = mdx * mdx + mdy * mdy
          const mDistMax = 140
          if (mDistSq < mDistMax * mDistMax) {
            const mDist = Math.sqrt(mDistSq)
            const mAlpha = (1 - mDist / mDistMax) * 0.35
            ctx.beginPath()
            ctx.strokeStyle = `rgba(158, 213, 255, ${mAlpha})`
            ctx.lineWidth = 1
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }

        // Draw particle or cyber glyph
        if (p1.glyph) {
          ctx.font = '9px "JetBrains Mono", monospace'
          ctx.fillStyle = `rgba(184, 242, 126, ${p1.alpha * 0.7})`
          ctx.fillText(p1.glyph, p1.x, p1.y)
        } else {
          ctx.beginPath()
          ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(184, 242, 126, ${p1.alpha})`
          ctx.shadowColor = '#b8f27e'
          ctx.shadowBlur = 4
          ctx.fill()
          ctx.shadowBlur = 0
        }

        // Update positions if animation allowed
        if (!prefersReducedMotion) {
          p1.x += p1.vx * dt * 60
          p1.y += p1.vy * dt * 60

          if (p1.x < 0) p1.x = width
          else if (p1.x > width) p1.x = 0
          if (p1.y < 0) p1.y = height
          else if (p1.y > height) p1.y = 0
        }
      }

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="cyber-bg-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.42,
      }}
    />
  )
}
