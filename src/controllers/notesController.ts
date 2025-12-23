import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { Note, NoteShare } from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';
import database from '../config/database.js';
import versionService from '../services/versionService.js';
import cacheService from '../services/cacheService.js';
import { getNoteWithAccess } from '../services/noteAccessService.js';
import { sendError, sendSuccess } from '../utils/helper.js';
import { MAX_MEDIA_SIZE } from '../middlewares/mediaUpload.js';
import NoteMedia from '../models/NoteMedia.js';

// ==================== CREATE NOTE ====================
export const createNote = async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await database.sequelize.transaction();

    try {
        const { title, content } = req.body;
        const file = req.file;
        const userId = req.user?.id;

        if (!userId) return sendError(res, 401, 'You must be logged in to create a note.');
        if (!title || !content) return sendError(res, 400, 'Title and content cannot be empty.');

        // Media validation
        if (file) {
            if (file.size > MAX_MEDIA_SIZE) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Media file must be 5MB or smaller',
                });
            }
        }

        const newNote = await Note.create({
            title: title.trim(),
            content: content.trim(),
            userId,
            version: 1,
        }, { transaction });

        // Create initial version snapshot
        await versionService.createVersion(
            newNote.id,
            newNote.title,
            newNote.content,
            1,
            userId,
            transaction
        );

        if (file) {
            await NoteMedia.create(
                {
                    noteId: newNote.id,
                    filename: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    data: file.buffer,
                },
                { transaction }
            );
        }

        await transaction.commit();

        // Clear user's notes cache
        await cacheService.invalidateUserNotes(userId);

        return sendSuccess(res, 201, 'Your note has been created successfully.', newNote);

    } catch (err: any) {
        await transaction.rollback();
        console.error('[Notes][Create] Error:', err);
        return sendError(res, 500, 'Failed to create note.');
    }
};

// ==================== GET ALL NOTES ====================
export const getAllNotes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, 'Authentication required.');

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Note.findAndCountAll({
            where: { userId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return sendSuccess(res, 200, 'Notes retrieved successfully.', {
            notes: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (err: any) {
        console.error('[Notes][GetAll] Error:', err);
        return sendError(res, 500, 'Failed to retrieve notes.');
    }
};

// ==================== GET SINGLE NOTE ====================
export const getNoteById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, 'Authentication required.');

        const access = await getNoteWithAccess(Number(id), userId);
        if (!access) return sendError(res, 404, 'Note not found or access denied.');

        const noteWithMedia = await Note.findByPk(Number(id), {
            include: [
                {
                    model: NoteMedia,
                    as: 'media',
                    attributes: ['id', 'filename', 'mimeType', 'size', 'createdAt'],
                },
            ],
        });

        if (!noteWithMedia) {
            return sendError(res, 404, 'Note not found.');
        }

        return sendSuccess(res, 200, 'Note retrieved successfully.', {
            ...noteWithMedia.toJSON(),
            permission: access.permission,
        });
    } catch (err: any) {
        console.error('[Notes][GetById] Error:', err);
        return sendError(res, 500, 'Failed to retrieve note.');
    }
};

// ==================== UPDATE NOTE ====================
export const updateNote = async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await database.sequelize.transaction();

    try {
        const { id } = req.params;
        const { title, content, version } = req.body;
        const userId = req.user?.id;
        const file = req.file;

        if (!userId) return sendError(res, 401, 'Authentication required.');
        if (!title && !content) return sendError(res, 400, 'Title or content must be provided.');
        if (version === undefined || version === null) return sendError(res, 400, 'Version number is required.');

        const access = await getNoteWithAccess(Number(id), userId);
        if (!access) return sendError(res, 404, 'Note not found or access denied.');
        if (access.permission === 'READ') return sendError(res, 403, 'You have read-only access to this note.');
        if (file && file.size > MAX_MEDIA_SIZE) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Media file must be 5MB or smaller',
            });
        }

        const note = await Note.findOne({
            where: { id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!note) return sendError(res, 404, 'Note not found.');

        if (note.version !== version) return res.status(409).json({
            success: false,
            message: 'Conflict: Note has been updated by another user.',
            currentVersion: note.version,
            providedVersion: version,
        });

        let updated = false;

        if (title && title.trim() !== note.title) {
            note.title = title.trim();
            updated = true;
        }

        if (content && content.trim() !== note.content) {
            note.content = content.trim();
            updated = true;
        }

        if (!updated) {
            await transaction.rollback();
            return sendSuccess(res, 200, 'No changes detected.', note);
        }

        note.version += 1;
        await note.save({ transaction });

        await versionService.createVersion(
            note.id,
            note.title,
            note.content,
            note.version,
            userId,
            transaction
        );

        if (file) {
            await NoteMedia.create(
                {
                    noteId: note.id,
                    filename: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    data: file.buffer,
                },
                { transaction }
            );
        }

        await transaction.commit();

        // Clear relevant caches
        await cacheService.invalidateNote(Number(id));
        await cacheService.invalidateUserNotes(userId);

        return sendSuccess(res, 200, 'Note updated successfully.', note);

    } catch (err: any) {
        await transaction.rollback();
        console.error('[Notes][Update] Error:', err);
        return sendError(res, 500, 'Failed to update note.');
    }
};

