import { useState } from 'react'
import PromptForm from './PromptForm.jsx'
import PromptPreview from './PromptPreview.jsx'
import ResponseParser from './ResponseParser.jsx'
import AIChat from '../AIInterface/AIChat.jsx'
import Modal from '../../../ui/forms/Modals/Modal.jsx'

export default function AIPromptBuilder({
  showAIPromptBuilder,
  setShowAIPromptBuilder,
  aiResponse,
  setAiResponse,
  parseMessage,
  setParseMessage,
  onGeneratePrompt,
  onParseResponse,
  onCopyToClipboard
}) {
  const [studyNotes, setStudyNotes] = useState('')
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState({
    multipleChoice: true,
    trueFalse: true,
    fillBlank: false,
    cloze: false,
    shortAnswer: false
  })
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)
  const [topicInstructions, setTopicInstructions] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const handleGeneratePrompt = () => {
    const prompt = onGeneratePrompt({
      studyNotes,
      selectedQuestionTypes,
      numberOfQuestions,
      topicInstructions
    })
    setGeneratedPrompt(prompt)
  }

  if (!showAIPromptBuilder) return null

  return (
    <Modal
      isOpen={showAIPromptBuilder}
      onClose={() => setShowAIPromptBuilder(false)}
      title="AI Prompt Builder"
    >
      <PromptForm
        studyNotes={studyNotes}
        setStudyNotes={setStudyNotes}
        selectedQuestionTypes={selectedQuestionTypes}
        setSelectedQuestionTypes={setSelectedQuestionTypes}
        numberOfQuestions={numberOfQuestions}
        setNumberOfQuestions={setNumberOfQuestions}
        topicInstructions={topicInstructions}
        setTopicInstructions={setTopicInstructions}
        onGeneratePrompt={handleGeneratePrompt}
      />

      {generatedPrompt && (
        <PromptPreview
          generatedPrompt={generatedPrompt}
          onCopyToClipboard={onCopyToClipboard}
        />
      )}

      {generatedPrompt && (
        <ResponseParser
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
          onParseResponse={() => onParseResponse({ 
            aiResponse, 
            generatedPrompt, 
            studyNotes, 
            selectedQuestionTypes, 
            numberOfQuestions, 
            topicInstructions 
          })}
        />
      )}

      <AIChat parseMessage={parseMessage} />
    </Modal>
  )
}
