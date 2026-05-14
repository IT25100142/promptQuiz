import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx'
import HomePage from './pages/HomePage.jsx'
import CreateDeckPage from './pages/CreateDeckPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import DecksPage from './pages/DecksPage.jsx'
import { QuizProvider } from './contexts/QuizContext.jsx'

export default function App() {
  return (
    <QuizProvider>
      <Layout>
        <RouteErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateDeckPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/decks" element={<DecksPage />} />
          </Routes>
        </RouteErrorBoundary>
      </Layout>
    </QuizProvider>
  )
}
