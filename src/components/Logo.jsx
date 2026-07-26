export default function Logo({ className = 'h-11 w-auto', ...props }) {
  return (
    <img
      src="/images/logo.png"
      alt="Peptide Ops"
      className={`object-contain object-left ${className}`}
      draggable={false}
      {...props}
    />
  )
}
