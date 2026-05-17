export const initialState = {
  rawJson: '',
  inputError: '',
  quiz: [],
  answers: [],
  idx: 0,
  currentDeckId: null,
  savedDecks: [],
  decksLoadStatus: 'idle',
  decksLoadError: null,
  appNotice: null,
  isReviewMode: false,
  incorrectQuestions: [],
  isSpacedRepetition: false,
  showReviewButtons: false,
  reviewSchedule: [],
  shuffleMode: false,
  keepFirstQuestion: false,
  originalQuiz: [],
  showCardOverview: false,
  aiResponse: '',
  parseMessage: '',
  showAIPromptBuilder: false,
  textAnswers: {},
  showSuggestedAnswer: {},
  // Deck hierarchy state
  currentQuizId: null,
  deckQuizzes: [],
  selectedDeckForQuiz: null,
  isCreatingDeck: false,
  isCreatingQuiz: false,
};

export function quizReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_RAW_JSON':
      return { ...state, rawJson: action.payload, inputError: '' };
    case 'SET_INPUT_ERROR':
      return { ...state, inputError: action.payload };
    case 'SET_QUIZ':
      return { ...state, quiz: action.payload };
    case 'SET_ANSWERS':
      return { ...state, answers: action.payload };
    case 'SET_IDX':
      return { ...state, idx: action.payload };
    case 'SET_CURRENT_DECK_ID':
      return { ...state, currentDeckId: action.payload };
    case 'SET_SAVED_DECKS':
      return { ...state, savedDecks: action.payload };
    case 'SET_DECKS_LOAD_STATUS':
      return { ...state, decksLoadStatus: action.payload };
    case 'SET_DECKS_LOAD_ERROR':
      return { ...state, decksLoadError: action.payload };
    case 'SET_APP_NOTICE':
      return { ...state, appNotice: action.payload };
    case 'TOGGLE_REVIEW_MODE':
      return { ...state, isReviewMode: !state.isReviewMode };
    case 'SET_INCORRECT_QUESTIONS':
      return { ...state, incorrectQuestions: action.payload };
    case 'RESET_SESSION':
      return {
        ...state,
        idx: 0,
        answers: [],
        textAnswers: {},
        showSuggestedAnswer: {},
        isReviewMode: false,
        incorrectQuestions: [],
      };
    // Add other specific actions as needed
    default:
      return state;
  }
}
