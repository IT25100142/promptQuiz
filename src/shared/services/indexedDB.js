// IndexedDB utility functions for deck storage
import { validateLibrarySnapshot, validateQuizQuestions } from '../schemas/quizQuestions.js'
import { calculateNextReview } from './sm2.js'

const DB_NAME = 'PromptQuizDB'
const DB_VERSION = 2 // Increment version for schema upgrade

let dbOpenPromise = null

// Initialize IndexedDB (single shared connection promise)
async function initDB() {
  if (dbOpenPromise) {
    return dbOpenPromise
  }

  dbOpenPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      dbOpenPromise = null
      reject(request.error)
    }

    request.onsuccess = () => {
      const db = request.result
      db.onclose = () => {
        dbOpenPromise = null
      }
      db.onversionchange = () => {
        db.close()
        dbOpenPromise = null
      }
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object store for decks (folders)
      if (!db.objectStoreNames.contains('decks')) {
        const deckStore = db.createObjectStore('decks', {
          keyPath: 'id',
          autoIncrement: true
        })
        
        // Create indexes for searching decks
        deckStore.createIndex('name', 'name', { unique: false })
        deckStore.createIndex('date', 'date', { unique: false })
      }
      
      // Create object store for quizzes (files within decks)
      if (!db.objectStoreNames.contains('quizzes')) {
        const quizStore = db.createObjectStore('quizzes', {
          keyPath: 'id',
          autoIncrement: true
        })
        
        // Create indexes for searching quizzes
        quizStore.createIndex('name', 'name', { unique: false })
        quizStore.createIndex('deckId', 'deckId', { unique: false })
        quizStore.createIndex('date', 'date', { unique: false })
      }
      
      // Create object store for questions (individual questions within quizzes)
      if (!db.objectStoreNames.contains('questions')) {
        const questionStore = db.createObjectStore('questions', {
          keyPath: 'id',
          autoIncrement: true
        })
        
        // Create indexes for searching questions
        questionStore.createIndex('quizId', 'quizId', { unique: false })
        questionStore.createIndex('deckId', 'deckId', { unique: false })
        questionStore.createIndex('order', 'order', { unique: false })
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

  return dbOpenPromise
}

// Create a new deck (folder)
async function createDeck(deckName, description = '') {
  try {
    const db = await initDB()
    
    const deck = {
      name: deckName,
      date: new Date().toISOString(),
      description
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite')
      const store = transaction.objectStore('decks')
      const request = store.add(deck)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to create deck: ${error.message}`)
  }
}

// Update deck metadata
async function updateDeck(deckId, updates) {
  try {
    const db = await initDB()
    const existingDeck = await getDeckById(deckId)
    
    if (!existingDeck) {
      throw new Error('Deck not found')
    }

    const updatedDeck = { ...existingDeck, ...updates, id: deckId }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite')
      const store = transaction.objectStore('decks')
      const request = store.put(updatedDeck)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to update deck: ${error.message}`)
  }
}

// Delete a deck and all its quizzes and questions
async function deleteDeck(deckId) {
  try {
    const db = await initDB()
    
    // Get all quizzes in this deck
    const quizzes = await getQuizzesByDeckId(deckId)
    
    // Delete all questions from all quizzes in this deck
    for (const quiz of quizzes) {
      await deleteQuestionsByQuizId(quiz.id)
    }
    
    // Delete all quizzes in this deck
    await deleteQuizzesByDeckId(deckId)
    
    // Delete the deck
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite')
      const store = transaction.objectStore('decks')
      const request = store.delete(deckId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to delete deck: ${error.message}`)
  }
}

// QUIZ MANAGEMENT FUNCTIONS

// Create a new quiz within a deck
async function createQuiz(deckId, quizName, description = '') {
  try {
    const db = await initDB()
    
    const quiz = {
      name: quizName,
      deckId: deckId,
      date: new Date().toISOString(),
      description
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quizzes'], 'readwrite')
      const store = transaction.objectStore('quizzes')
      const request = store.add(quiz)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to create quiz: ${error.message}`)
  }
}

// Get all quizzes in a deck
async function getQuizzesByDeckId(deckId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quizzes'], 'readonly')
      const store = transaction.objectStore('quizzes')
      const index = store.index('deckId')
      const request = index.getAll(deckId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get quizzes: ${error.message}`)
  }
}

// Update quiz metadata
async function updateQuiz(quizId, updates) {
  try {
    const db = await initDB()
    const existingQuiz = await getQuizById(quizId)
    
    if (!existingQuiz) {
      throw new Error('Quiz not found')
    }

    const updatedQuiz = { ...existingQuiz, ...updates, id: quizId }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quizzes'], 'readwrite')
      const store = transaction.objectStore('quizzes')
      const request = store.put(updatedQuiz)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to update quiz: ${error.message}`)
  }
}

