import { Transaction } from 'sequelize';
import database from '../config/database.js';
import { Note, NoteVersion } from '../models/index.js';

class VersionService {
  /**
   * Create a snapshot of a note at a specific version.
   * Used on create, update, and revert.
   */
  async createVersion(
    noteId: number,
    title: string,
    content: string,
    versionNumber: number,
    userId: number,
    transaction?: Transaction
  ): Promise<NoteVersion> {
    return NoteVersion.create(
      {
        noteId,
        title,
        content,
        versionNumber,
        createdBy: userId,
      },
      { transaction }
    );
  }

  /**
   * Get all versions of a note (latest first).
   * Ownership is enforced here.
   */
  async getNoteVersions(noteId: number, userId: number): Promise<NoteVersion[]> {
    const note = await Note.findOne({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new Error('Note not found or access denied');
    }

    return NoteVersion.findAll({
      where: { noteId },
      order: [['versionNumber', 'DESC']],
    });
  }

  /**
   * Fetch a specific version of a note.
   * Mainly useful for previewing before revert.
   */
  async getSpecificVersion(
    noteId: number,
    versionNumber: number,
    userId: number
  ): Promise<NoteVersion | null> {
    const note = await Note.findOne({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new Error('Note not found or access denied');
    }

    return NoteVersion.findOne({
      where: { noteId, versionNumber },
    });
  }

  /**
   * Revert a note to a previous version.
   * This operation:
   *  - updates the note
   *  - increments the version number
   *  - creates a new version snapshot
   */
  async revertToVersion(
    noteId: number,
    versionNumber: number,
    userId: number
  ): Promise<Note> {
    const transaction = await database.sequelize.transaction();

    try {
      const note = await Note.findOne({
        where: { id: noteId, userId },
        transaction,
      });

      if (!note) {
        throw new Error('Note not found or access denied');
      }

      const targetVersion = await NoteVersion.findOne({
        where: { noteId, versionNumber },
        transaction,
      });

      if (!targetVersion) {
        throw new Error('Version not found');
      }

      // Apply version content
      note.title = targetVersion.title;
      note.content = targetVersion.content;
      note.version += 1;

      await note.save({ transaction });

      // Store revert as a new version (audit trail)
      await this.createVersion(
        noteId,
        targetVersion.title,
        targetVersion.content,
        note.version,
        userId,
        transaction
      );

      await transaction.commit();
      return note;
    } catch (err) {
      await transaction.rollback();
      console.error(
        `[VersionService][Revert] Failed to revert note ${noteId} to version ${versionNumber}:`,
        err
      );
      throw err;
    }
  }
}

export default new VersionService();