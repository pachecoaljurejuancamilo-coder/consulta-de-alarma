// Avatar ilustrado (SVG) de cada paciente ficticia.
export function avatarSVG({ piel, pelo, peinado, ropa }, etiqueta = '') {
  const atras = {
    cola: `<ellipse cx="73" cy="44" rx="11" ry="20" fill="${pelo}" transform="rotate(-18 73 44)"/>`,
    largo: `<path d="M22 40 Q20 78 30 92 L70 92 Q80 78 78 40 Z" fill="${pelo}"/>`,
    corto: `<path d="M24 42 Q22 66 32 70 L68 70 Q78 66 76 42 Z" fill="${pelo}"/>`,
  }[peinado];
  const frente = {
    cola: `<path d="M28 44 Q30 18 50 17 Q71 18 72 44 Q62 30 46 31 Q36 32 28 44 Z" fill="${pelo}"/>`,
    largo: `<path d="M27 48 Q26 17 50 16 Q74 17 73 48 Q70 34 58 28 Q44 36 27 48 Z" fill="${pelo}"/>`,
    corto: `<path d="M27 46 Q27 16 50 16 Q73 16 73 46 Q68 30 52 28 Q46 34 27 46 Z" fill="${pelo}"/>`,
  }[peinado];
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${etiqueta}" class="avatar-svg">
    <circle cx="50" cy="50" r="50" fill="#FCE6EB"/>
    <clipPath id="clip-${peinado}"><circle cx="50" cy="50" r="50"/></clipPath>
    <g clip-path="url(#clip-${peinado})">
      ${atras}
      <path d="M14 104 Q16 76 50 74 Q84 76 86 104 Z" fill="${ropa}"/>
      <path d="M42 66 L58 66 L57 78 Q50 84 43 78 Z" fill="${piel}"/>
      <ellipse cx="50" cy="46" rx="21" ry="24" fill="${piel}"/>
      ${frente}
      <ellipse cx="42" cy="49" rx="2.4" ry="3" fill="#2B1A16"/>
      <ellipse cx="58" cy="49" rx="2.4" ry="3" fill="#2B1A16"/>
      <path d="M38 43 Q42 41 46 43" stroke="#2B1A16" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M54 43 Q58 41 62 43" stroke="#2B1A16" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="57" rx="4" ry="2.4" fill="#F4A3B7" opacity=".55"/>
      <ellipse cx="62" cy="57" rx="4" ry="2.4" fill="#F4A3B7" opacity=".55"/>
      <path d="M44 60 Q50 63 56 60" stroke="#8E1B35" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M40 92 L50 84 L60 92" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
    </g>
  </svg>`;
}

// Cinta amarilla de concientización (SVG)
export const CINTA_SVG = `<svg viewBox="0 0 64 96" aria-hidden="true" class="cinta-svg">
  <path d="M32 6 C14 6 12 30 24 46 L6 86 L18 90 L32 58 L46 90 L58 86 L40 46 C52 30 50 6 32 6 Z M32 18 C40 18 41 30 32 40 C23 30 24 18 32 18 Z" fill="#F2C42C" stroke="#B8901A" stroke-width="2" stroke-linejoin="round"/>
</svg>`;
