import { cx } from '../utils/helpers.js'

export default function AnswerButton({ 
  option, 
  optionIdx, 
  isSelected, 
  isCorrect, 
  isWrongSelected, 
  answered, 
  onClick 
}) {
  const variant = answered
    ? isCorrect
      ? 'border-teal-300 bg-teal-50 text-teal-950'
      : isWrongSelected
        ? 'border-rose-300 bg-rose-50 text-rose-950'
        : 'border-slate-200 bg-white text-slate-800'
    : 'border-slate-200 bg-white text-slate-900 hover:border-teal-300 hover:bg-teal-50'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={answered}
      className={cx(
        'rounded-md border px-4 py-3 text-sm font-semibold',
        variant
      )}
    >
      {option}
    </button>
  )
}