// Delete a quiz and all its questions
async function deleteQuiz(quizId) {
  try {
    const db = await initDB()
    
    // Delete all questions in this quiz
    await deleteQuestionsByQuizId(quizId)
    
    // Delete the quiz
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quizzes'], 'readwrite')
      const store = transaction.objectStore('quizzes')
      const request = store.delete(quizId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to delete quiz: ${error.message}`)
  }
}

// Delete all quizzes in a deck
async function deleteQuizzesByDeckId(deckId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quizzes'], 'readwrite')
      const store = transaction.objectStore('quizzes')
      const index = store.index('deckId')
      const request = index.getAll(deckId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const quizzes = request.result || []
        let completed = 0
        
        if (quizzes.length === 0) {
          resolve(0)
          return
        }
        
        quizzes.forEach(quiz => {
          const deleteRequest = store.delete(quiz.id)
          deleteRequest.onsuccess = () => {
            completed++
            if (completed === quizzes.length) {
              resolve(completed)
            }
          }
        })
      }
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to delete quizzes: ${error.message}`)
  }
}

// QUESTION MANAGEMENT FUNCTIONS

// Add questions to a quiz
async function addQuestions(quizId, deckId, questions) {
  try {
    const db = await initDB()
    const existingQuestions = await getQuestionsByQuizId(quizId)
    const startOrder = existingQuestions.length
    
    const questionsToSave = questions.map((question, index) => ({
      ...question,
      quizId: quizId,
      deckId: deckId,
      order: startOrder + index,
      date: new Date().toISOString()
    }))

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['questions'], 'readwrite')
      const store = transaction.objectStore('questions')
      
      let completed = 0
      const results = []
      
      questionsToSave.forEach(question => {
        const request = store.add(question)
        request.onsuccess = () => {
          results.push(request.result)
          completed++
          if (completed === questionsToSave.length) {
            resolve(results)
          }
        }
        request.onerror = () => reject(request.error)
      })
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to add questions: ${error.message}`)
  }
}

// Get all questions in a quiz
async function getQuestionsByQuizId(quizId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['questions'], 'readonly')
      const store = transaction.objectStore('questions')
      const index = store.index('quizId')
      const request = index.getAll(quizId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const questions = request.result || []
        // Sort by order
        questions.sort((a, b) => a.order - b.order)
        resolve(questions)
      }
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get questions: ${error.message}`)
  }
}

// Get count of questions in a quiz (fast native row count)
async function getQuestionsCountByQuizId(quizId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['questions'], 'readonly')
      const store = transaction.objectStore('questions')
      const index = store.index('quizId')
      const request = index.count(quizId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || 0)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get questions count: ${error.message}`)
  }
}

// Update a specific question
async function updateQuestion(questionId, updates) {
  try {
    const db = await initDB()
    const existingQuestion = await getQuestionById(questionId)
    
    if (!existingQuestion) {
      throw new Error('Question not found')
    }

    const updatedQuestion = { ...existingQuestion, ...updates, id: questionId }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['questions'], 'readwrite')
      const store = transaction.objectStore('questions')
      const request = store.put(updatedQuestion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to update question: ${error.message}`)
  }
}

// Delete a specific question
async function deleteQuestion(questionId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['questions'], 'readwrite')
      const store = transaction.objectStore('questions')
      const request = store.delete(questionId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to delete question: ${error.message}`)
  }
}

// Delete all questions in a quiz
async function deleteQuestionsByQuizId(quizId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['questions'], 'readwrite')
      const store = transaction.objectStore('questions')
      const index = store.index('quizId')
      const request = index.getAll(quizId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const questions = request.result || []
        let completed = 0
        
        if (questions.length === 0) {
          resolve(0)
          return
        }
        
        questions.forEach(question => {
          const deleteRequest = store.delete(question.id)
          deleteRequest.onsuccess = () => {
            completed++
            if (completed === questions.length) {
              resolve(completed)
            }
          }
        })
      }
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to delete questions: ${error.message}`)
  }
}

// LEGACY COMPATIBILITY FUNCTIONS

// Legacy saveDeck function - converts old format to new hierarchy
async function saveDeck(deckData, deckName) {
  try {
    // Create a new deck
    const deckId = await createDeck(deckName)
    
    // Create a default quiz
    const quizName = `${deckName} - Default Quiz`
    const quizId = await createQuiz(deckId, quizName)
    
    // Add all questions to the quiz
    await addQuestions(quizId, deckId, deckData)
    
    return deckId
  } catch (error) {
    throw new Error(`Failed to save deck: ${error.message}`)
  }
}

// Get all saved decks
async function getAllDecks() {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readonly')
      const store = transaction.objectStore('decks')
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
      const transaction = db.transaction(['decks'], 'readonly')
      const store = transaction.objectStore('decks')
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
      const transaction = db.transaction(['decks'], 'readonly')
      const store = transaction.objectStore('decks')
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get deck by ID: ${error.message}`)
  }
}

// Get a quiz by ID
async function getQuizById(id) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quizzes'], 'readonly')
      const store = transaction.objectStore('quizzes')
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get quiz by ID: ${error.message}`)
  }
}

