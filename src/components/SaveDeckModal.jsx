import { useState } from 'react'
import Button from '../features/ui/forms/Buttons/Button.jsx'
export default function SaveDeckModal({ showSaveDeck, setShowSaveDeck, onSaveDeck, deckLoading }) {
  const [deckName, setDeckName] = useState('')
  const [saveError, setSaveError] = useState('')

  const handleSave = () => {
    if (!deckName.trim()) {
      setSaveError('Please enter a deck name')
      return
    }
    
    onSaveDeck(deckName.trim(), setSaveError)
  }

  if (!showSaveDeck) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Save Deck</h3>
        <div className="mt-4">
          <label htmlFor="deckName" className="block text-sm font-medium text-slate-700">
            Deck Name
          </label>
          <input
            type="text"
            id="deckName"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Enter deck name"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {saveError && (
            <p className="mt-2 text-sm text-rose-600">{saveError}</p>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={deckLoading}
            className="flex-1 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-45"
          >
            Save
          </Button>
          <Button
            type="button"
            onClick={() => {
              setShowSaveDeck(false)
              setDeckName('')
              setSaveError('')
            }}
            className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
