// import React, { useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import usePostStore from '../store/postStore';
// import useAuthStore from '../store/authStore';
// import Spinner from '../components/UI/Spinner';
// import './PostDetailPage.css';

// const PostDetailPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { currentPost, isLoading, error, fetchPostById, deletePost } = usePostStore();
//   const { user } = useAuthStore();

//   useEffect(() => {
//     fetchPostById(id);
//   }, [fetchPostById, id]);

//   const handleDelete = async () => {
//     if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
//       const result = await deletePost(id);
//       if (result.success) {
//         navigate('/');
//       }
//     }
//   };

//   if (isLoading) {
//     return <Spinner />;
//   }

//   if (error || !currentPost) {
//     return (
//       <div className="error-container">
//         <h2>Ошибка</h2>
//         <p>{error || 'Пост не найден'}</p>
//         <Link to="/" className="back-btn">Вернуться на главную</Link>
//       </div>
//     );
//   }

//   const formattedDate = new Date(currentPost.createdAt).toLocaleDateString('ru-RU', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit'
//   });

//   return (
//     <div className="post-detail-page">
//       <div className="post-detail-container">
//         <div className="post-detail-header">
//           <Link to="/" className="back-link">← Назад</Link>
          
//           {user?.id === currentPost.author?.id && (
//             <div className="post-actions">
//               <Link to={`/edit-post/${currentPost.id}`} className="edit-btn">
//                 Редактировать
//               </Link>
//               <button onClick={handleDelete} className="delete-btn">
//                 Удалить
//               </button>
//             </div>
//           )}
//         </div>

//         <article className="post-detail">
//           <h1 className="post-detail-title">{currentPost.title}</h1>
          
//           <div className="post-detail-meta">
//             <span className="post-detail-author">
//               Автор: <Link to={`/user/${currentPost.author?.id}`}>
//                 {currentPost.author?.username}
//               </Link>
//             </span>
//             <span className="post-detail-date">{formattedDate}</span>
//           </div>

//           <div className="post-detail-content">
//             {currentPost.content || 'Нет содержимого'}
//           </div>
//         </article>
//       </div>
//     </div>
//   );
// };

// export default PostDetailPage;