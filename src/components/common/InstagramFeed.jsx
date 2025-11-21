import React from 'react';
import { Instagram, Heart, MessageCircle } from 'lucide-react';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const FALLBACK_POSTS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=400&fit=crop',
    likes: '2.3k',
    comments: '156',
    url: 'https://instagram.com/snowcitybangalore'
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=400&fit=crop',
    likes: '1.8k',
    comments: '98',
    url: 'https://instagram.com/snowcitybangalore'
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop',
    likes: '3.1k',
    comments: '203',
    url: 'https://instagram.com/snowcitybangalore'
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1524476289-01c0b6e6bb2b?w=400&h=400&fit=crop',
    likes: '2.7k',
    comments: '178',
    url: 'https://instagram.com/snowcitybangalore'
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1529310399831-ed472b81d589?w=400&h=400&fit=crop',
    likes: '1.9k',
    comments: '134',
    url: 'https://instagram.com/snowcitybangalore'
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop',
    likes: '2.5k',
    comments: '189',
    url: 'https://instagram.com/snowcitybangalore'
  }
];

export default function InstagramFeed() {
  const [posts, setPosts] = React.useState(FALLBACK_POSTS);
  const [status, setStatus] = React.useState('idle');

  React.useEffect(() => {
    let cancelled = false;

    async function loadInstagram() {
      setStatus('loading');
      try {
        const res = await api.get(endpoints.social.instagram(), { params: { username: 'snowcitybangalore', limit: 12 } });
        const payload = res?.data || res || {};
        const list = Array.isArray(payload?.posts)
          ? payload.posts
          : Array.isArray(payload)
            ? payload
            : [];
        if (!cancelled && list.length) {
          setPosts(
            list.map((post, idx) => ({
              id: post.id || post.code || idx,
              image: post.thumbnail_url || post.media_url || post.image || post.permalink_thumbnail || FALLBACK_POSTS[idx % FALLBACK_POSTS.length].image,
              likes: post.like_count ? `${post.like_count}` : FALLBACK_POSTS[idx % FALLBACK_POSTS.length].likes,
              comments: post.comments_count ? `${post.comments_count}` : FALLBACK_POSTS[idx % FALLBACK_POSTS.length].comments,
              url: post.permalink || post.url || 'https://instagram.com/snowcitybangalore'
            }))
          );
          setStatus('succeeded');
        } else if (!cancelled) {
          setStatus('empty');
        }
      } catch (err) {
        if (!cancelled) setStatus('failed');
      }
    }

    loadInstagram();
    return () => {
      cancelled = true;
    };
  }, []);

  const heading = (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Instagram className="w-8 h-8 text-pink-600" />
        <h2 className="text-slate-900 text-xl sm:text-2xl font-semibold">FOLLOW US ON INSTAGRAM</h2>
      </div>
      <p className="text-gray-600 max-w-2xl mx-auto mb-4">
        Share your SnowCity moments with <span className="font-semibold text-pink-600">#SnowCityBangalore</span>
      </p>
      <a
        href="https://instagram.com/snowcitybangalore"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
      >
        @snowcitybangalore
      </a>
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {posts.map((post, index) => (
        <a
          href={post.url || 'https://instagram.com/snowcitybangalore'}
          target="_blank"
          rel="noreferrer"
          key={post.id || index}
          className="relative aspect-square rounded-xl overflow-hidden shadow-md group"
        >
          <img
            src={post.image}
            alt="Instagram post"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.08]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-around text-sm font-semibold">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 fill-white" />
                <span>{post.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments}</span>
              </div>
            </div>
          </div>
          <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Instagram className="w-4 h-4 text-pink-600" />
          </div>
        </a>
      ))}
    </div>
  );

  return (
    <section className="bg-gradient-to-b from-white to-pink-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {heading}

        {status === 'loading' && !posts?.length ? (
          <div className="flex justify-center py-6 text-gray-500">Loading Instagram feed…</div>
        ) : null}

        {renderGrid()}

        <div className="text-center mt-10">
          <a
            href="https://instagram.com/snowcitybangalore"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition"
          >
            <Instagram className="w-5 h-5" />
            Follow us on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}