// Get a question by ID
async function getQuestionById(id) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['questions'], 'readonly')
      const store = transaction.objectStore('questions')
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get question by ID: ${error.message}`)
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

    const { nextReviewDate, interval, easeFactor } = calculateNextReview({
      interval: existing.interval,
      easeFactor: existing.easeFactor,
      quality: performanceQuality,
    })

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
async function getDueReviews(currentIsoDate = new Date().toISOString()) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readonly')
      const store = transaction.objectStore('reviewSchedule')
      const index = store.index('nextReviewDate')
      const request = index.getAll(IDBKeyRange.upperBound(currentIsoDate))

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

// Get recent review timestamps for matrix visualization
async function getRecentReviewTimestamps(days = 7) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readonly')
      const store = transaction.objectStore('reviewSchedule')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result || []
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        const cutoffIso = cutoff.toISOString()
        
        const timestamps = results
          .filter(r => r.lastReviewedDate && r.lastReviewedDate >= cutoffIso)
          .map(r => r.lastReviewedDate)
          
        resolve(timestamps)
      }
      
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get recent reviews: ${error.message}`)
  }
}

async function getReviewStatsByDeckId(deckId, currentIsoDate = new Date().toISOString()) {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readonly')
      const store = transaction.objectStore('reviewSchedule')
      const index = store.index('deckId')
      const request = index.getAll(deckId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const reviews = request.result || []
        const reviewed = reviews.filter((review) => review.lastReviewedDate)
        const due = reviews.filter((review) => review.nextReviewDate <= currentIsoDate)
        const easeSum = reviews.reduce(
          (sum, review) => sum + (Number(review.easeFactor) || 0),
          0,
        )
        const stableReviewed = reviewed.filter((review) => review.interval > 1)

        resolve({
          scheduledCount: reviews.length,
          reviewedCount: reviewed.length,
          dueCount: due.length,
          avgEaseFactor: reviews.length ? easeSum / reviews.length : null,
          retentionHealth: reviewed.length
            ? stableReviewed.length / reviewed.length
            : null,
        })
      }

      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    throw new Error(`Failed to get review stats: ${error.message}`)
  }
}

async function exportLibrarySnapshot() {
  const decks = await getAllDecks()
  const snapshot = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    decks: [],
  }

  for (const deck of decks) {
    const quizzes = await getQuizzesByDeckId(deck.id)
    const deckEntry = {
      name: deck.name,
      description: deck.description || '',
      date: deck.date,
      quizzes: [],
    }
    for (const quiz of quizzes) {
      const rawQuestions = await getQuestionsByQuizId(quiz.id)
      const questions = rawQuestions.map(({ id: _id, quizId: _qid, deckId: _did, order: _o, date: _dt, ...rest }) => rest)
      deckEntry.quizzes.push({
        name: quiz.name,
        description: quiz.description || '',
        date: quiz.date,
        questions,
      })
    }
    snapshot.decks.push(deckEntry)
  }
  return snapshot
}

async function importLibrarySnapshot(json, { mode = 'replace' } = {}) {
  const validatedSnap = validateLibrarySnapshot(json)
  if (!validatedSnap.ok) {
    throw new Error(validatedSnap.error)
  }

  if (mode === 'replace') {
    const existing = await getAllDecks()
    for (const d of existing) {
      await deleteDeck(d.id)
    }
    await clearLastUsedDeckId()
  }

  for (const deck of validatedSnap.value.decks) {
    const deckId = await createDeck(deck.name)
    if (deck.description) {
      try {
        await updateDeck(deckId, { description: deck.description })
      } catch {
        /* ignore optional deck meta */
      }
    }
    for (const quiz of deck.quizzes || []) {
      const quizId = await createQuiz(deckId, quiz.name)
      const qlist = quiz.questions || []
      if (qlist.length === 0) {
        continue
      }
      const v = validateQuizQuestions(qlist)
      if (!v.ok) {
        throw new Error(`Quiz "${quiz.name}": ${v.error}`)
      }
      if (v.value.length > 0) {
        await addQuestions(quizId, deckId, v.value)
      }
    }
  }
}

export {
  // Connection management
  initDB,
  
  // Deck management
  createDeck,
  updateDeck,
  getAllDecks,
  getDeckByName,
  getDeckById,
  deleteDeck,
  
  // Quiz management
  createQuiz,
  updateQuiz,
  getQuizById,
  getQuizzesByDeckId,
  deleteQuiz,
  
  // Question management
  addQuestions,
  getQuestionsByQuizId,
  getQuestionsCountByQuizId,
  updateQuestion,
  getQuestionById,
  deleteQuestion,
  deleteQuestionsByQuizId,
  
  // Legacy compatibility
  saveDeck,
  
  // Storage management
  saveLastUsedDeckId,
  getLastUsedDeckId,
  clearLastUsedDeckId,
  
  // Review schedule
  saveReviewSchedule,
  getReviewSchedule,
  updateReviewSchedule,
  getDueReviews,
  deleteReviewSchedule,
  getRecentReviewTimestamps,
  getReviewStatsByDeckId,

  exportLibrarySnapshot,
  importLibrarySnapshot,
}

// Session Connection Utilities
export async function closeDB() {
  if (dbOpenPromise) {
    const db = await dbOpenPromise;
    db.close();
    dbOpenPromise = null;
  }
}

export function resetDBPromise() {
  dbOpenPromise = null;
}
