import { cx } from '../../../../shared/utils/helpers.js'

export default function DeckCard({ 
  deck, 
  currentDeckId, 
  selectedDeck, 
  onSelectDeck, 
  onLoadDeck, 
  onEditDeck, 
  onAddQuestions, 
  onDeleteDeck, 
  deckLoading,
  showDeleteConfirm,
  onShowDeleteConfirm 
}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div
      className={cx(
        'relative rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer',
        currentDeckId === deck.id 
          ? 'border-teal-500 ring-2 ring-teal-200' 
          : 'border-slate-200 hover:border-teal-300',
        selectedDeck === deck.id ? 'ring-2 ring-teal-200' : ''
      )}
      onClick={() => onSelectDeck(deck.id === selectedDeck ? null : deck.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-950 pr-2">{deck.name}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onLoadDeck(deck.id)
            }}
            disabled={deckLoading}
            className="rounded-md bg-teal-700 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          >
            Study
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEditDeck(deck.id)
            }}
            disabled={deckLoading}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAddQuestions()
            }}
            disabled={deckLoading}
            className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          >
            Add Q's
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onShowDeleteConfirm(deck.id)
            }}
            disabled={deckLoading}
            className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span className="font-medium">{deck.questionCount || deck.questions?.length || 0} questions</span>
          <span>•</span>
          <span>{formatDate(deck.date || deck.createdAt)}</span>
        </div>
        
        {deck.questions && deck.questions.length > 0 && (
          <div className="mt-3">
            <div className="font-medium text-slate-700 mb-2">Recent questions:</div>
            <div className="space-y-1">
              {deck.questions.slice(0, 3).map((question, idx) => (
                <div key={idx} className="text-xs text-slate-600 truncate">
                  • {question.question.length > 60 ? question.question.substring(0, 60) + '...' : question.question}
                </div>
              ))}
              {deck.questions.length > 3 && (
                <div className="text-xs text-slate-500 italic">
                  ...and {deck.questions.length - 3} more questions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
