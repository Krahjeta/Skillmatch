import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import MyApplications from './pages/MyApplications';
import NewJob from './pages/NewJob';
import CareerAdvisor from './pages/CareerAdvisor';
import Recommendations from './pages/Recommendations';
import SavedJobs from './pages/SavedJobs';
import EditJob from './pages/EditJob';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
          <Route
            path="/applications"
            element={<ProtectedRoute><MyApplications /></ProtectedRoute>}
          />
          <Route
            path="/advisor"
            element={<ProtectedRoute><CareerAdvisor /></ProtectedRoute>}
          />
          <Route
            path="/recommendations"
            element={<ProtectedRoute><Recommendations /></ProtectedRoute>}
          />
          <Route
  path="/admin/jobs/:id/edit"
  element={<ProtectedRoute adminOnly><EditJob /></ProtectedRoute>}
/>
          <Route
            path="/admin/jobs/new"
            element={<ProtectedRoute adminOnly><NewJob /></ProtectedRoute>}
          />
          <Route path="/saved-jobs" element={<SavedJobs />} />
          
        </Routes>
      </main>
    </>
  );
}
