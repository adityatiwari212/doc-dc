const Document = require('../models/Document');
const { v4: uuidv4 } = require('uuid');

exports.getAllDocuments = async (req, res) => {
  const docs = await Document.find();
  res.json(docs);
};

exports.getDocumentById = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.json(doc);
};

exports.createDocument = async (req, res) => {
  const { title } = req.body;
  const newDoc = new Document({
    title,
    paragraphs: [{ id: uuidv4(), content: "Initial paragraph." }]
  });
  await newDoc.save();
  res.status(201).json(newDoc);
};

exports.addParagraph = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const paragraph = { id: uuidv4(), content };
  const doc = await Document.findById(id);
  doc.paragraphs.push(paragraph);
  await doc.save();
  res.status(200).json(paragraph);
};
