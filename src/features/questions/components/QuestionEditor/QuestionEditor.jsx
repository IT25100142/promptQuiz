import { useState } from 'react'
import { cx } from '../../../../shared/utils/helpers.js'

export default function QuestionEditor({
  questions,
  onUpdateQuestion,
  onDeleteQuestion,
  onReorderQuestions,
  loading = false
}) {
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [draggedQuestion, setDraggedQuestion] = useState(null)
  const [dragOverQuestion, setDragOverQuestion] = useState(null)

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question })
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return

    try {
      await onUpdateQuestion(editingQuestion.id, editingQuestion)
      setEditingQuestion(null)
    } catch (error) {
      console.error('Failed to update question:', error)
    }
  }

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      await onDeleteQuestion(questionId)
    } catch (error) {
      console.error('Failed to delete question:', error)
    }
  }

  const handleDragStart = (e, question) => {
    setDraggedQuestion(question)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, question) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverQuestion(question)
  }

  const handleDragLeave = () => {
    setDragOverQuestion(null)
  }

  const handleDrop = (e, targetQuestion) => {
    e.preventDefault()
    setDragOverQuestion(null)

    if (!draggedQuestion || draggedQuestion.id === targetQuestion.id) return

    const newQuestions = [...questions]
    const draggedIndex = newQuestions.findIndex(q => q.id === draggedQuestion.id)
    const targetIndex = newQuestions.findIndex(q => q.id === targetQuestion.id)

    newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(targetIndex, 0, draggedQuestion)

    // Update order property
    newQuestions.forEach((q, index) => {
      q.order = index
    })

    onReorderQuestions(newQuestions)
    setDraggedQuestion(null)
  }

  const handleQuestionChange = (field, value) => {
    if (!editingQuestion) return

    setEditingQuestion(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOptionChange = (optionIndex, field, value) => {
    if (!editingQuestion || !editingQuestion.options) return

    const newOptions = [...editingQuestion.options]
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      [field]: value
    }

    setEditingQuestion(prev => ({
      ...prev,
      options: newOptions
    }))
  }

  const addOption = () => {
    if (!editingQuestion || !editingQuestion.options) return

    const newOptions = [...editingQuestion.options, { text: '', explanation: '' }]
    setEditingQuestion(prev => ({
      ...prev,
      options: newOptions
    }))
  }

  const removeOption = (optionIndex) => {
    if (!editingQuestion || !editingQuestion.options) return

    const newOptions = editingQuestion.options.filter((_, index) => index !== optionIndex)
    setEditingQuestion(prev => ({
      ...prev,
      options: newOptions
    }))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Questions ({questions.length})</h3>
      
      {questions.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No questions yet. Add questions using the input area above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, questionIndex) => (
            <div
              key={question.id}
              className={cx(
                "border rounded-lg p-4 transition-all",
                draggedQuestion?.id === question.id ? "opacity-50" : "",
                dragOverQuestion?.id === question.id ? "border-blue-400 bg-blue-50" : "border-slate-200",
                editingQuestion?.id === question.id ? "border-teal-400 bg-teal-50" : ""
              )}
              draggable
              onDragStart={(e) => handleDragStart(e, question)}
              onDragOver={(e) => handleDragOver(e, question)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, question)}
            >
              {editingQuestion?.id === question.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
                    <textarea
                      value={editingQuestion.question || ''}
                      onChange={(e) => handleQuestionChange('question', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Enter question text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={editingQuestion.type || 'multiple-choice'}
                      onChange={(e) => handleQuestionChange('type', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="fill-blank">Fill in the Blank</option>
                      <option value="cloze">Cloze Deletion</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>

                  {editingQuestion.type === 'multiple-choice' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Options</label>
                      <div className="space-y-2">
                        {editingQuestion.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2 items-center">
                            <input
                              type="radio"
                              name="correct-answer"
                              checked={editingQuestion.answerIndex === optionIndex}
                              onChange={() => handleQuestionChange('answerIndex', optionIndex)}
                              className="mt-1"
                            />
                            <input
                              type="text"
                              value={option.text || ''}
                              onChange={(e) => handleOptionChange(optionIndex, 'text', e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                            {editingQuestion.options?.length > 2 && (
                              <button
                                onClick={() => removeOption(optionIndex)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        {editingQuestion.options?.length < 6 && (
                          <button
                            onClick={addOption}
                            className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {(editingQuestion.type === 'fill-blank' || editingQuestion.type === 'short-answer' || editingQuestion.type === 'cloze') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer</label>
                      <input
                        type="text"
                        value={editingQuestion.answer || ''}
                        onChange={(e) => handleQuestionChange('answer', e.target.value)}
                        placeholder="Enter correct answer"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveQuestion}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="cursor-move p-1 hover:bg-slate-100 rounded">
                        <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700">Q{questionIndex + 1}</span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {question.type || 'multiple-choice'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-slate-900 mb-2">{question.question}</div>
                  
                  {question.type === 'multiple-choice' && question.options && (
                    <div className="space-y-1 ml-4">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className={cx(
                          "flex items-center gap-2 text-sm",
                          question.answerIndex === optionIndex ? "text-teal-700 font-medium" : "text-slate-600"
                        )}>
                          <span className={cx(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs",
                            question.answerIndex === optionIndex ? "border-teal-600 bg-teal-100" : "border-slate-300"
                          )}>
                            {question.answerIndex === optionIndex && "✓"}
                          </span>
                          {option.text}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(question.type === 'fill-blank' || question.type === 'short-answer' || question.type === 'cloze') && (
                    <div className="ml-4 text-sm">
                      <span className="text-teal-700 font-medium">Answer: </span>
                      <span className="text-slate-700">{question.answer}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
