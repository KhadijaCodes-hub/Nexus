import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g. 'PDF'
  size: { type: String, required: true }, // e.g. '2.4 MB'
  fileUrl: { type: String, required: true }, // URL path or file string
  shared: { type: Boolean, default: false },
  signatureData: { type: String, default: null }, // Base64 string of signature image
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Document = mongoose.model('Document', documentSchema);
export default Document;
