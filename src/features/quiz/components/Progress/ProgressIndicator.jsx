export default function ProgressIndicator({ 
  idx, 
  total, 
  answeredCount, 
  score, 
  isReviewMode, 
  incorrectQuestions 
}) {
  return (
    <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
      {Math.round(progress)}% through
    </div>
  )
}
