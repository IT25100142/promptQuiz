// IndexedDB utility functions for deck storage
const DB_NAME = 'PromptQuizDB'
const DB_VERSION = 1
const STORE_NAME = 'decks'

// Initialize IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object store for decks
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        })
        
        // Create indexes for searching
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('date', 'date', { unique: false })
      }
      
      // Create object store for review schedule
      if (!db.objectStoreNames.contains('reviewSchedule')) {
        const reviewStore = db.createObjectStore('reviewSchedule', {
          keyPath: 'id',
          autoIncrement: true
        })
        
        // Create indexes for review schedule
        reviewStore.createIndex('questionId', 'questionId', { unique: true })
        reviewStore.createIndex('nextReviewDate', 'nextReviewDate', { unique: false })
        reviewStore.createIndex('deckId', 'deckId', { unique: false })
      }
    }
  })
}

// Save a deck to IndexedDB
async function saveDeck(deckData, deckName) {
  try {
    const db = await initDB()
    
    // Check for duplicate names
    const existingDeck = await getDeckByName(deckName)
    
    const deck = {
      name: deckName,
      date: new Date().toISOString(),
      questions: deckData,
      questionCount: deckData.length
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      if (existingDeck) {
        // Update existing deck
        deck.id = existingDeck.id
        const request = store.put(deck)
      } else {
        // Add new deck
        const request = store.add(deck)
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to save deck: ${error.message}`)
  }
}

// Get all saved decks
async function getAllDecks() {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get decks: ${error.message}`)
  }
}

// Get a deck by name
async function getDeckByName(name) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('name')
      const request = index.get(name)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get deck by name: ${error.message}`)
  }
}

// Get a deck by ID
async function getDeckById(id) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get deck by ID: ${error.message}`)
  }
}

// Delete a deck by ID
async function deleteDeck(id) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to delete deck: ${error.message}`)
  }
}

// Save last used deck ID to localStorage
function saveLastUsedDeckId(deckId) {
  try {
    localStorage.setItem('promptquiz_last_deck_id', deckId.toString())
  } catch (error) {
    console.warn('Failed to save last used deck ID to localStorage:', error)
  }
}

// Get last used deck ID from localStorage
function getLastUsedDeckId() {
  try {
    const deckId = localStorage.getItem('promptquiz_last_deck_id')
    return deckId ? parseInt(deckId, 10) : null
  } catch (error) {
    console.warn('Failed to get last used deck ID from localStorage:', error)
    return null
  }
}

// Clear last used deck ID from localStorage
function clearLastUsedDeckId() {
  try {
    localStorage.removeItem('promptquiz_last_deck_id')
  } catch (error) {
    console.warn('Failed to clear last used deck ID from localStorage:', error)
  }
}

// SM-2 Algorithm for spaced repetition
function calculateNextReviewDate(easeFactor, intervalDays, performanceQuality) {
  // SM-2 formula: newInterval = interval * (easeFactor ^ (performanceQuality - 5))
  // performanceQuality: 5=perfect, 4=correct, 3=difficult, 2=vague
  const newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (performanceQuality * 0.02)))
  const newInterval = Math.max(1, Math.round(intervalDays * Math.pow(newEaseFactor, performanceQuality - 5)))
  
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + newInterval)
  
  return {
    nextReviewDate: nextDate.toISOString(),
    interval: newInterval,
    easeFactor: newEaseFactor
  }
}

// Save review schedule for a question
async function saveReviewSchedule(questionId, deckId, interval = 1, easeFactor = 2.5) {
  try {
    const db = await initDB()
    
    const reviewData = {
      questionId,
      deckId,
      interval,
      easeFactor,
      nextReviewDate: new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString(),
      createdDate: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readwrite')
      const store = transaction.objectStore('reviewSchedule')
      const request = store.put(reviewData)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to save review schedule: ${error.message}`)
  }
}

// Get review schedule for a specific question
async function getReviewSchedule(questionId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readonly')
      const store = transaction.objectStore('reviewSchedule')
      const index = store.index('questionId')
      const request = index.get(questionId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get review schedule: ${error.message}`)
  }
}

// Update review schedule after answering
async function updateReviewSchedule(questionId, performanceQuality) {
  try {
    const existing = await getReviewSchedule(questionId)
    if (!existing) return

    const { nextReviewDate: nextDate, interval, easeFactor } = calculateNextReviewDate(
      existing.easeFactor,
      existing.interval,
      performanceQuality
    )

    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readwrite')
      const store = transaction.objectStore('reviewSchedule')
      const request = store.put({
        ...existing,
        nextReviewDate,
        interval,
        easeFactor,
        lastReviewedDate: new Date().toISOString()
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to update review schedule: ${error.message}`)
  }
}

// Get all due reviews for daily review
async function getDueReviews() {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readonly')
      const store = transaction.objectStore('reviewSchedule')
      const index = store.index('nextReviewDate')
      const request = index.getAll(IDBKeyRange.upperBound(new Date().toISOString()))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get due reviews: ${error.message}`)
  }
}

// Delete review schedule for a deck
async function deleteReviewSchedule(deckId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readwrite')
      const store = transaction.objectStore('reviewSchedule')
      const index = store.index('deckId')
      const request = index.getAll(deckId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const reviews = request.result || []
        const deleteTransaction = db.transaction(['reviewSchedule'], 'readwrite')
        const deleteStore = deleteTransaction.objectStore('reviewSchedule')
        
        let completed = 0
        reviews.forEach(review => {
          const deleteRequest = deleteStore.delete(review.id)
          deleteRequest.onsuccess = () => {
            completed++
            if (completed === reviews.length) {
              resolve(completed)
            }
          }
        })
      }
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to delete review schedule: ${error.message}`)
  }
}

export {
  saveDeck,
  getAllDecks,
  getDeckByName,
  getDeckById,
  deleteDeck,
  saveLastUsedDeckId,
  getLastUsedDeckId,
  clearLastUsedDeckId,
  saveReviewSchedule,
  getReviewSchedule,
  updateReviewSchedule,
  getDueReviews,
  deleteReviewSchedule
}
