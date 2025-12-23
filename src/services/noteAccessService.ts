import { Note, NoteShare } from "../models/index.js";

/**
 * Fetch a note and determine the user's access level.
 * 
 * @param noteId - ID of the note to fetch
 * @param userId - ID of the requesting user
 * @returns Object containing the note and permission, or null if no access
 */
export const getNoteWithAccess = async (noteId: number, userId: number) => {
  try {
    // First, check if the user owns this note
    const ownedNote = await Note.findOne({
      where: { id: noteId, userId },
    });

    if (ownedNote) {
      return { note: ownedNote, permission: 'OWNER' };
    }

    // Next, check if the note has been shared with the user
    const sharedAccess = await NoteShare.findOne({
      where: { noteId, userId },
      include: [{ model: Note, as: 'note' }],
    });

    if (!sharedAccess) {
      // User has no access to this note
      return null;
    }

    // Return the shared note and the granted permission
    return {
      note: sharedAccess.note,
      permission: sharedAccess.permission,
    };
  } catch (err: any) {
    console.error(`[Notes][Access] Error fetching note ${noteId} for user ${userId}:`, err);
    return null; // Fail silently; calling code can handle null as "no access"
  }
};
