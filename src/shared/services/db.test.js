import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initDB,
  createDeck,
  getAllDecks,
  createQuiz,
  getQuizzesByDeckId,
  addQuestions,
  getQuestionsByQuizId,
  getDueReviews,
  saveReviewSchedule,
  getReviewSchedule,
  deleteQuiz,
  deleteDeck,
  closeDB
} from './indexedDB.js';

describe('IndexedDB CRUD Services (indexedDB.js)', () => {
  beforeEach(async () => {
    // Close any active database connection first
    await closeDB();
    
    // Completely delete the database to start clean before each test
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('PromptQuizDB');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  afterEach(async () => {
    // Ensure database is closed after each test
    await closeDB();
  });

  it('should initialize correctly and establish all four stores', async () => {
    const db = await initDB();
    expect(db.name).toBe('PromptQuizDB');
    expect(db.version).toBe(2);
    expect(db.objectStoreNames.contains('decks')).toBe(true);
    expect(db.objectStoreNames.contains('quizzes')).toBe(true);
    expect(db.objectStoreNames.contains('questions')).toBe(true);
    expect(db.objectStoreNames.contains('reviewSchedule')).toBe(true);
  });

  it('should save a deck and allow retrieving it', async () => {
    const deckId = await createDeck('Computer Science', 'Topics related to CS');
    expect(deckId).toBeTypeOf('number');

    const decks = await getAllDecks();
    expect(decks.length).toBe(1);
    expect(decks[0].name).toBe('Computer Science');
    expect(decks[0].description).toBe('Topics related to CS');
    expect(decks[0].id).toBe(deckId);
    expect(decks[0].date).toBeDefined();
  });

  it('should save a quiz inside a deck and retrieve it using deckId index', async () => {
    const deckId = await createDeck('Math', 'Math courses');
    const quizId = await createQuiz(deckId, 'Calculus 101', 'Introductory Calculus');
    expect(quizId).toBeTypeOf('number');

    const quizzes = await getQuizzesByDeckId(deckId);
    expect(quizzes.length).toBe(1);
    expect(quizzes[0].name).toBe('Calculus 101');
    expect(quizzes[0].deckId).toBe(deckId);
  });

  it('should execute batch insertion of questions and sort them by order', async () => {
    const deckId = await createDeck('Languages', 'Language learning');
    const quizId = await createQuiz(deckId, 'Spanish Vocab', 'Basic Vocab');

    const questions = [
      { type: 'multiple-choice', question: 'How to say Hello?' },
      { type: 'true-false', question: 'Adios means Goodbye.' },
    ];

    const questionIds = await addQuestions(quizId, deckId, questions);
    expect(questionIds.length).toBe(2);

    const savedQuestions = await getQuestionsByQuizId(quizId);
    expect(savedQuestions.length).toBe(2);
    expect(savedQuestions[0].order).toBe(0);
    expect(savedQuestions[1].order).toBe(1);
    expect(savedQuestions[0].question).toBe('How to say Hello?');
    expect(savedQuestions[0].quizId).toBe(quizId);
    expect(savedQuestions[0].deckId).toBe(deckId);
  });

  it('should query due questions correctly based on nextReviewDate', async () => {
    const db = await initDB();
    
    // Manually write reviewSchedule entries to test query
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['reviewSchedule'], 'readwrite');
      const store = transaction.objectStore('reviewSchedule');
      
      store.add({ questionId: 1, deckId: 1, nextReviewDate: '2026-05-20T12:00:00Z', easeFactor: 2.5, interval: 1 });
      store.add({ questionId: 2, deckId: 1, nextReviewDate: '2026-05-26T12:00:00Z', easeFactor: 2.5, interval: 1 }); // Future
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    const dueList = await getDueReviews('2026-05-25T00:00:00Z');
    expect(dueList.length).toBe(1);
    expect(dueList[0].questionId).toBe(1);
  });

  it('should delete review schedules when a quiz is deleted', async () => {
    const deckId = await createDeck('Biology', 'Life sciences');
    const quizId = await createQuiz(deckId, 'Cell Biology', 'Cells');

    const questionIds = await addQuestions(quizId, deckId, [
      { type: 'true-false', question: 'Mitochondria is the powerhouse of the cell.', answer: true },
      { type: 'true-false', question: 'Plant cells have cell walls.', answer: true },
    ]);

    await saveReviewSchedule(questionIds[0], deckId);
    await saveReviewSchedule(questionIds[1], deckId);

    expect(await getReviewSchedule(questionIds[0])).not.toBeNull();
    expect(await getReviewSchedule(questionIds[1])).not.toBeNull();

    await deleteQuiz(quizId);

    expect(await getQuestionsByQuizId(quizId)).toHaveLength(0);
    expect(await getReviewSchedule(questionIds[0])).toBeNull();
    expect(await getReviewSchedule(questionIds[1])).toBeNull();
  });

  it('should cascade review schedule deletion when a deck is deleted', async () => {
    const deckId = await createDeck('History', 'World history');
    const quizId = await createQuiz(deckId, 'Ancient Rome', 'Roman empire');

    const questionIds = await addQuestions(quizId, deckId, [
      { type: 'true-false', question: 'Julius Caesar was a Roman dictator.', answer: true },
    ]);

    await saveReviewSchedule(questionIds[0], deckId);
    expect(await getReviewSchedule(questionIds[0])).not.toBeNull();

    await deleteDeck(deckId);

    expect(await getAllDecks()).toHaveLength(0);
    expect(await getQuizzesByDeckId(deckId)).toHaveLength(0);
    expect(await getReviewSchedule(questionIds[0])).toBeNull();
  });
});
