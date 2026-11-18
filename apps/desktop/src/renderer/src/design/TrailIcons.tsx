import type { ReactNode } from "react";

export function TrailLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="8" fill="#0f2219" />
      <rect x="0.5" y="0.5" width="27" height="27" rx="7.5" stroke="#1c4733" />
      <g fill="#4af7a3" opacity="0.28">
        {[8, 14, 20].map((cx) =>
          [8, 14, 20].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1" />),
        )}
      </g>
      <path
        d="M8 8H20M14 8V20"
        stroke="#4af7a3"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g fill="#4af7a3">
        <circle cx="8" cy="8" r="2.2" />
        <circle cx="20" cy="8" r="2.2" />
        <circle cx="14" cy="20" r="2.2" />
      </g>
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3.5 3.5" />
    </svg>
  );
}

export function IconPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
      <path d="M2 2l6 6M8 2l-6 6" />
    </svg>
  );
}

export function IconMinimize() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <path d="M1 5h8" />
    </svg>
  );
}

export function IconMaximize() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <rect x="1" y="1" width="8" height="8" rx="1" />
    </svg>
  );
}

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      {children}
    </svg>
  );
}

export const NavIcons = {
  dashboard: (
    <NavIcon>
      <rect x="2" y="2" width="5" height="6" rx="1" strokeLinejoin="round" />
      <rect x="9" y="2" width="5" height="3" rx="1" strokeLinejoin="round" />
      <rect x="9" y="7" width="5" height="7" rx="1" strokeLinejoin="round" />
      <rect x="2" y="10" width="5" height="4" rx="1" strokeLinejoin="round" />
    </NavIcon>
  ),
  board: (
    <NavIcon>
      <rect x="2" y="2" width="3.5" height="12" rx="1" strokeLinejoin="round" />
      <rect x="6.25" y="2" width="3.5" height="8" rx="1" strokeLinejoin="round" />
      <rect x="10.5" y="2" width="3.5" height="10" rx="1" strokeLinejoin="round" />
    </NavIcon>
  ),
  roadmap: (
    <NavIcon>
      <path d="M2 4h7M5 8h9M2 12h8" strokeLinecap="round" />
    </NavIcon>
  ),
  decisions: (
    <NavIcon>
      <path d="M8 2l6 6-6 6-6-6z" strokeLinejoin="round" />
    </NavIcon>
  ),
  docs: (
    <NavIcon>
      <path d="M4 2h5l3 3v9H4zM9 2v3h3" strokeLinejoin="round" />
    </NavIcon>
  ),
  designs: (
    <NavIcon>
      <rect x="2" y="2" width="12" height="12" rx="2" strokeLinejoin="round" />
      <path d="M2 6h12M6 6v8" strokeLinejoin="round" />
    </NavIcon>
  ),
  settings: (
    <NavIcon>
      <path d="M3 5h10M3 11h10" strokeLinecap="round" />
      <circle cx="6" cy="5" r="1.6" fill="#0e1115" stroke="currentColor" />
      <circle cx="10" cy="11" r="1.6" fill="#0e1115" stroke="currentColor" />
    </NavIcon>
  ),
};

export function IconBranch() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
      <circle cx="3.5" cy="2.5" r="1.3" />
      <circle cx="3.5" cy="9.5" r="1.3" />
      <circle cx="8.5" cy="5" r="1.3" />
      <path d="M3.5 3.8v4.4M8.5 6.3c0 1.7-2.2 1.4-5 2.2" />
    </svg>
  );
}