import MarkdownRenderer from '../../../shared/ui/display/MarkdownRenderer.jsx'

export default function ResultsDisplay({ quiz, answers, textAnswers }) {
  return (
    <div className="space-y-6">
      {quiz.map((question, questionIdx) => {
        const answer = answers[questionIdx]
        const textAnswer = textAnswers[questionIdx]
        
        return (
          <div key={questionIdx} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-950 mb-2">
                  Question {questionIdx + 1}
                </h3>
                <MarkdownRenderer text={question.question} />
                
                {question.type === 'multiple-choice' && (
                  <div className="mt-4 space-y-2">
                    {question.options.map((option, optionIdx) => (
                      <div 
                        key={optionIdx} 
                        className={`rounded-md border p-3 text-sm ${
                          optionIdx === question.answerIndex
                            ? 'border-teal-300 bg-teal-50 text-teal-950'
                            : answer === optionIdx && optionIdx !== question.answerIndex
                              ? 'border-rose-300 bg-rose-50 text-rose-950'
                              : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <span className="font-medium">
                          {String.fromCharCode(65 + optionIdx)}.
                        </span>{' '}
                        <MarkdownRenderer text={option} />
                      </div>
                    ))}
                  </div>
                )}
                
                {(question.type === 'fill-blank' || question.type === 'cloze') && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">Your answer:</p>
                    <p className="text-sm text-slate-900">{textAnswer || 'No answer'}</p>
                    <p className="text-sm font-medium text-teal-700 mt-2">Correct answer:</p>
                    <p className="text-sm text-teal-900">{question.answers.join(', ')}</p>
                  </div>
                )}
                
                {question.type === 'short-answer' && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">Your answer:</p>
                    <p className="text-sm text-slate-900">{textAnswer || 'No answer'}</p>
                    <p className="text-sm font-medium text-teal-700 mt-2">Model answer:</p>
                    <p className="text-sm text-teal-900">{question.suggestedAnswer}</p>
                  </div>
                )}
              </div>
              
              <div className="flex shrink-0 items-center">
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  answer?.isCorrect || answer?.selfAssessedCorrect
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {answer?.isCorrect || answer?.selfAssessedCorrect ? 'Correct' : 'Incorrect'}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
