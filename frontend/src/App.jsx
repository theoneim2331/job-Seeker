import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import LoginPage from './components/Auth/LoginPage';
import MainLayout from './components/Layout/MainLayout';
import JobFeed from './components/Jobs/JobFeed';
import ApplicationDashboard from './components/Applications/ApplicationDashboard';
import ChatBubble from './components/Assistant/ChatBubble';

// Protected route wrapper
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="animate-pulse text-accent">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function AppContent() {
    const { user } = useAuth();

    return (
        <>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <JobFeed />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/applications"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <ApplicationDashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* AI Assistant Chat Bubble - only show when logged in */}
            {user && <ChatBubble />}
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <FilterProvider>
                <AppContent />
            </FilterProvider>
        </AuthProvider>
    );
}

export default App;
