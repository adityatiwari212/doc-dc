import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DocumentList from './DocumentList';
import DocumentEditor from './DocumentEditor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DocumentList />} />
        <Route path="/doc/:docId" element={<DocumentEditor />} />
      </Routes>
    </BrowserRouter>
  );
}
