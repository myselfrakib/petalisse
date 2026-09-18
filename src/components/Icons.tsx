export function BowOrnament({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 90 80" fill="none" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <path d="M43 35 C33 16 10 10 9 22 C7 32 24 40 43 35Z" fill="#7A1F2E" />
      <path d="M43 35 C36 20 20 16 17 23 C14 30 26 38 43 35Z" fill="#5A1520" fillOpacity="0.3" />
      <path d="M47 35 C57 16 80 10 81 22 C83 32 66 40 47 35Z" fill="#7A1F2E" />
      <path d="M47 35 C54 20 70 16 73 23 C76 30 64 38 47 35Z" fill="#5A1520" fillOpacity="0.3" />
      <ellipse cx="45" cy="36" rx="8" ry="7" fill="#7A1F2E" />
      <ellipse cx="45" cy="35" rx="4.5" ry="4" fill="#5A1520" />
      <path d="M39 41 Q29 56 22 74" stroke="#7A1F2E" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M51 41 Q61 56 68 74" stroke="#7A1F2E" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function RoseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 52" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M18 28 L18 50" stroke="#7A1F2E" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 38 C13 32 6 34 8 40 C10 45 18 42 18 38" fill="#7A1F2E" fillOpacity="0.7" />
      <path d="M18 26 C14 17 6 16 6 23 C6 27 11 28 18 28" fill="#7A1F2E" />
      <path d="M18 26 C22 17 30 16 30 23 C30 27 25 28 18 28" fill="#7A1F2E" />
      <path d="M9 21 C5 18 4 26 7 28 C10 30 15 27 18 28" fill="#7A1F2E" />
      <path d="M27 21 C31 18 32 26 29 28 C26 30 21 27 18 28" fill="#7A1F2E" />
      <path d="M11 28 C9 33 13 36 16 33 C18 31 18 28 18 28" fill="#7A1F2E" />
      <path d="M25 28 C27 33 23 36 20 33 C18 31 18 28 18 28" fill="#7A1F2E" />
      <ellipse cx="18" cy="20" rx="7" ry="8" fill="#5A1520" />
      <ellipse cx="18" cy="19" rx="4.5" ry="5.5" fill="#7A1F2E" />
      <ellipse cx="17" cy="18" rx="2.5" ry="3.5" fill="#5A1520" fillOpacity="0.55" />
    </svg>
  );
}

export function PinkBow({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      fill="none"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M48 28 C40 14 24 10 24 20 C24 28 38 32 48 28Z" fill="#E7BEC9" />
      <path d="M52 28 C60 14 76 10 76 20 C76 28 62 32 52 28Z" fill="#E7BEC9" />
      <ellipse cx="50" cy="29" rx="6" ry="5.5" fill="#D4A0B0" />
      <path d="M46 33 Q38 44 32 56" stroke="#E7BEC9" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M54 33 Q62 44 68 56" stroke="#E7BEC9" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M24 20 Q12 22 0 16" stroke="#E7BEC9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function RibbonSwirl({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 44" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M0 22 Q40 22 72 22" stroke="#7A1F2E" strokeWidth="1" strokeLinecap="round" />
      <path d="M168 22 Q200 22 240 22" stroke="#7A1F2E" strokeWidth="1" strokeLinecap="round" />
      <path d="M107 22 C100 10 88 7 88 17 C88 25 100 28 107 22Z" fill="#7A1F2E" />
      <path d="M133 22 C140 10 152 7 152 17 C152 25 140 28 133 22Z" fill="#7A1F2E" />
      <ellipse cx="120" cy="23" rx="8" ry="7" fill="#5A1520" />
      <ellipse cx="120" cy="22" rx="4.5" ry="4" fill="#7A1F2E" />
      <path d="M116 29 Q111 37 107 44" stroke="#7A1F2E" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M124 29 Q129 37 133 44" stroke="#7A1F2E" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
