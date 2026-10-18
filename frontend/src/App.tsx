import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CallForm from './components/CallForm';
import CallWorkspace from './components/CallWorkspace';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calls/new" element={<CallForm />} />
          <Route path="/calls/:id" element={<CallWorkspace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
