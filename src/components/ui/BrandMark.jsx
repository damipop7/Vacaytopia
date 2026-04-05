/**
 * Wordmark: "v" + gold "topia". Use variant="light" on dark backgrounds (footer).
 */
export default function BrandMark({ className = '', variant = 'default' }) {
  const vClass = variant === 'light' ? 'text-white' : 'text-blue-brand'
  return (
    <span className={`font-display font-black tracking-tight ${className}`}>
      <span className={vClass}>v</span>
      <span className="text-gold-brand">topia</span>
    </span>
  )
}
