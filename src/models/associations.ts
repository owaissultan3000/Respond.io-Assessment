import User from './User.js';
import Note from './Note.js';
import NoteVersion from './NoteVersion.js';
import NoteShare from './NoteShare.js';
import NoteMedia from './NoteMedia.js';

// User <-> Note
User.hasMany(Note, {
  foreignKey: 'userId',
  as: 'notes',
});

Note.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Note <-> NoteVersion
Note.hasMany(NoteVersion, {
  foreignKey: 'noteId',
  as: 'versions',
});

NoteVersion.belongsTo(Note, {
  foreignKey: 'noteId',
  as: 'note',
});

// Note <-> NoteShare
Note.hasMany(NoteShare, {
  foreignKey: 'noteId',
  as: 'sharedWith',
});

NoteShare.belongsTo(Note, {
  foreignKey: 'noteId',
  as: 'note',
});

// User <-> NoteShare
User.hasMany(NoteShare, {
  foreignKey: 'userId',
  as: 'sharedNotes',
});

NoteShare.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Note.hasMany(NoteMedia, {
  foreignKey: 'noteId',
  as: 'media',
});

NoteMedia.belongsTo(Note, {
  foreignKey: 'noteId',
});


export default {
  User,
  Note,
  NoteVersion,
  NoteShare,
  NoteMedia
};