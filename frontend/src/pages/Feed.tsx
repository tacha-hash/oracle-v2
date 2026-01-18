import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { list } from '../api/oracle';
import type { Document } from '../api/oracle';
import { LogCard } from '../components/LogCard';
import styles from './Feed.module.css';

const TYPES = ['all', 'principle', 'learning', 'retro'] as const;

// Category config matching Graph3D
const CATEGORIES = [
  { key: 'all', label: 'All', color: '#8b5cf6' },
  { key: 'philosophy', label: 'ปรัชญา', color: '#9333ea' },
  { key: 'technical', label: 'เทคนิค', color: '#3b82f6' },
  { key: 'identity', label: 'ตัวตน', color: '#f97316' },
  { key: 'projects', label: 'โปรเจค', color: '#ec4899' },
  { key: 'methodology', label: 'วิธีทำงาน', color: '#eab308' },
  { key: 'ethics', label: 'จริยธรรม', color: '#ef4444' },
] as const;

export function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Get type and category from URL
  const type = searchParams.get('type') || 'all';
  const category = searchParams.get('category') || 'all';

  function setType(newType: string) {
    const params: Record<string, string> = {};
    if (newType !== 'all') params.type = newType;
    if (category !== 'all') params.category = category;
    setSearchParams(params);
  }

  function setCategory(newCategory: string) {
    const params: Record<string, string> = {};
    if (type !== 'all') params.type = type;
    if (newCategory !== 'all') params.category = newCategory;
    setSearchParams(params);
  }

  useEffect(() => {
    loadDocs(true);
  }, [type]);

  async function loadDocs(reset = false) {
    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await list(type, 100, newOffset); // Load more to filter client-side
      if (reset) {
        setDocs(data.results);
        setOffset(100);
      } else {
        setDocs(prev => [...prev, ...data.results]);
        setOffset(prev => prev + 100);
      }
      setHasMore(data.results.length >= 100);
    } finally {
      setLoading(false);
    }
  }

  // Filter by category client-side
  const filteredDocs = useMemo(() => {
    if (category === 'all') return docs;
    return docs.filter(d => (d as any).category === category);
  }, [docs, category]);

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: docs.length };
    docs.forEach(d => {
      const cat = (d as any).category || 'methodology';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [docs]);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Filter by Type</h3>
        <div className={styles.filters}>
          {TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`${styles.filterBtn} ${type === t ? styles.active : ''}`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
            </button>
          ))}
        </div>

        <h3 className={styles.sidebarTitle} style={{ marginTop: '24px' }}>Filter by Category</h3>
        <div className={styles.filters}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`${styles.filterBtn} ${category === c.key ? styles.active : ''}`}
              style={{
                borderLeft: `3px solid ${c.color}`,
                opacity: categoryCounts[c.key] ? 1 : 0.4
              }}
            >
              {c.label} {categoryCounts[c.key] ? `(${categoryCounts[c.key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <main className={styles.main}>
        <h1 className={styles.title}>Knowledge Feed</h1>
        <p className={styles.subtitle}>
          Browse Oracle's indexed knowledge — {filteredDocs.length} documents
        </p>

        <div className={styles.feed}>
          {filteredDocs.map(doc => (
            <LogCard key={doc.id} doc={doc} />
          ))}
        </div>

        {loading && <div className={styles.loading}>Loading...</div>}

        {!loading && filteredDocs.length === 0 && (
          <div className={styles.empty}>No documents found</div>
        )}

        {!loading && hasMore && docs.length < 200 && (
          <button type="button" onClick={() => loadDocs(false)} className={styles.loadMore}>
            Load More
          </button>
        )}
      </main>
    </div>
  );
}
