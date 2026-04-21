import Document from '../models/Document.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get user's documents
// @route   GET /api/documents
export const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload a document using Multer
// @route   POST /api/documents/upload
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, size, filename } = req.file;

    // Convert bytes to MB/KB string
    let sizeStr = size > 1024 * 1024 
      ? (size / (1024 * 1024)).toFixed(1) + ' MB' 
      : (size / 1024).toFixed(1) + ' KB';

    // Type inference
    const ext = path.extname(originalname).toLowerCase();
    let docType = 'Document';
    if (ext === '.pdf') docType = 'PDF';
    else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') docType = 'Spreadsheet';
    else if (ext === '.jpg' || ext === '.png' || ext === '.jpeg') docType = 'Image';

    const newDoc = await Document.create({
      ownerId: req.user._id,
      name: originalname,
      type: docType,
      size: sizeStr,
      fileUrl: `/uploads/${filename}`,
      shared: false
    });

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add e-signature to document
// @route   POST /api/documents/:id/sign
export const signDocument = async (req, res) => {
  try {
    const { signatureData } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    document.signatureData = signatureData;
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Attempt to safely delete file from disk
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.deleteOne({ _id: req.params.id });
    res.json({ message: 'Document removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
