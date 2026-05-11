export default function ProgressBar({ progress }) {
  return (
    <div
      className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(progress)}
    >
      <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
    </div>
  )
}
