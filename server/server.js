const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const documentRoutes = require('./routes/documentRoutes');
const Document = require('./models/Document');

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/api/docs', documentRoutes);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const documentStates = {}; // { [docId]: { paragraphs: { [paraId]: { content, lockedBy } } } }

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_document', async (docId) => {
    socket.join(docId);

    if (!documentStates[docId]) {
      const doc = await Document.findById(docId);
      if (!doc) return;
      documentStates[docId] = { paragraphs: {} };
      doc.paragraphs.forEach((p, i) => {
        const paraId = p.id || `p${i}`;
        documentStates[docId].paragraphs[paraId] = {
          content: p.content,
          lockedBy: null
        };
      });
    }

    socket.emit('document_state', documentStates[docId]);
  });

  socket.on('lock_paragraph', ({ docId, paragraphId }) => {
    const para = documentStates[docId]?.paragraphs[paragraphId];
    if (!para) return;

    if (para.lockedBy === null) {
      para.lockedBy = socket.id;
      io.to(docId).emit('paragraph_locked', { paragraphId, socketId: socket.id });
    } else {
      socket.emit('lock_failed', { paragraphId });
    }
  });

  socket.on('edit_paragraph', ({ docId, paragraphId, content }) => {
    const para = documentStates[docId]?.paragraphs[paragraphId];
    if (!para || para.lockedBy !== socket.id) return;

    para.content = content;
    socket.to(docId).emit('paragraph_updated', { paragraphId, content });
  });

  socket.on('save_paragraph', async ({ docId, paragraphId }) => {
    const para = documentStates[docId]?.paragraphs[paragraphId];
    if (!para || para.lockedBy !== socket.id) return;

    await Document.updateOne(
      { _id: docId, 'paragraphs.id': paragraphId },
      { $set: { 'paragraphs.$.content': para.content } }
    );
    io.to(docId).emit('paragraph_saved', { paragraphId });
  });

  socket.on('release_paragraph', ({ docId, paragraphId }) => {
    const para = documentStates[docId]?.paragraphs[paragraphId];
    if (!para || para.lockedBy !== socket.id) return;

    para.lockedBy = null;
    io.to(docId).emit('paragraph_unlocked', { paragraphId });
  });

  socket.on('add_paragraph', async ({ docId }) => {
    const newParagraph = {
      id: uuidv4(),
      content: ''
    };

    await Document.updateOne(
      { _id: docId },
      { $push: { paragraphs: newParagraph } }
    );

    if (!documentStates[docId]) return;

    documentStates[docId].paragraphs[newParagraph.id] = {
      content: '',
      lockedBy: null
    };

    io.to(docId).emit('paragraph_added', {
      paragraph: { id: newParagraph.id, content: '' }
    });
  });

  socket.on('disconnect', () => {
    for (const docId in documentStates) {
      for (const paraId in documentStates[docId].paragraphs) {
        const para = documentStates[docId].paragraphs[paraId];
        if (para.lockedBy === socket.id) {
          para.lockedBy = null;
          io.to(docId).emit('paragraph_unlocked', { paragraphId: paraId });
        }
      }
    }
  });
});

mongoose.connect('mongodb://localhost:27017/docs', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
