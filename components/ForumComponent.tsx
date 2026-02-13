
import React, { useState, useEffect } from 'react';
import { ForumPost, ForumComment, UserProfile } from '../types';

interface ForumComponentProps {
  user: UserProfile | null;
}

const ForumComponent: React.FC<ForumComponentProps> = ({ user }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Genel Hukuk' });
  const [replyTarget, setReplyTarget] = useState<{ postId: string; commentId?: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  // Load posts from localStorage or show initial mock data
  useEffect(() => {
    const savedPosts = localStorage.getItem('dp_forum_posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      const initialPosts: ForumPost[] = [
        {
          id: '1',
          title: 'Muris Muvazaası ve Saklı Pay İhlali Hakkında Soru',
          author: 'Av. Mehmet Y.',
          content: 'Müvekkilimin babası vefatından 2 yıl önce tüm taşınmazlarını tapuda satış göstererek ikinci eşine devretmiş. Tenkis davası mı yoksa muvazaa nedeniyle tapu iptal davası mı açmalıyım? Görüşlerinizi bekliyorum.',
          date: '2 saat önce',
          likes: 12,
          dislikes: 1,
          category: 'Miras Hukuku',
          comments: [
            {
              id: 'c1',
              author: 'Av. Selin K.',
              content: 'Görünürdeki işlem satış olduğu için öncelikle muris muvazaasına dayalı tapu iptal ve tescil davası açmanız daha yerinde olacaktır. Zira muvazaa varsa işlem geçersizdir.',
              date: '1 saat önce',
              likes: 5,
              dislikes: 0,
              replies: []
            }
          ]
        }
      ];
      setPosts(initialPosts);
      localStorage.setItem('dp_forum_posts', JSON.stringify(initialPosts));
    }
  }, []);

  const savePosts = (updatedPosts: ForumPost[]) => {
    setPosts(updatedPosts);
    localStorage.setItem('dp_forum_posts', JSON.stringify(updatedPosts));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert('Lütfen giriş yapın.'); return; }
    
    const post: ForumPost = {
      id: Date.now().toString(),
      title: newPost.title,
      author: user.name || 'Meslektaş',
      content: newPost.content,
      date: 'Az önce',
      likes: 0,
      dislikes: 0,
      category: newPost.category,
      comments: []
    };

    savePosts([post, ...posts]);
    setNewPost({ title: '', content: '', category: 'Genel Hukuk' });
    setIsPosting(false);
  };

  const handleReaction = (postId: string, type: 'like' | 'dislike', commentId?: string) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        if (!commentId) {
          return { ...p, [type === 'like' ? 'likes' : 'dislikes']: p[type === 'like' ? 'likes' : 'dislikes'] + 1 };
        } else {
          return {
            ...p,
            comments: updateCommentsReaction(p.comments, commentId, type)
          };
        }
      }
      return p;
    });
    savePosts(updated);
  };

  const updateCommentsReaction = (comments: ForumComment[], targetId: string, type: 'like' | 'dislike'): ForumComment[] => {
    return comments.map(c => {
      if (c.id === targetId) {
        return { ...c, [type === 'like' ? 'likes' : 'dislikes']: c[type === 'like' ? 'likes' : 'dislikes'] + 1 };
      }
      return { ...c, replies: updateCommentsReaction(c.replies, targetId, type) };
    });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyTarget || !replyText.trim()) return;

    const newComment: ForumComment = {
      id: 'c-' + Date.now(),
      author: user.name || 'Meslektaş',
      content: replyText,
      date: 'Az önce',
      likes: 0,
      dislikes: 0,
      replies: []
    };

    const updated = posts.map(p => {
      if (p.id === replyTarget.postId) {
        if (!replyTarget.commentId) {
          return { ...p, comments: [...p.comments, newComment] };
        } else {
          return { ...p, comments: addReplyToComment(p.comments, replyTarget.commentId, newComment) };
        }
      }
      return p;
    });

    savePosts(updated);
    setReplyText('');
    setReplyTarget(null);
  };

  const addReplyToComment = (comments: ForumComment[], targetId: string, reply: ForumComment): ForumComment[] => {
    return comments.map(c => {
      if (c.id === targetId) {
        return { ...c, replies: [...c.replies, reply] };
      }
      return { ...c, replies: addReplyToComment(c.replies, targetId, reply) };
    });
  };

  const CommentNode = ({ comment, postId, depth = 0 }: { comment: ForumComment, postId: string, depth?: number, key?: React.Key }) => (
    <div className={`mt-6 border-l-2 border-slate-100 dark:border-slate-800 pl-8 ${depth > 0 ? 'ml-4' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-900 dark:text-luxury-silver">{comment.author}</span>
        <span className="text-[10px] text-slate-400 dark:text-luxury-steel font-light">{comment.date}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-luxury-steel font-light mb-4">{comment.content}</p>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => handleReaction(postId, 'like', comment.id)} className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-emerald-500 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
            {comment.likes}
          </button>
          <button onClick={() => handleReaction(postId, 'dislike', comment.id)} className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-red-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m7-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
            {comment.dislikes}
          </button>
        </div>
        <button 
          onClick={() => setReplyTarget({ postId, commentId: comment.id })}
          className="text-[10px] uppercase font-black text-[#C5A059] tracking-widest hover:underline"
        >
          Yanıtla
        </button>
      </div>

      {comment.replies.map(r => (
        <CommentNode key={r.id} comment={r} postId={postId} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div className="space-y-16 reveal pb-32 max-w-5xl mx-auto">
      {/* Disclaimer Banner */}
      <div className="bg-[#C5A059]/5 dark:bg-[#C5A059]/10 border border-[#C5A059]/20 p-8 rounded-[2rem] text-center">
        <div className="text-xs leading-relaxed font-light italic">
          <span className="font-bold text-[#C5A059] uppercase tracking-widest block mb-2">Bilgi Paylaşımı Bildirimi</span>
          <p className="text-slate-600 dark:text-luxury-silver">
            Bu forum alanı, hukukçular arasında yalnızca mesleki bilgi paylaşımı ve vaka tartışması amacıyla kurulmuştur. Burada paylaşılan hiçbir görüş, tavsiye veya yanıt hukuki danışmanlık teşkil etmez. Resmi iş süreçlerinizde kendi araştırmanızı yapmanız zorunludur.
          </p>
        </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <h2 className="text-4xl lg:text-5xl font-serif text-slate-900 dark:text-luxury-silver mb-2">
            <span className="dark:text-luxury-silver">Mesleki</span> <span className="italic text-[#C5A059]">Kürsü</span>
          </h2>
          <p className="text-slate-400 dark:text-luxury-steel font-light">Meslektaşlarınızla vaka tartışın, bilgi birikiminizi paylaşın.</p>
        </div>
        <button 
          onClick={() => setIsPosting(true)}
          className="px-10 py-5 bg-slate-900 dark:bg-luxury-midnight text-white border border-[#C5A059]/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-xl active:scale-95"
        >
          Yeni Tartışma Başlat
        </button>
      </header>

      {isPosting && (
        <div className="luxury-card rounded-[3rem] p-12 bg-white dark:bg-luxury-charcoal border border-[#C5A059]/10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-serif italic text-slate-900 dark:text-luxury-silver">Yeni Dosya Aç</h3>
            <button onClick={() => setIsPosting(false)} className="text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={handleCreatePost} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-luxury-steel">Konu Başlığı</label>
                <input 
                  required
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-luxury-midnight border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-luxury-silver focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30"
                  value={newPost.title}
                  onChange={e => setNewPost({...newPost, title: e.target.value})}
                  placeholder="Vaka başlığını buraya yazın..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-luxury-steel">Kategori</label>
                <select 
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-luxury-midnight border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-luxury-silver focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30"
                  value={newPost.category}
                  onChange={e => setNewPost({...newPost, category: e.target.value})}
                >
                  <option>Genel Hukuk</option>
                  <option>Borçlar Hukuku</option>
                  <option>Miras Hukuku</option>
                  <option>Ticaret Hukuku</option>
                  <option>Ceza Hukuku</option>
                  <option>İdare Hukuku</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-luxury-steel">Vaka Detayı</label>
              <textarea 
                required
                className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-luxury-midnight border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-luxury-silver focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 min-h-[150px] resize-none"
                value={newPost.content}
                onChange={e => setNewPost({...newPost, content: e.target.value})}
                placeholder="Uyuşmazlık detaylarını buraya yazın..."
              />
            </div>
            <button className="w-full py-5 bg-slate-900 dark:bg-luxury-midnight text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all border border-[#C5A059]/10">
              Tartışmayı Yayınla
            </button>
          </form>
        </div>
      )}

      <div className="space-y-10">
        {posts.map(post => (
          <article key={post.id} className="luxury-card rounded-[3.5rem] p-12 bg-white dark:bg-luxury-charcoal border border-slate-50 dark:border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest mb-2 block">{post.category}</span>
                <h3 className="text-2xl font-serif text-slate-900 dark:text-luxury-silver mb-2">{post.title}</h3>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-luxury-steel font-medium">
                  <span className="font-bold text-slate-900 dark:text-luxury-silver">{post.author}</span>
                  <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-luxury-steel font-light leading-relaxed mb-10 text-justify">{post.content}</p>

            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-8">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleReaction(post.id, 'like')} className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                    {post.likes}
                  </button>
                  <button onClick={() => handleReaction(post.id, 'dislike')} className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m7-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                    {post.dislikes}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  <span>{post.comments.length} Görüş</span>
                </div>
              </div>
              <button 
                onClick={() => setReplyTarget({ postId: post.id })}
                className="text-[10px] uppercase font-black text-slate-900 dark:text-luxury-silver tracking-widest hover:text-[#C5A059] transition-colors"
              >
                Görüşünü Bildir
              </button>
            </div>

            {/* Nested Comments Area */}
            {post.comments.length > 0 && (
              <div className="mt-12 pt-10 border-t border-slate-50 dark:border-slate-800">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 mb-8">Meslektaş Görüşleri</h5>
                {post.comments.map(comment => (
                  <CommentNode key={comment.id} comment={comment} postId={post.id} />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setReplyTarget(null)}></div>
          <div className="relative bg-white dark:bg-luxury-charcoal rounded-[3rem] shadow-2xl w-full max-w-lg p-12 luxury-card border border-[#C5A059]/20">
            <h4 className="text-xl font-serif italic mb-6 text-slate-900 dark:text-luxury-silver">Cevap Yaz</h4>
            <form onSubmit={handleReply} className="space-y-6">
              <textarea 
                required
                className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-luxury-midnight border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-luxury-silver focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 min-h-[120px] text-sm resize-none"
                placeholder="Meslektaşınıza cevabınızı yazın..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="flex-1 py-4 bg-slate-50 dark:bg-luxury-midnight text-slate-400 dark:text-luxury-steel rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-slate-900 dark:bg-luxury-midnight text-white border border-[#C5A059]/30 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#C5A059] transition-all"
                >
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumComponent;
