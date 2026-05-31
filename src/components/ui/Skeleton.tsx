export function Skel({
  className = '',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ backgroundColor: 'var(--skeleton)', ...style }}
    />
  )
}
