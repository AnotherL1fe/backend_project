import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import UserDetailPage from './pages/UserDetailPage';
import CacheManager from './components/CacheManager/CacheManager';
import SupportChat from './components/SupportChat/SupportChat.jsx';
import { useStorageMonitor } from './hooks/useLocalStorage';
import AddPostPage from './pages/addPostPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import useAuthStore from './store/authStore';
import './App.css';

const API_URL = 'http://localhost:3001';

// Компонент для защиты маршрутов
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Компонент для публичных маршрутов
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Компонент кнопки логаута
const LogoutButton = ({ onLogout }) => {
    return (
        <button
            onClick={onLogout}
            className="logout-btn"
            style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginLeft: '10px'
            }}
        >
            Выйти
        </button>
    );
};

// Главный компонент с защищенными маршрутами
const AppContent = () => {
    const [isHoveringSupport, setIsHoveringSupport] = useState(false);
    const [isHoveringCache, setIsHoveringCache] = useState(false);
    const [showCacheManager, setShowCacheManager] = useState(false);
    const storageInfo = useStorageMonitor();
    const { user, logout } = useAuthStore();
    const [showSupportManager, setShowSupportManager] = useState(false)

    const handleLogout = async () => {
        try {
            // Отправляем запрос на бэкенд для очистки куки
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            // Очищаем состояние в store
            logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Даже если запрос не удался, очищаем локальное состояние
            logout();
        }
    };

    return (
        <Layout user={user} onLogout={handleLogout}>
            <div className="app-container">
                {/* Кнопка для показа/скрытия менеджера кеша */}
                <div className="cache-toggle">
                    <div
                        className={`cache-toggle-button ${isHoveringCache ? 'visible' : ''}`}
                        onMouseEnter={() => setIsHoveringCache(true)}
                        onMouseLeave={() => setIsHoveringCache(false)}
                    >
                        <button
                            className="cache-manager-toggle"
                            onClick={() => setShowCacheManager(!showCacheManager)}
                            title={`${storageInfo.usePercent || 0}% использовать`}
                        >
                            {showCacheManager ? '✕' : '⚙️'}
                        </button>
                    </div>
                </div>

                {showCacheManager && <CacheManager />}
                <div className="support-toggle">
                    <div
                        className={`supportChat-button ${isHoveringSupport ? 'visible' : ''}`}
                        onMouseEnter={() => setIsHoveringSupport(true)}
                        onMouseLeave={() => setIsHoveringSupport(false)}>
                        <button
                            className="supportChatManager"
                            onClick={() => setShowSupportManager(!showSupportManager)}
                        >
                            {showSupportManager ? '✕' : '🗨️'}
                            {isHoveringSupport && (
                                <span className="support-tooltip">
                                    {showSupportManager ? 'Закрыть чат' : 'Поддержка'}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {showSupportManager && <SupportChat />}
                {/* Информация о пользователе и кнопка выхода */}
                {user && (
                    <div className="user-info-bar" style={{
                        top: '10px',
                        right: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: 'white',
                        padding: '8px 16px 8px 16px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: "50px"
                    }}>
                        <div>
                        <span style={{ color: '#666' }}>
                            Вы вошли как: <strong>{user.username}</strong>
                        </span>
                        </div>
                        <LogoutButton onLogout={handleLogout} />
                    </div>
                )}

                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/user/:id/*" element={<UserDetailPage />} />
                    <Route path="/add-post" element={<AddPostPage />} />
                </Routes>
            </div>
        </Layout>
    );
};

function App() {
    // Проверяем аутентификацию при загрузке
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <Router>
            <Routes>
                {/* Публичные маршруты */}
                <Route path="/login" element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                } />

                <Route path="/register" element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                } />

                {/* Защищенные маршруты */}
                <Route path="/*" element={
                    <ProtectedRoute>
                        <AppContent />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;