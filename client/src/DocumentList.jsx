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
    axios
      .get('http://localhost:3000/api/docs')
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">📄 Available Documents</h2>

      <ul className="space-y-2 mb-8">
        {docs.map(doc => (
          <li key={doc._id}>
            <Link
              to={`/doc/${doc._id}`}
              className="text-blue-600 hover:underline hover:text-blue-800 transition"
            >
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-t pt-6">
        <h3 className="text-xl font-medium mb-3">Create New Document</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Document title"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}