// ==================== DELETE NOTE ====================
export const deleteNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, 'Authentication required.');

        const note = await Note.findOne({ where: { id, userId } });
        if (!note) return sendError(res, 404, 'Note not found.');

        await note.destroy(); // Soft delete

        await cacheService.invalidateNote(Number(id));
        await cacheService.invalidateUserNotes(userId);

        return sendSuccess(res, 200, 'Note deleted successfully.');
    } catch (err: any) {
        console.error('[Notes][Delete] Error:', err);
        return sendError(res, 500, 'Failed to delete note.');
    }
};

// ==================== SEARCH NOTES ====================
export const searchNotes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const keyword = req.query.keyword as string;
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, 'Authentication required.');
        if (!keyword || keyword.length < 2) return sendError(res, 400, 'Keyword must be at least 2 characters.');

        // Full-text search
        const query = `
          SELECT * FROM notes
          WHERE user_id = :userId
            AND deleted_at IS NULL
            AND MATCH(title, content) AGAINST(:keyword IN NATURAL LANGUAGE MODE)
          ORDER BY MATCH(title, content) AGAINST(:keyword IN NATURAL LANGUAGE MODE) DESC
        `;

        const results = await database.sequelize.query(query, {
            replacements: { userId, keyword },
            type: QueryTypes.SELECT,
        });

        return sendSuccess(res, 200, 'Search completed.', {
            keyword,
            count: results.length,
            notes: results,
        });

    } catch (err: any) {
        console.error('[Notes][Search] Error:', err);

        // Fallback LIKE search
        try {
            const notes = await Note.findAll({
                where: {
                    userId: req.user?.id,
                    [Op.or]: [
                        { title: { [Op.like]: `%${req.query.keyword}%` } },
                        { content: { [Op.like]: `%${req.query.keyword}%` } },
                    ],
                },
                order: [['createdAt', 'DESC']],
            });

            return sendSuccess(res, 200, 'Search completed (fallback mode).', {
                keyword: req.query.keyword,
                count: notes.length,
                notes,
            });
        } catch (fallbackErr: any) {
            return sendError(res, 500, 'Failed to search notes.');
        }
    }
};

// ==================== NOTE VERSIONS ====================
export const getNoteVersions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, 'Authentication required.');

        const access = await getNoteWithAccess(Number(id), userId);
        if (!access) return sendError(res, 404, 'Note not found or access denied.');

        const versions = await versionService.getNoteVersions(Number(id), userId);

        return sendSuccess(res, 200, 'Versions retrieved successfully.', {
            noteId: id,
            count: versions.length,
            versions,
        });
    } catch (err: any) {
        console.error('[Notes][Versions] Error:', err);
        return sendError(res, 500, 'Failed to retrieve versions.');
    }
};

// ==================== REVERT NOTE VERSION ====================
export const revertToVersion = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { noteId: id, revertVersion: versionNumber } = req.body;
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, 'Authentication required.');

        const note = await versionService.revertToVersion(Number(id), Number(versionNumber), userId);

        await cacheService.invalidateNote(Number(id));
        await cacheService.invalidateUserNotes(userId);

        return sendSuccess(res, 200, `Note reverted to version ${versionNumber}.`, note);
    } catch (err: any) {
        console.error('[Notes][Revert] Error:', err);
        if (err.message.includes('not found') || err.message.includes('access denied')) {
            return sendError(res, 404, err.message);
        }
        return sendError(res, 500, 'Failed to revert note.');
    }
};

// ==================== SHARE NOTE ====================
export const shareNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { noteId, userId: targetUserId, permission } = req.body;
        const ownerId = req.user?.id;

        if (!ownerId) return sendError(res, 401, 'Authentication required.');
        if (!['READ', 'EDIT'].includes(permission)) return sendError(res, 400, 'Invalid permission.');

        const note = await Note.findOne({ where: { id: noteId, userId: ownerId } });
        if (!note) return sendError(res, 403, 'Only the owner can share this note.');

        await NoteShare.upsert({ noteId, userId: targetUserId, permission });

        return sendSuccess(res, 200, 'Note shared successfully.');
    } catch (err: any) {
        console.error('[Notes][Share] Error:', err);
        return sendError(res, 500, 'Failed to share note.');
    }
};