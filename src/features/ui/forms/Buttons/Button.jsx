export default function Button({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  className = '', 
  ...props 
}) {
  const baseClasses = 'rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2'
  
  const variantClasses = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-500',
    secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-teal-500',
    danger: 'border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-500',
    success: 'border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 focus:ring-teal-500'
  }
  
  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed'
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
