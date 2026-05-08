import { useEffect, useId, useRef } from 'react'
import { glossaryTerms } from '../content/glossary'
import styles from './GlossaryDrawer.module.css'

type Props = {
  open: boolean
  onClose: () => void
}

export function GlossaryDrawer({ open, onClose }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('button[type="button"]')?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) return
    previouslyFocused.current?.focus?.()
  }, [open])

  if (!open) return null

  return (
    <div className={styles.root} role="presentation">
      <button type="button" className={styles.backdrop} aria-label="Close glossary" onClick={onClose} />
      <section
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId}>Glossary</h2>
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.list}>
          {glossaryTerms.map((term) => (
            <article key={term.id} className={styles.article}>
              <h3>{term.title}</h3>
              <p>{term.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
