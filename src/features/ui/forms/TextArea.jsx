export default function TextArea({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  disabled = false, 
  rows = 4, 
  className = '', 
  ...props 
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  )
}
