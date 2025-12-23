import express from 'express';
import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  searchNotes,
  getNoteVersions,
  revertToVersion,
  shareNote,
} from '../controllers/notesController.js';
import { authenticate } from '../middlewares/auth.js';
import { 
  cacheMiddleware, 
  noteCacheKey, 
  userNotesCacheKey, 
  searchCacheKey,
  noteVersionsCacheKey 
} from '../middlewares/cache.js';
import { mediaUpload } from '../middlewares/mediaUpload.js';

const router = express.Router();

router.use(authenticate);

// Create and delete don't use cache
router.post('/', mediaUpload.single('media'), createNote);
router.delete('/:id', deleteNote);

// These routes use caching
router.get('/', cacheMiddleware(userNotesCacheKey, 300), getAllNotes); // 5 min cache
router.get('/search', cacheMiddleware(searchCacheKey, 600), searchNotes); // 10 min cache
router.get('/:id', cacheMiddleware(noteCacheKey, 600), getNoteById); // 10 min cache
router.get('/:id/versions', cacheMiddleware(noteVersionsCacheKey, 1800), getNoteVersions); // 30 min cache

// Update and revert invalidate cache automatically
router.put('/:id', mediaUpload.single('media'), updateNote);
router.post('/revert', revertToVersion);

// share note with others
router.post('/share', shareNote);

export default router;