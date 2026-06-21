import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuizProvider } from './contexts/QuizContext.jsx';
import Layout from './components/Layout.jsx';
import DecksPage from './pages/DecksPage.jsx';
import CreateDeckPage from './pages/CreateDeckPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export default function App() {
  return (
    <QuizProvider>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          {/* Main Layout wrapping all routes */}
          <Route element={<Layout />}>
            {/* Redirect root page to decks dashboard */}
            <Route path="/" element={<Navigate to="/decks" replace />} />
            
            {/* Main Library Dashboard */}
            <Route path="/decks" element={<DecksPage />} />
            
            {/* Structured Creation workflow panels */}
            <Route path="/create-deck" element={<CreateDeckPage />} />
            
            {/* Legacy redirect for edit workflow routing */}
            <Route path="/create" element={<Navigate to="/create-deck" replace />} />
            
            {/* Active Quiz and Results sections */}
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QuizProvider>
  );
}
