import { Link, useLocation } from 'react-router-dom'
import { useQuizContext } from '../contexts/QuizContext.jsx'

export default function Navigation() {
  const location = useLocation()
  const { savedDecks } = useQuizContext()

  const isActive = (path) => {
    return location.pathname === path
  }

  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      path: '/create', 
      label: 'Create', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    { 
      path: '/decks', 
      label: `Decks (${savedDecks.length})`, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent hover:from-teal-700 hover:to-cyan-700 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <span>PromptQuiz</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    isActive(item.path)
                      ? 'bg-teal-50 text-teal-700 border-teal-500'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  } inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-all duration-200 group`}
                >
                  <span className={`${
                    isActive(item.path) ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                  } mr-2 transition-colors duration-200`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <div className="bg-slate-100 rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium text-slate-700">
                {navItems.find(item => isActive(item.path))?.label}
              </span>
            </div>
          </div>
        </div>
        
        {/* Mobile navigation */}
        <div className="sm:hidden border-t border-slate-200">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${
                  isActive(item.path)
                    ? 'bg-teal-50 border-l-4 border-teal-500 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                } group flex items-center pl-3 pr-4 py-3 text-base font-medium transition-all duration-200`}
              >
                <span className={`${
                  isActive(item.path) ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                } mr-3 transition-colors duration-200`}>
                  {item.icon}
                </span>
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.path === '/' && (
                    <div className="text-xs text-slate-500 mt-0.5">Get started with PromptQuiz</div>
                  )}
                  {item.path === '/create' && (
                    <div className="text-xs text-slate-500 mt-0.5">Create new flashcards</div>
                  )}
                  {item.path === '/decks' && (
                    <div className="text-xs text-slate-500 mt-0.5">Manage your collections</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
