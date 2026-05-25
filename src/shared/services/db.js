const DB_NAME = 'PromptQuizDB';
const DB_VERSION = 2;

let dbPromise = null;

/**
 * Initializes the IndexedDB database.
 * Creates stores and indexes if version changes.
 * @returns {Promise<IDBDatabase>}
 */
export function initDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // 1. decks store
      if (!db.objectStoreNames.contains('decks')) {
        const deckStore = db.createObjectStore('decks', { keyPath: 'id', autoIncrement: true });
        deckStore.createIndex('name', 'name', { unique: false });
        deckStore.createIndex('date', 'date', { unique: false });
      }

      // 2. quizzes store
      if (!db.objectStoreNames.contains('quizzes')) {
        const quizStore = db.createObjectStore('quizzes', { keyPath: 'id', autoIncrement: true });
        quizStore.createIndex('name', 'name', { unique: false });
        quizStore.createIndex('deckId', 'deckId', { unique: false });
        quizStore.createIndex('date', 'date', { unique: false });
      }

      // 3. questions store
      if (!db.objectStoreNames.contains('questions')) {
        const questionStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
        questionStore.createIndex('quizId', 'quizId', { unique: false });
        questionStore.createIndex('deckId', 'deckId', { unique: false });
        questionStore.createIndex('order', 'order', { unique: false });
      }

      // 4. reviewSchedule store
      if (!db.objectStoreNames.contains('reviewSchedule')) {
        const reviewStore = db.createObjectStore('reviewSchedule', { keyPath: 'id', autoIncrement: true });
        reviewStore.createIndex('questionId', 'questionId', { unique: true });
        reviewStore.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
        reviewStore.createIndex('deckId', 'deckId', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Reset helper for testing/debugging purposes.
 */
export function resetDBPromise() {
  dbPromise = null;
}

/**
 * Closes the active IndexedDB connection.
 * @returns {Promise<void>}
 */
export async function closeDB() {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

/**
 * Saves a new deck to the database.
 * @param {string} name 
 * @param {string} description 
 * @returns {Promise<number>} Generated ID
 */
export async function saveDeck(name, description = '') {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['decks'], 'readwrite');
    const store = transaction.objectStore('decks');
    const deck = {
      name,
      description,
      date: new Date().toISOString()
    };
    const request = store.add(deck);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
  });
}

/**
 * Gets all decks from database.
 * @returns {Promise<Array>}
 */
export async function getDecks() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['decks'], 'readonly');
    const store = transaction.objectStore('decks');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a new quiz inside a deck.
 * @param {number} deckId 
 * @param {string} name 
 * @param {string} description 
 * @returns {Promise<number>} Generated ID
 */
export async function saveQuiz(deckId, name, description = '') {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['quizzes'], 'readwrite');
    const store = transaction.objectStore('quizzes');
    const quiz = {
      deckId: Number(deckId),
      name,
      description,
      date: new Date().toISOString()
    };
    const request = store.add(quiz);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
  });
}

/**
 * Queries quizzes store using deckId index.
 * @param {number} deckId 
 * @returns {Promise<Array>}
 */
export async function getQuizzesByDeck(deckId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['quizzes'], 'readonly');
    const store = transaction.objectStore('quizzes');
    const index = store.index('deckId');
    const request = index.getAll(Number(deckId));

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves multiple questions in a single batch transaction.
 * @param {number} quizId 
 * @param {number} deckId 
 * @param {Array} questionsArray 
 * @returns {Promise<Array<number>>} Generated question IDs
 */
export async function saveQuestions(quizId, deckId, questionsArray) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['questions'], 'readwrite');
    const store = transaction.objectStore('questions');
    const ids = [];

    let completed = 0;
    if (questionsArray.length === 0) {
      resolve([]);
      return;
    }

    questionsArray.forEach((q, idx) => {
      const question = {
        ...q,
        quizId: Number(quizId),
        deckId: Number(deckId),
        order: idx,
        date: new Date().toISOString()
      };
      const request = store.add(question);

      request.onsuccess = () => {
        ids.push(request.result);
        completed++;
        if (completed === questionsArray.length) {
          resolve(ids);
        }
      };

      request.onerror = () => {
        transaction.abort();
        reject(request.error);
      };
    });

    transaction.onabort = () => reject(transaction.error || new Error('Batch transaction aborted'));
  });
}

/**
 * Fetches all questions belonging to a specific quiz, sorted by order index.
 * @param {number} quizId 
 * @returns {Promise<Array>}
 */
export async function getQuestionsByQuiz(quizId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['questions'], 'readonly');
    const store = transaction.objectStore('questions');
    const index = store.index('quizId');
    const request = index.getAll(Number(quizId));

    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => a.order - b.order);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queries reviewSchedule store where nextReviewDate <= currentIsoDate.
 * @param {string} currentIsoDate 
 * @returns {Promise<Array>}
 */
export async function getDueQuestions(currentIsoDate) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reviewSchedule'], 'readonly');
    const store = transaction.objectStore('reviewSchedule');
    const index = store.index('nextReviewDate');
    const range = IDBKeyRange.upperBound(currentIsoDate);
    const request = index.getAll(range);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
