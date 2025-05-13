const mongoose = require('mongoose');

const ParagraphSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  id: { type: String, required: true } // also ensure paragraph ID is tracked
});

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  paragraphs: [ParagraphSchema]
});

module.exports = mongoose.model('Document', DocumentSchema);
