// Cinta amarilla de concientización de la endometriosis
export const CINTA_PATH = 'M32 6C14 6 12 30 24 46L6 86l12 4 14-32 14 32 12-4-18-40C52 30 50 6 32 6Zm0 12c8 0 9 12 0 22-9-10-8-22 0-22Z';

export function CintaSVG({ className = '' }) {
  return (
    <svg viewBox="0 0 64 96" aria-hidden="true" className={className}>
      <path d={CINTA_PATH} fill="#F2C42C" stroke="#B8901A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
