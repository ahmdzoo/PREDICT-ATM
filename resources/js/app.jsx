import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import Transactions from './Pages/Transactions';
import CreateTransaction from './Pages/CreateTransaction';
import Prediction from './Pages/Prediction';
import Branches from './Pages/Branches';
import MasterBanks from './Pages/MasterBanks';
import Layout from './Components/Layout';
import LoadingSpinner from './Components/LoadingSpinner';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
    );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        borderRadius: '12px',
                        padding: '12px 16px',
                    },
                }}
            />
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="transactions/create" element={<CreateTransaction />} />
                    <Route path="prediction" element={<Prediction />} />
                    <Route path="branches" element={<Branches />} />
                    <Route path="master-banks" element={<MasterBanks />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
