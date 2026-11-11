/** Brand mark: two overlapping discs (comparison and treated). */
export function LogoMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <circle cx="7.5" cy="10" r="5" fill="var(--color-comparison)" />
        <circle cx="12.5" cy="10" r="5" fill="var(--color-accent)" opacity="0.92" />
      </svg>
    </span>
  )
}
