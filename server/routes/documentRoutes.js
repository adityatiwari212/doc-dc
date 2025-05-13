const express = require('express');
const router = express.Router();
const controller = require('../controller/documentController');

router.get('/', controller.getAllDocuments);
router.get('/:id', controller.getDocumentById);
router.post('/', controller.createDocument);
router.post('/:id/paragraph', controller.addParagraph);

module.exports = router;
