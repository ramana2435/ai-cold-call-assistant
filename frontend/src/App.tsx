import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CallForm from './components/CallForm';
import CallWorkspace from './components/CallWorkspace';
import ProductProfiles from './components/ProductProfiles';
import ProductProfileForm from './components/ProductProfileForm';
import OrganizationProfiles from './components/OrganizationProfiles';
import OrganizationProfileForm from './components/OrganizationProfileForm';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calls/new" element={<CallForm />} />
          <Route path="/calls/:id" element={<CallWorkspace />} />
          <Route path="/products" element={<ProductProfiles />} />
          <Route path="/products/new" element={<ProductProfileForm />} />
          <Route path="/products/:id/edit" element={<ProductProfileForm />} />
          <Route path="/organizations" element={<OrganizationProfiles />} />
          <Route path="/organizations/new" element={<OrganizationProfileForm />} />
          <Route path="/organizations/:id/edit" element={<OrganizationProfileForm />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
