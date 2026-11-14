/** The logo's bridge at full scale. Stands in until the merchant supplies a hero image. */
export function HeroArt() {
  return (
    <div className="overflow-hidden rounded-panel bg-mint">
      <svg viewBox="0 0 480 360" aria-hidden className="block h-auto w-full">
        <circle cx="240" cy="118" r="46" className="fill-teal" />
        <path
          d="M120 292V112M360 292V112M120 232c38-88 202-88 240 0"
          fill="none"
          strokeWidth="26"
          strokeLinecap="round"
          className="stroke-navy"
        />
        <path
          d="M64 304h352"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-sage"
        />
      </svg>
    </div>
  );
}
