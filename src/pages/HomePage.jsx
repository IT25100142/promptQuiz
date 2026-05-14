import { Link } from 'react-router-dom'
import { useQuizContext } from '../contexts/QuizContext.jsx'

export default function HomePage() {
  const { savedDecks } = useQuizContext()

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50 rounded-3xl mx-4 mt-8 mb-12 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/10 to-cyan-400/10"></div>
        <div className="relative px-8 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Interactive Learning Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                PromptQuiz
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create, practice, and master your knowledge with interactive flashcards and intelligent learning systems
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/create"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Deck</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link
                to="/decks"
                className="group inline-flex items-center gap-3 bg-white text-slate-700 px-8 py-4 rounded-2xl font-semibold hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>My Decks</span>
                <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-semibold">
                  {savedDecks.length}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Why Choose PromptQuiz?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-100">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">AI-Powered Creation</h3>
            <p className="text-slate-600 leading-relaxed">
              Generate intelligent flashcards using advanced AI. Simply describe your topic and let our AI create comprehensive questions for you.
            </p>
          </div>
          
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-100">
            <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Spaced Repetition</h3>
            <p className="text-slate-600 leading-relaxed">
              Learn efficiently with scientifically-proven spaced repetition algorithms. Review content at optimal intervals for maximum retention.
            </p>
          </div>
          
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-100">
            <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Progress Tracking</h3>
            <p className="text-slate-600 leading-relaxed">
              Monitor your learning progress with detailed analytics. Track performance, identify weak areas, and celebrate your achievements.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {savedDecks.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Your Learning Progress</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">{savedDecks.length}</div>
                <div className="text-slate-600">Total Decks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-600 mb-2">
                  {savedDecks.reduce((acc, deck) => acc + (deck.questions?.length || 0), 0)}
                </div>
                <div className="text-slate-600">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">∞</div>
                <div className="text-slate-600">Learning Potential</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of learners who are mastering new subjects with PromptQuiz
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-3 bg-white text-teal-600 px-8 py-4 rounded-2xl font-semibold hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Get Started Now</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
