/** Store-written text, one paragraph per entry. */
export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="max-w-prose space-y-3 text-sm leading-relaxed text-muted">
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}
