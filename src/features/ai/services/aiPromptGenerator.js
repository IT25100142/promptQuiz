export function generateAIPrompt({ studyNotes, selectedQuestionTypes, numberOfQuestions, topicInstructions }) {
  const selectedTypes = Object.entries(selectedQuestionTypes)
    .filter(([_, selected]) => selected)
    .map(([type, _]) => type)
  
  if (selectedTypes.length === 0) {
    return { error: 'Please select at least one question type' }
  }

  let formatSpecs = ''
  
  if (selectedTypes.includes('multipleChoice')) {
    formatSpecs += `Multiple Choice Questions (default, no marker):
1. What does HTTP stand for?
A. HyperText Transfer Protocol
B. High Transfer Text Protocol
C. Hyper Transfer Type Protocol
D. Home Tool Transfer Protocol
*B

`
  }
  
  if (selectedTypes.includes('trueFalse')) {
    formatSpecs += `True/False Questions:
2. [T/F] The Earth is flat.
*F

`
  }
  
  if (selectedTypes.includes('fillBlank')) {
    formatSpecs += `Fill in the Blank Questions:
3. [FIB] Water boils at ___ degrees Celsius.
*100

`
  }
  
  if (selectedTypes.includes('cloze')) {
    formatSpecs += `Cloze Deletion Questions:
4. [CLOZE] The capital of France is Paris.
*capital, Paris

`
  }
  
  if (selectedTypes.includes('shortAnswer')) {
    formatSpecs += `Short Answer Questions (self-assess):
5. [SA] Explain what makes a good user interface.
*Suggested: Clear navigation, consistent design, responsive layout, and accessibility features

`
  }

  const notesSection = studyNotes.trim() 
    ? `Base all questions entirely on these study notes:
\`\`\`
${studyNotes.trim()}
\`\`\`

`
    : 'Use your general knowledge on the topic.\n'

  const prompt = `You are a quiz generation engine. Output only properly formatted questions, with no greetings or explanations.

Generate exactly ${numberOfQuestions} questions using the following format specifications:

${formatSpecs}

${notesSection}Topic and instructions: ${topicInstructions || 'General knowledge quiz'}

Requirements:
- Adhere strictly to the format examples above
- Each question must be separated by one blank line
- Use asterisk (*) for correct answers
- Include type markers ([T/F], [FIB], [CLOZE], [SA]) for non-MCQ questions
- Distribute question types among the selected formats
- Output only the quiz text, nothing else
- No introductory or concluding remarks`

  return prompt
}

export function parseAIResponse(aiResponse, quizState) {
  if (!aiResponse.trim()) {
    return { error: 'Please paste AI response first' }
  }

  // Clean up AI response - remove common AI prefixes/suffixes
  let cleanedResponse = aiResponse.trim()
  
  // Remove common AI introductory phrases
  const introPatterns = [
    /^Here are your questions?:?\s*/i,
    /^Here are the questions?:?\s*/i,
    /^Questions?:?\s*/i,
    /^Sure, here are the questions?:?\s*/i,
    /^Certainly, here are the questions?:?\s*/i,
  ]
  
  introPatterns.forEach(pattern => {
    cleanedResponse = cleanedResponse.replace(pattern, '')
  })
  
  // Remove common AI concluding phrases
  const outroPatterns = [
    /\s*I hope this helps!?\s*$/i,
    /\s*Let me know if you need anything else!\s*$/i,
    /\s*Feel free to ask if you need more questions!\s*$/i,
  ]
  
  outroPatterns.forEach(pattern => {
    cleanedResponse = cleanedResponse.replace(pattern, '')
  })

  const parsed = quizState.preview || quizState.safeParseQuizJson?.(cleanedResponse)
  
  if (parsed?.ok) {
    return { success: true, questions: parsed.value }
  } else {
    // Try to extract partial questions for better error reporting
    const lines = cleanedResponse.split('\n').filter(line => line.trim())
    const questionCount = lines.filter(line => /^\d+\./.test(line)).length
    return { 
      error: `Could not parse AI response. Found ${questionCount} potential questions. Error: ${parsed?.error || 'Unknown error'}` 
    }
  }
}
