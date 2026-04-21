import express from 'express';
import multer from 'multer';
import path from 'path';
import { getMyDocuments, uploadDocument, signDocument, deleteDocument } from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Files are saved to 'uploads' directory
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

router.route('/')
  .get(protect, getMyDocuments);

router.post('/upload', protect, upload.single('file'), uploadDocument);

router.post('/:id/sign', protect, signDocument);
router.delete('/:id', protect, deleteDocument);

export default router;
