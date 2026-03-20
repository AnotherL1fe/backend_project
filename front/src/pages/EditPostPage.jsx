import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import usePostStore from '../store/postStore';
import useAuthStore from '../store/authStore';
import Spinner from '../components/UI/Spinner';
import './EditPostPage.css';

const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { currentPost, isLoading, error, fetchPostById, updatePost } = usePostStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем данные поста при монтировании
  useEffect(() => {
    if (id) {
      fetchPostById(id);
    }
  }, [id, fetchPostById]);

  // Заполняем форму данными поста
  useEffect(() => {
    if (currentPost) {
      setFormData({
        title: currentPost.title || '',
        content: currentPost.content || ''
      });
    }
  }, [currentPost]);

  // Проверяем, имеет ли пользователь право редактировать этот пост
  useEffect(() => {
    if (currentPost && user && currentPost.author?.id !== user.id) {
      // Если пользователь не автор поста, перенаправляем на страницу поста
      navigate(`/post/${id}`);
    }
  }, [currentPost, user, id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Валидация
    if (!formData.title.trim()) {
      setFormError('Заголовок не может быть пустым');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePost(id, formData);
      
      if (result.success) {
        // Перенаправляем на страницу поста после успешного обновления
        navigate(`/post/${id}`);
      } else {
        setFormError(result.error || 'Ошибка при обновлении поста');
      }
    } catch (err) {
      setFormError('Произошла ошибка при сохранении');
      console.error('Edit post error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/post/${id}`);
  };

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="edit-post-loading">
        <Spinner />
        <p>Загрузка поста...</p>
      </div>
    );
  }

  // Показываем ошибку, если пост не найден
  if (error || !currentPost) {
    return (
      <div className="edit-post-error">
        <h2>Ошибка</h2>
        <p>{error || 'Пост не найден'}</p>
        <Link to="/" className="back-home-btn">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="edit-post-page">
      <div className="edit-post-container">
        <div className="edit-post-header">
          <h1>Редактирование поста</h1>
          <Link to={`/post/${id}`} className="cancel-link">
            Отмена
          </Link>
        </div>

        {(formError || error) && (
          <div className="edit-post-error-message">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-post-form">
          <div className="form-group">
            <label htmlFor="title">Заголовок *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите заголовок поста"
              disabled={isSubmitting}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Содержание</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Введите содержание поста (поддерживается Markdown)"
              disabled={isSubmitting}
              rows={12}
              className="form-textarea"
            />
            <small className="form-hint">
              Вы можете использовать Markdown для форматирования текста
            </small>
          </div>

          <div className="post-preview">
            <h3>Предпросмотр:</h3>
            <div className="preview-content">
              <strong>{formData.title || 'Заголовок'}</strong>
              <p>{formData.content || 'Содержание поста...'}</p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Отмена
            </button>
          </div>
        </form>

        <div className="edit-post-info">
          <p>
            <strong>Автор:</strong> {currentPost.author?.username}
          </p>
          <p>
            <strong>Создан:</strong> {new Date(currentPost.createdAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {currentPost.updatedAt !== currentPost.createdAt && (
            <p>
              <strong>Обновлен:</strong> {new Date(currentPost.updatedAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPostPage;