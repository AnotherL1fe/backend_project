import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './addPostPage.css';
import useDataStore from '../store/dataStore';

const BASEURL = 'http://localhost:3001';

const AddPostPage = () => {
    const navigate = useNavigate();
    const [post, setPost] = useState({
        title: '',
        body: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { addPost } = useDataStore()
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await axios.post(`${BASEURL}/api/posts`, post, {
        withCredentials: true,
      },);

            if (response.data.success) {
                alert('✅ Пост успешно добавлен!');
                if (post.userId) {
                    addPost(post.userId, post)
                    navigate(`/user/${post.userId}`);
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            alert('❌ Ошибка: ' + (error.response?.data?.error || 'Не удалось добавить пост'));
            console.log(error);
            
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-post-page">
            <Link to="/" className="back-link">← На главную</Link>

            <div className="add-post-container">
                <h1>Добавить новый пост</h1>

                <form onSubmit={handleSubmit} className="add-post-form">
                    <div className="form-group">
                        <label className="form-label">Заголовок</label>
                        <input
                            type="text"
                            value={post.title}
                            onChange={(e) => setPost({ ...post, title: e.target.value })}
                            placeholder="Введите заголовок поста"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Содержание</label>
                        <textarea
                            value={post.body}
                            onChange={(e) => setPost({ ...post, body: e.target.value })}
                            placeholder="Введите содержание поста"
                            className="form-textarea"
                            rows="6"
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="cancel-btn"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? 'Добавление...' : 'Опубликовать пост'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPostPage;