export function TrashIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10 11V17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M14 11V17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M6 7L7 20C7 21.1 7.9 22 9 22H15C16.1 22 17 21.1 17 20L18 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function EditIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.06 6.19L16.5 3.75C16.9 3.35 17.55 3.35 17.95 3.75L20.25 6.05C20.65 6.45 20.65 7.1 20.25 7.5L17.81 9.94" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
