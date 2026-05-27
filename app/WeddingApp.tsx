'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { QuestionnaireQuestion } from '@/lib/questionnaire'
import './wedding.css'

const TOTAL_SLIDES = 8

const stop = (e: React.MouseEvent) => e.stopPropagation()

/* ── Inline SVG Icons ── */

function IconMapPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconTelegram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconChevronUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 15 12 9 18 15" />
    </svg>
  )
}

import { submitRSVP } from './actions/rsvp'
import { trackInviteOpen } from './actions/track'

interface WeddingAppProps {
  guestName: string
  inviteId: string
  questions: QuestionnaireQuestion[]
  initialAnswers?: Record<number, string>
}

export default function WeddingApp({ guestName, inviteId, questions, initialAnswers = {} }: WeddingAppProps) {
  const currentSlide = useRef(0)
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Track view — runs only in the browser after the page actually renders */
  useEffect(() => {
    trackInviteOpen(inviteId).catch(console.error)
  }, [inviteId])

  const scrollToSlide = useCallback((index: number) => {
    const el = document.getElementById(`slide-${index}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      currentSlide.current = index
    }
  }, [])

  const goNext = useCallback(() => {
    const next = currentSlide.current >= TOTAL_SLIDES - 1 ? 0 : currentSlide.current + 1
    scrollToSlide(next)
  }, [scrollToSlide])

  /* Track which slide is visible via IntersectionObserver */
  useEffect(() => {
    const container = document.getElementById('wedding-container')
    if (!container) return
    const slides = Array.from(container.querySelectorAll<HTMLElement>('.slide'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id
            const idx = parseInt(id.replace('slide-', ''), 10)
            if (!isNaN(idx)) currentSlide.current = idx
          }
        }
      },
      { root: container, threshold: 0.6 }
    )
    slides.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  /* Keyboard navigation */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext])

  const handleOptionChange = (questionIdx: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionIdx]: option }))
  }

  const handleTextChange = (questionIdx: number, text: string) => {
    if (text.length <= 1000) {
      setAnswers(prev => ({ ...prev, [questionIdx]: text }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const missingFields = questions.filter((q, idx) => q.required && !answers[idx])
    if (missingFields.length > 0) {
      setError('Будь ласка, дайте відповідь на всі обов’язкові запитання (вони позначені зірочкою *).')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitRSVP(inviteId, guestName, answers, 'yes')
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error || 'Щось пішло не так. Спробуйте ще раз.')
      }
    } catch (err) {
      setError('Помилка з\'єднання з сервером.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitRSVP(inviteId, guestName, answers, 'no')
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error || 'Щось пішло не так. Спробуйте ще раз.')
      }
    } catch (err) {
      setError('Помилка з\'єднання з сервером.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main id="wedding-container">
      {/* ══════ SLIDE 1 — HERO ══════ */}
      <section id="slide-0" className="slide slide--yellow">
        <div className="sticker sticker--1" />
        <div className="sticker sticker--2" />
        <div className="sticker sticker--3 sticker--sq" />
        <span className="slide-counter">01 / 08</span>
        <div className="slide-inner">
          <div className="hero-frog" aria-hidden="true">🐳💍🦩</div>
          <h1>Весілля Павла та Катрусі</h1>
          <p className="subtitle">Операція «Тропічне диско»</p>
          <p>
            Привіт, <span className="guest-name">{guestName}</span>! Ми вирішили, що життя занадто коротке, щоб не відсвяткувати наше «довго і щасливо» разом. Готуйтеся - буде весело, затишно і невимушено!
          </p>
          <div className="hero-date">1 серпня 2026</div>
        </div>
        <div className="scroll-hint">
          <span>Гортай</span>
          <IconChevronDown />
        </div>
      </section>

      {/* ══════ SLIDE 2 — CEREMONY ══════ */}
      <section id="slide-1" className="slide slide--white">
        <span className="slide-counter">02 / 08</span>
        <div className="slide-inner">
          <div className="slide-emoji" aria-hidden="true">⛪️</div>
          <h2>Офіційна частина (Шлюб)</h2>
          <p>Тут ми скажемо «Так» і постараємось не розплакатися (але це неточно).</p>
          <div className="time-block">12:00</div>
          <p>Домініканський собор, Музейна площа, Львів</p>
          {/* <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-time">12:00</span>
              <span className="timeline-text">Домініканський собор, Музейна площа, Львів.</span>
            </div>
          </div> */}
          <a
            href="https://maps.app.goo.gl/yWn4BCQw3duS3nz98"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn neo-btn--orange"
            onClick={stop}
          >
            <IconMapPin />
            Показати на карті
          </a>
        </div>
        <div className="scroll-hint">
          <span>Гортай</span>
          <IconChevronDown />
        </div>
      </section>

      {/* ══════ SLIDE 3 — TRANSFER ══════ */}
      <section id="slide-2" className="slide slide--green">
        <span className="slide-counter">03 / 08</span>
        <div className="slide-inner">
          <div className="slide-emoji" aria-hidden="true">🚌</div>
          <h2>Як потрапити на вечірку?</h2>
          <p>Ми подбали, щоб ніхто не загубився по дорозі до пригод:</p>
          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-time">12:45</span>
              <span className="timeline-text">Завантажуємось у трансфер.</span>
            </div>
            <div className="timeline-item">
              <span className="timeline-time">13:30</span>
              <span className="timeline-text">Прибуваємо в «Сад / Garden» (с. Хоросно). Тут починається найцікавіше!</span>
            </div>
          </div>
          <a
            href="https://maps.app.goo.gl/ABKqmJyAVofQ23968"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn neo-btn--orange"
            onClick={stop}
          >
            <IconMapPin />
            Показати на карті
          </a>
          <a
            href="https://www.instagram.com/garden.prostir/"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn neo-btn--purple"
            onClick={stop}
          >
            <IconInstagram />
            Garden в Instagram
          </a>
        </div>
        <div className="scroll-hint">
          <span>Гортай</span>
          <IconChevronDown />
        </div>
      </section>

      {/* ══════ SLIDE 4 — PARTY / DRESS CODE ══════ */}
      <section id="slide-3" className="slide slide--white">
        <span className="slide-counter">04 / 08</span>
        <div className="slide-inner">
          <div className="slide-emoji" aria-hidden="true">💃🏻</div>
          <h2>Атмосфера Святкування</h2>
          <p>Ніяких незручних костюмів (якщо ви самі того не хочете).</p>
          <div className="dress-badge">Happy Summer Vibe 🌊</div>
          <p>Головне, щоб вам було зручно танцювати або релаксувати на травичці.</p>
          <div className="swatches-wrap">
            <span className="swatches-label">Палітра для натхнення:</span>
            <div className="swatches">
              <div className="swatch" style={{ background: '#74C044' }} />
              <div className="swatch" style={{ background: '#FFEA2D' }} />
              <div className="swatch" style={{ background: '#FF572D' }} />
              <div className="swatch" style={{ background: '#FF005D' }} />
              <div className="swatch" style={{ background: '#70149A' }} />
              <div className="swatch" style={{ background: '#3C489B' }} />
            </div>
          </div>
        </div>
        <div className="scroll-hint">
          <span>Гортай</span>
          <IconChevronDown />
        </div>
      </section>

      {/* ══════ SLIDE 5 — RETURN HOME ══════ */}
      <section id="slide-4" className="slide slide--blue">
        <span className="slide-counter">05 / 08</span>
        <div className="slide-inner">
          <div className="slide-emoji" aria-hidden="true">🏠</div>
          <h2>Повернення додому</h2>
          <div className="time-block">22:30</div>
          <p>Вечірка офіційно переходить у фазу «сон», тому на локацію приїде трансфер.</p>
          <div className="route-block">
            Хоросно → Львів → Шептицький
          </div>
          <p>Довеземо з вітерцем!</p>
        </div>
        <div className="scroll-hint">
          <span>Гортай</span>
          <IconChevronDown />
        </div>
      </section>

      {/* ══════ SLIDE 6 — IMPORTANT NOTES ══════ */}
      <section id="slide-5" className="slide slide--green">
        <span className="slide-counter">06 / 08</span>
        <div className="slide-inner">
          <div className="slide-emoji" aria-hidden="true">💡</div>
          <h2>Те, про що часто забувають</h2>
          <div className="cards-grid">
            <div className="info-card">
              <span className="info-card-icon">🎁</span>
              <h3>Подарунки</h3>
              <p>Найкращий подарунок — це ви. Але якщо хочете зробити нам приємно, ми будемо вдячні за внесок у нашу «сімейну скарбничку» 💵</p>
            </div>
            <div className="info-card">
              <span className="info-card-icon">🌸</span>
              <h3>Квіти</h3>
              <p>Замість квітів, які швидко в'януть, ми будемо раді пляшці вашого улюбленого вина 🍷 або корму для тварин, який ми передамо в притулок.</p>
            </div>
            <div className="info-card">
              <span className="info-card-icon">👶</span>
              <h3>Діти</h3>
              <p>Ваші малюки — це теж гості! Але попередьте нас, якщо їм потрібне окреме дитяче крісло.</p>
            </div>
          </div>
        </div>
        <div className="scroll-hint">
          <span>Гортай</span>
          <IconChevronDown />
        </div>
      </section>

      {/* ══════ SLIDE 7 — CONTACT ══════ */}
      <section id="slide-6" className="slide slide--blue">
        <span className="slide-counter">07 / 08</span>
        <div className="slide-inner">
          <div className="slide-emoji" aria-hidden="true">📞</div>
          <h2>Техпідтримка весілля</h2>
          <p>Якщо ви заблукали, забули, який сьогодні рік, або ж маєте запитання — пишіть нашій організаторці:</p>
          <div className="contact-name">Надія</div>
          <a
            href="tel:+380937450263"
            className="neo-btn neo-btn--green"
            onClick={stop}
          >
            <IconPhone />
            +380 93 745 02 63
          </a>
          <a
            href="https://t.me/nadya_chayka"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn neo-btn--orange"
            onClick={stop}
          >
            <IconTelegram />
            @nadya_chayka
          </a>
        </div>
        <div className="scroll-hint">
          <span>Гортай</span>
          <IconChevronDown />
        </div>
      </section>

      {/* ══════ SLIDE 8 — RSVP ══════ */}
      <section id="slide-7" className="slide slide--purple">
        <span className="slide-counter">08 / 08</span>
        <div className="slide-inner">
          <div className="slide-emoji" aria-hidden="true">📝</div>
          <h2>Ваш зворотній зв'язок</h2>

          {submitted ? (
            <div className="success-message">
              <h3>Дякуємо, {guestName}!</h3>
              <br />
              <p>Ваші відповіді збережено!</p>
              <p>(Не хвилюйтесь, якщо випадково натиснули не те - ми можемо змінити відповідь, просто оновіть сторінку і відправте форму ще раз)</p>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={handleSubmit} onClick={stop}>
              <p>Будь ласка, заповніть форму до <strong>30 червня 2026 року</strong>, щоб ми встигли замовити достатньо ігристого!</p>

              <div className="questionnaire-list">
                {questions.map((q, idx) => (
                  <div key={idx} className="rsvp-item">
                    <div className="rsvp-item-label">
                      {q.text}
                      {q.required && <span style={{ color: '#ff572d', marginLeft: '4px' }}>*</span>}
                    </div>

                    {q.type === 'single-option' ? (
                      <div className="checkbox-row">
                        {q.options?.map((opt, optIdx) => (
                          <label key={optIdx} className="custom-checkbox-label">
                            <input
                              type="radio"
                              name={`q-${idx}`}
                              value={opt}
                              checked={answers[idx] === opt}
                              onChange={() => handleOptionChange(idx, opt)}
                            />
                            <span className="checkbox-box" />
                            <span className="option-text">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="textarea-wrapper">
                        <textarea
                          placeholder={q.placeholder}
                          value={answers[idx] || ''}
                          onChange={(e) => handleTextChange(idx, e.target.value)}
                          maxLength={500}
                          className="custom-textarea"
                        />
                        <div className="char-count">{(answers[idx] || '').length} / 500</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="neo-btn neo-btn--green submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Відправляємо...' : 'Ми будемо!'}
              </button>
              <button
                type="button"
                className="neo-btn neo-btn--pink submit-btn"
                onClick={handleDecline}
                disabled={isSubmitting}
                style={{ marginTop: '-10px' }}
              >
                {isSubmitting ? 'Відправляємо...' : 'На жаль, не зможу'}
              </button>
            </form>
          )}

          <div className="closing">З любов'ю, Павло та Катруся! 🐸</div>
        </div>
        <div className="scroll-hint scroll-hint--up" onClick={stop}>
          <IconChevronUp />
          <span>Нагору</span>
          <button style={{ position: 'absolute', inset: 0, opacity: 0 }} onClick={() => scrollToSlide(0)} aria-label="Нагору" />
        </div>
      </section>
    </main>
  )
}
