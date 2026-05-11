export default function QuestionTypeSelector({ selectedQuestionTypes, setSelectedQuestionTypes }) {
  const questionTypes = [
    { key: 'multipleChoice', label: 'Multiple Choice' },
    { key: 'trueFalse', label: 'True/False' },
    { key: 'fillBlank', label: 'Fill in Blank' },
    { key: 'cloze', label: 'Cloze' },
    { key: 'shortAnswer', label: 'Short Answer' }
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {questionTypes.map(({ key, label }) => (
        <label key={key} className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedQuestionTypes[key]}
            onChange={(e) => setSelectedQuestionTypes(prev => ({
              ...prev,
              [key]: e.target.checked
            }))}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      ))}
    </div>
  )
}
