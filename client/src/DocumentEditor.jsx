import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from './socket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';


export default function DocumentEditor() {
  const { docId } = useParams();
  const [paragraphs, setParagraphs] = useState([]);
  const [locks, setLocks] = useState({});
  const [editing, setEditing] = useState({});
  const [localEdits, setLocalEdits] = useState({});

  useEffect(() => {
    socket.emit('join_document', docId);

    socket.on('document_state', (data) => {
      const list = Object.entries(data.paragraphs).map(([id, p]) => ({
        id,
        content: p.content
      }));
      setParagraphs(list);

      const lockState = {};
      for (const id in data.paragraphs) {
        lockState[id] = data.paragraphs[id].lockedBy;
      }
      setLocks(lockState);
    });

    socket.on('paragraph_locked', ({ paragraphId, socketId }) => {
      setLocks(prev => ({ ...prev, [paragraphId]: socketId }));
    });

    socket.on('paragraph_unlocked', ({ paragraphId }) => {
      setLocks(prev => ({ ...prev, [paragraphId]: null }));
    });

    socket.on('paragraph_updated', ({ paragraphId, content }) => {
      setParagraphs(prev =>
        prev.map(p => (p.id === paragraphId ? { ...p, content } : p))
      );
    });

    socket.on('paragraph_added', ({ paragraph }) => {
      setParagraphs(prev => [...prev, paragraph]);
      setLocks(prev => ({ ...prev, [paragraph.id]: null }));
    });

    return () => {
      socket.off('document_state');
      socket.off('paragraph_locked');
      socket.off('paragraph_unlocked');
      socket.off('paragraph_updated');
      socket.off('paragraph_added');
    };
  }, [docId]);

  const handleLock = (paraId) => {
    socket.emit('lock_paragraph', { docId, paragraphId: paraId });
    setEditing(prev => ({ ...prev, [paraId]: true }));
    const para = paragraphs.find(p => p.id === paraId);
    if (para) {
      setLocalEdits(prev => ({ ...prev, [paraId]: para.content }));
    }
  };

  const handleEdit = (paraId, value) => {
    setLocalEdits(prev => ({ ...prev, [paraId]: value }));
    socket.emit('edit_paragraph', { docId, paragraphId: paraId, content: value });
  };

  const handleSave = (paraId) => {
    const updatedContent = localEdits[paraId];

    // 1. Save to backend
    socket.emit('save_paragraph', { docId, paragraphId: paraId });

    // 2. Release the lock
    socket.emit('release_paragraph', { docId, paragraphId: paraId });

    // 3. Update local display
    setParagraphs(prev =>
      prev.map(p => (p.id === paraId ? { ...p, content: updatedContent } : p))
    );

    // 4. Exit editing mode
    setEditing(prev => ({ ...prev, [paraId]: false }));
  };

  const handleAddParagraph = () => {
    socket.emit('add_paragraph', { docId });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Editing Document: {docId}</h2>
      <button onClick={handleAddParagraph}>Add Paragraph</button>

      {paragraphs.map(p => (
        <div key={p.id} style={{ margin: '20px 0', border: '1px solid #ccc', padding: '10px' }}>
          {editing[p.id] ? (
            <>
              <MdEditor
  value={localEdits[p.id] || ''}
  style={{ height: '300px' }}
  renderHTML={text => (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
  )}
  onChange={({ text }) => handleEdit(p.id, text)}
/>

              <button onClick={() => handleSave(p.id)} style={{ marginTop: '10px' }}>
                Save & Unlock
              </button>
            </>
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
  {p.content}
</ReactMarkdown>

              {locks[p.id] === null || locks[p.id] === socket.id ? (
                <button onClick={() => handleLock(p.id)}>Edit</button>
              ) : (
                <p style={{ color: 'red' }}>Locked by another user</p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
