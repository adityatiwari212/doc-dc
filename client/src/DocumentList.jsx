import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function DocumentList() {
  const [docs, setDocs] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = () => {
    axios.get('http://localhost:3000/api/docs')
      .then(res => setDocs(res.data))
      .catch(err => console.error(err));
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await axios.post('http://localhost:3000/api/docs', { title: newTitle });
      navigate(`/doc/${res.data._id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Available Documents</h2>
      <ul>
        {docs.map(doc => (
          <li key={doc._id}>
            <Link to={`/doc/${doc._id}`}>{doc.title}</Link>
          </li>
        ))}
      </ul>

      <h3>Create New Document</h3>
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Document title"
      />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
