import multer from 'multer';

export const MAX_MEDIA_SIZE = 5 * 1024 * 1024; // 5MB

export const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_MEDIA_SIZE,
  },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Only image and video files are allowed'));
    }
    cb(null, true);
  },
});
