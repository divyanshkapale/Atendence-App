import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import MyRecords from './pages/MyRecords';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CalendarPage from './pages/CalendarPage';

import { Camera, ClipboardList, Users, Shield, LogOut, Calendar as CalendarIcon, CreditCard } from 'lucide-react';
import IDCardApply from './pages/IDCardApply';
import AdminIDCardRequests from './pages/AdminIDCardRequests';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;

  return children;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('attendance');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setIsLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-base-200">
      <div className="navbar bg-primary text-primary-content shadow-lg mb-4 md:mb-8 flex-none">
        <div className="flex-1 gap-2 md:gap-4">
          <div className="avatar">
            <div className="w-10 md:w-14 rounded-lg bg-white/10 p-1">
              <img src="/logo.png" alt="Logo" onError={(e) => e.target.src = '/logo.svg'} />
            </div>
          </div>
          <div className="overflow-hidden">
            <h1 className="text-base md:text-2xl font-bold leading-tight truncate">Govt Pench Valley PG College</h1>
            <p className="text-xs md:text-sm opacity-80 truncate">Dept of Botany • E-Attendance</p>
          </div>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder btn-md md:btn-lg">
              <div className="bg-neutral-focus text-neutral-content rounded-full w-10 md:w-12">
                <span className="text-base md:text-2xl">{user.username[0].toUpperCase()}</span>
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 text-base-content">
              <li className="menu-title">
                <span className="text-sm">{user.username} ({user.role})</span>
              </li>
              <li><a onClick={handleLogout} className="text-sm"><LogOut size={18} /> Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto container mx-auto px-2 md:px-4 pb-8">
        <div className={`tabs tabs-boxed justify-center mb-6 bg-base-100 shadow-md p-1 md:p-2 overflow-x-auto flex-nowrap md:flex-wrap flex-none ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
          {user.role !== 'admin' && (
            <>
              <a
                className={`tab tab-md md:tab-lg flex-1 ${activeTab === 'attendance' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('attendance')}
              >
                <Camera size={20} className="mr-1 md:mr-2" /> <span className="text-sm md:text-lg">Attendance</span>
              </a>
              <a
                className={`tab tab-md md:tab-lg flex-1 ${activeTab === 'myRecords' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('myRecords')}
              >
                <ClipboardList size={20} className="mr-1 md:mr-2" /> <span className="text-sm md:text-lg">My Records</span>
              </a>
              <a
                className={`tab tab-md md:tab-lg flex-1 ${activeTab === 'idCard' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('idCard')}
              >
                <CreditCard size={20} className="mr-1 md:mr-2" /> <span className="text-sm md:text-lg">ID Card</span>
              </a>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <a
                className={`tab tab-md md:tab-lg flex-1 ${activeTab === 'admin' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('admin')}
              >
                <Shield size={20} className="mr-1 md:mr-2" /> <span className="text-sm md:text-lg">Admin</span>
              </a>
              <a
                className={`tab tab-md md:tab-lg flex-1 ${activeTab === 'users' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('users')}
              >
                <Users size={20} className="mr-1 md:mr-2" /> <span className="text-sm md:text-lg">Users</span>
              </a>
              <a
                className={`tab tab-md md:tab-lg flex-1 ${activeTab === 'idRequests' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('idRequests')}
              >
                <CreditCard size={20} className="mr-1 md:mr-2" /> <span className="text-sm md:text-lg">ID Requests</span>
              </a>
            </>
          )}

          <a
            className={`tab tab-md md:tab-lg flex-1 ${activeTab === 'calendar' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('calendar')}
          >
            <CalendarIcon size={20} className="mr-1 md:mr-2" /> <span className="text-sm md:text-lg">Calendar</span>
          </a>
        </div>

        <div className="min-h-[200px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-base-100/50 z-10 rounded-lg fade-in">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div key={activeTab} className="fade-in">
              {activeTab === 'attendance' && user.role !== 'admin' && <Attendance />}
              {activeTab === 'myRecords' && user.role !== 'admin' && <MyRecords />}
              {activeTab === 'idCard' && user.role !== 'admin' && <IDCardApply />}
              {activeTab === 'admin' && user.role === 'admin' && <AdminDashboard />}
              {activeTab === 'users' && user.role === 'admin' && <UserManagement />}
              {activeTab === 'idRequests' && user.role === 'admin' && <AdminIDCardRequests />}
              {activeTab === 'calendar' && <CalendarPage />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
