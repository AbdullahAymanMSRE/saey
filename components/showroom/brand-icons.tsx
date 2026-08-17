/**
 * lucide-react removed its brand icons, and a contact strip is exactly where
 * recognition matters, a generic camera glyph does not read as "Instagram" to
 * someone scanning a showroom. These are minimal marks drawn to match lucide's
 * 24px grid and stroke conventions so they sit correctly beside its icons.
 */

type IconProps = { className?: string }

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
    </svg>
  )
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 6.5a5 5 0 0 0 5 4" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m4 4 16 16M20 4 4 20" />
    </svg>
  )
}

export function WhatsappIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.7-5.3A8.4 8.4 0 1 1 21 11.5Z" />
      <path d="M8.8 9.2c0 3 2.4 5.4 5.4 5.4l1-1.2-1.7-1-.8.8a4.2 4.2 0 0 1-2.1-2.1l.8-.8-1-1.7-1.2 1Z" />
    </svg>
  )
}
