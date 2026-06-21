'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import SocialShare from '@/app/components/SocialShare';


interface Update {
  id: string;
  title: string;
  description: string;
  change_type: 'feature' | 'fix' | 'improvement';
  created_at: string;
}

interface ReviewComment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  summary: string;
  rating: number;
  results_file_url?: string;
  screenshot_urls?: string[];
  error_logs?: string;
  upvote_count: number;
  comments: ReviewComment[];
  created_at: string;
  test_passed?: boolean;
  reward_paid?: boolean;
  specs_os?: string;
  specs_browser?: string;
  specs_resolution?: string;
  downvotes?: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  is_product: boolean;
  demo_url?: string;
  github_url?: string;
  test_scenario_url?: string;
  like_count: number;
  comments_list: any[];
  project_changelogs: Update[];
  reviews: Review[];
  category?: string;
  tags?: string;
}

export default function PortfolioClient({ initialItems }: { initialItems: PortfolioItem[] }) {
  const params = useParams();
  const username = (params?.username as string) || '';
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [visitorHash, setVisitorHash] = useState<string>('');
  
  // Filtering States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const categories = ['All', 'Development', 'Design', 'Marketing', 'Product Management', 'Writing', 'Other'];

  // Active Tab state for each item (keyed by item ID)
  const [activeTabs, setActiveTabs] = useState<Record<string, 'Overview' | 'Changelog' | 'Review Reports'>>({});
  
  // Modal states for writing reviews
  const [activeReviewItemId, setActiveReviewItemId] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [summary, setSummary] = useState('');
  const [errorLogs, setErrorLogs] = useState('');
  const [uploading, setUploading] = useState(false);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [resultsFileUrl, setResultsFileUrl] = useState('');
  const [specsOs, setSpecsOs] = useState('macOS');
  const [specsBrowser, setSpecsBrowser] = useState('Chrome');
  const [specsResolution, setSpecsResolution] = useState('1920x1080');
  const [testPassed, setTestPassed] = useState(true);

  // Comment state on reviews
  const [activeCommentReviewId, setActiveCommentReviewId] = useState<string | null>(null);
  const [reviewCommentName, setReviewCommentName] = useState('');
  const [reviewCommentContent, setReviewCommentContent] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hash = localStorage.getItem('visitor_hash');
      if (!hash) {
        hash = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('visitor_hash', hash);
      }
      setVisitorHash(hash);
    }
  }, []);

  useEffect(() => {
    if (activeReviewItemId && typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      
      // OS Detection
      let os = 'Windows';
      if (userAgent.indexOf('Macintosh') !== -1 || userAgent.indexOf('Mac OS X') !== -1) {
        os = 'macOS';
      } else if (userAgent.indexOf('Linux') !== -1) {
        os = 'Linux';
      } else if (/Android/.test(userAgent)) {
        os = 'Android';
      } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        os = 'iOS';
      }
      setSpecsOs(os);

      // Browser Detection
      let browser = 'Chrome';
      if (userAgent.indexOf('Firefox') !== -1) {
        browser = 'Firefox';
      } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
        browser = 'Safari';
      } else if (userAgent.indexOf('Edge') !== -1 || userAgent.indexOf('Edg') !== -1) {
        browser = 'Edge';
      } else if (userAgent.indexOf('OPR') !== -1 || userAgent.indexOf('Opera') !== -1) {
        browser = 'Opera';
      }
      setSpecsBrowser(browser);

      // Resolution Detection
      setSpecsResolution(`${window.screen.width}x${window.screen.height}`);
    }
  }, [activeReviewItemId]);

  const getTab = (itemId: string) => activeTabs[itemId] || 'Overview';
  const setTab = (itemId: string, tab: 'Overview' | 'Changelog' | 'Review Reports') => {
    setActiveTabs(prev => ({ ...prev, [itemId]: tab }));
  };

  // Upvote App
  const handleLikeApp = async (itemId: string) => {
    if (!visitorHash) return;
    try {
      const res = await fetch('/api/interactions/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, visitorHash })
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return { ...item, like_count: item.like_count + 1 };
          }
          return item;
        }));
      } else {
        alert(data.error || 'Already upvoted this application');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Vote on Review (upvote/downvote)
  const handleVoteReview = async (itemId: string, reviewId: string, type: 'upvote' | 'downvote') => {
    if (!visitorHash) return;
    try {
      const res = await fetch('/api/interactions/review/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, visitorHash, type })
      });
      const data = await res.json();
      if (data.success) {
        const increment = data.action === 'added' ? 1 : -1;
        setItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              reviews: item.reviews.map(r => {
                if (r.id === reviewId) {
                  if (type === 'upvote') {
                    return { ...r, upvote_count: r.upvote_count + increment };
                  } else {
                    return { ...r, downvotes: (r.downvotes || 0) + increment };
                  }
                }
                return r;
              })
            };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle file uploads for review creation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'screenshots' | 'results') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload/media', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          if (type === 'screenshots') {
            setScreenshotUrls(prev => [...prev, data.url]);
          } else {
            setResultsFileUrl(data.url);
          }
        }
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Submit Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewItemId) return;

    try {
      const res = await fetch('/api/interactions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: activeReviewItemId,
          reviewerName,
          summary,
          rating,
          resultsFileUrl,
          screenshotUrls,
          errorLogs,
          specsOs,
          specsBrowser,
          specsResolution,
          testPassed,
          visitorHash
        })
      });
      const data = await res.json();
      if (data.success) {
        const newReview: Review = {
          ...data.review,
          upvote_count: 0,
          comments: []
        };
        setItems(prev => prev.map(item => {
          if (item.id === activeReviewItemId) {
            return {
              ...item,
              reviews: [newReview, ...item.reviews]
            };
          }
          return item;
        }));
        // Reset form
        setActiveReviewItemId(null);
        setReviewerName('');
        setRating(5);
        setSummary('');
        setErrorLogs('');
        setScreenshotUrls([]);
        setResultsFileUrl('');
      } else {
        alert(data.error || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Review Comment
  const handleCommentSubmit = async (e: React.FormEvent, itemId: string, reviewId: string) => {
    e.preventDefault();
    if (!reviewCommentName || !reviewCommentContent) return;

    try {
      const res = await fetch('/api/interactions/review/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          authorName: reviewCommentName,
          content: reviewCommentContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              reviews: item.reviews.map(r => r.id === reviewId ? { ...r, comments: [...r.comments, data.comment] } : r)
            };
          }
          return item;
        }));
        setReviewCommentName('');
        setReviewCommentContent('');
        setActiveCommentReviewId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12">
      {/* Search & Category Filter Bar */}
      <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Search Projects</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or tags..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm transition-all"
            />
          </div>
          <div className="md:w-64">
            <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all appearance-none pr-10"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ?
        filteredItems.map((item) => {
          const tab = getTab(item.id);
          const ratings = item.reviews?.map(r => r.rating) || [];
          const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

          return (
            <article key={item.id} className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden shadow-2xl flex flex-col">
              {/* Media Banner */}
              <div className="relative w-full h-80 bg-neutral-950 flex items-center justify-center border-b border-neutral-800/80">
                {item.media_type === 'video' ? (
                  <video src={item.media_url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                )}
                {item.is_product && (
                  <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow">
                    Product Review Open
                  </div>
                )}
              </div>

              {/* Content Wrapper */}
              <div className="p-8 flex-1 flex flex-col space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-neutral-100 tracking-tight">{item.title}</h3>
                    {/* Category & Tags Row */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.category && (
                        <span className="text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                          📁 {item.category}
                        </span>
                      )}
                      {item.tags && item.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    {item.is_product && avgRating && (
                      <div className="flex items-center space-x-2 mt-3 text-sm text-amber-400">
                        <span>★</span>
                        <span className="font-semibold">{avgRating} / 5.0</span>
                        <span className="text-neutral-500">({ratings.length} reviews)</span>
                      </div>
                    )}
                  </div>

                {item.is_product && (
                  <div className="flex flex-wrap gap-2">
                    {item.demo_url && (
                      <a 
                        href={`/api/interactions/track-click?itemId=${item.id}&type=demo_click&targetUrl=${encodeURIComponent(
                          item.demo_url + (item.demo_url.includes('?') ? '&' : '?') + 'sandbox_token=' + (typeof window !== 'undefined' ? btoa(item.id + '-' + visitorHash).substring(0, 16) : '')
                        )}&visitorHash=${visitorHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center space-x-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-all shadow"
                      >
                        <span>🚀</span>
                        <span>Live Demo</span>
                      </a>
                    )}
                    {item.github_url && (
                      <a 
                        href={`/api/interactions/track-click?itemId=${item.id}&type=repo_click&targetUrl=${encodeURIComponent(item.github_url)}&visitorHash=${visitorHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center space-x-2 text-xs bg-neutral-850 hover:bg-neutral-700 border border-neutral-700 text-white font-bold px-4 py-2 rounded-lg transition-all shadow"
                      >
                        <span>💻</span>
                        <span>GitHub Repo</span>
                      </a>
                    )}
                    {item.test_scenario_url && (
                      <a 
                        href={item.test_scenario_url} 
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold px-4 py-2 rounded-lg transition-all shadow"
                      >
                        <span>📝</span>
                        <span>Test Cases (.md)</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Tabs (Only for products) */}
              {item.is_product && (
                <div className="flex space-x-4 border-b border-neutral-800 mb-6">
                  {['Overview', 'Changelog', 'Review Reports'].map((t: any) => (
                    <button
                      key={t}
                      onClick={() => setTab(item.id, t)}
                      className={`pb-2.5 px-2 text-sm font-semibold border-b-2 transition-all ${
                        tab === t ? 'border-blue-500 text-blue-500' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {t === 'Overview' && 'Product Overview'}
                      {t === 'Changelog' && `Changelog (${item.project_changelogs?.length || 0})`}
                      {t === 'Review Reports' && `Review Reports (${item.reviews?.length || 0})`}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab Content */}
              <div className="flex-1">
                {(!item.is_product || tab === 'Overview') && (
                  <p 
                    className="text-neutral-300 leading-relaxed text-sm whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.description || '') }}
                  />
                )}

                {item.is_product && tab === 'Changelog' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-neutral-200">Improvements & Fixes Log</h4>
                    <div className="relative border-l border-neutral-800 ml-4 space-y-8">
                      {item.project_changelogs && item.project_changelogs.length > 0 ? (
                        item.project_changelogs.map((update) => (
                          <div key={update.id} className="relative pl-6">
                            {/* Timeline Indicator Dot */}
                            <span className="absolute -left-[11px] top-1 bg-blue-500 h-5 w-5 rounded-full border-4 border-neutral-950" />
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                update.change_type === 'feature' ? 'bg-green-500/10 text-green-400' :
                                update.change_type === 'fix' ? 'bg-red-500/10 text-red-400' :
                                'bg-blue-500/10 text-blue-400'
                              }`}>
                                {update.change_type}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-medium">
                                {new Date(update.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-md font-bold text-neutral-200 mt-1">{update.title}</h4>
                            <p 
                              className="text-sm text-neutral-400 mt-1"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(update.description || '') }}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500 italic pl-2">No improvements logged yet by the creator.</p>
                      )}
                    </div>
                  </div>
                )}

                {item.is_product && tab === 'Review Reports' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-neutral-200">Review Reports</h4>
                      <button
                        onClick={() => setActiveReviewItemId(item.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all"
                      >
                        + Submit Review Report
                      </button>
                    </div>

                    <div className="space-y-6">
                      {item.reviews && item.reviews.length > 0 ? (
                        item.reviews.map((review) => (
                          <div key={review.id} className="p-6 bg-neutral-950 rounded-xl border border-neutral-800 space-y-4">
                            {/* Reviewer Header */}
                            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-neutral-200">{review.reviewer_name}</h5>
                                  {review.reward_paid && (
                                    <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      🏆 Escrow Reward Paid
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-neutral-500 mt-0.5">
                                  <span className="text-amber-400 font-bold">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                  <span>•</span>
                                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                                {review.specs_os && (
                                  <div className="flex flex-wrap gap-1.5 mt-2 text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">
                                    <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">💻 {review.specs_os}</span>
                                    <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">🌐 {review.specs_browser}</span>
                                    {review.specs_resolution && (
                                      <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">🖥 {review.specs_resolution}</span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded border ${review.test_passed ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                      {review.test_passed ? '✓ Test Passed' : '✗ Test Failed'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleVoteReview(item.id, review.id, 'upvote')}
                                  className="flex items-center space-x-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-full transition-colors text-neutral-300"
                                >
                                  <span>👍</span>
                                  <span className="font-bold">{review.upvote_count}</span>
                                </button>
                                <button
                                  onClick={() => handleVoteReview(item.id, review.id, 'downvote')}
                                  className="flex items-center space-x-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-full transition-colors text-neutral-300"
                                >
                                  <span>👎</span>
                                  <span className="font-bold">{review.downvotes || 0}</span>
                                </button>
                              </div>
                            </div>

                            {/* Feedback */}
                            <p 
                              className="text-sm text-neutral-300 whitespace-pre-line"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review.summary || '') }}
                            />

                            {/* Screenshots & Results Attachments */}
                            {(review.screenshot_urls?.length || 0) > 0 && (
                              <div className="space-y-2">
                                <h6 className="text-xs font-semibold text-neutral-400">Attached Screenshots:</h6>
                                <div className="flex flex-wrap gap-2">
                                  {review.screenshot_urls?.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="relative group rounded-lg overflow-hidden border border-neutral-850">
                                      <img src={url} alt="Screenshot" className="w-24 h-24 object-cover hover:scale-105 transition-transform" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {review.results_file_url && (
                              <div className="text-xs">
                                <span className="text-neutral-400 mr-2">Test Report File:</span>
                                <a href={review.results_file_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-semibold">
                                  Download Report
                                </a>
                              </div>
                            )}

                            {/* Error logs */}
                            {review.error_logs && (
                              <details className="text-xs bg-neutral-900/60 p-3 rounded-lg border border-neutral-850/80 cursor-pointer">
                                <summary className="font-semibold text-neutral-300 select-none">Encountered Errors / Console Logs</summary>
                                <pre className="mt-2 p-2 bg-neutral-950 rounded text-red-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                                  {review.error_logs}
                                </pre>
                              </details>
                            )}

                            {/* Nested Comments section */}
                            <div className="pt-4 border-t border-neutral-900 space-y-3">
                              <h6 className="text-xs font-bold text-neutral-400">Discussion ({review.comments?.length || 0})</h6>
                              
                              {review.comments?.map((c) => (
                                <div key={c.id} className="text-xs bg-neutral-900/30 p-2.5 rounded-lg border border-neutral-850 ml-4 space-y-0.5">
                                  <strong className="text-neutral-300">{c.author_name}</strong>
                                  <p 
                                    className="text-neutral-400"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.content || '') }}
                                  />
                                </div>
                              ))}

                              {activeCommentReviewId === review.id ? (
                                <form 
                                  onSubmit={(e) => handleCommentSubmit(e, item.id, review.id)}
                                  className="ml-4 pt-2 space-y-2"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      required
                                      placeholder="Your Name"
                                      value={reviewCommentName}
                                      onChange={(e) => setReviewCommentName(e.target.value)}
                                      className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <textarea
                                    required
                                    rows={2}
                                    placeholder="Write a suggestion or reply..."
                                    value={reviewCommentContent}
                                    onChange={(e) => setReviewCommentContent(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      type="submit"
                                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] px-3 py-1 rounded"
                                    >
                                      Post Suggestion
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveCommentReviewId(null)}
                                      className="text-neutral-400 hover:text-neutral-300 text-[10px]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  onClick={() => setActiveCommentReviewId(review.id)}
                                  className="text-[11px] text-blue-400 hover:underline font-semibold ml-4"
                                >
                                  + Suggest / Reply on this Review
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500 italic">No review reports submitted yet. Be the first!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer / Interaction Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-800/80 pt-6">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleLikeApp(item.id)}
                    className="flex items-center space-x-2 text-sm bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 px-5 py-2.5 rounded-full transition-all shadow text-neutral-205 active:scale-95 text-neutral-200"
                  >
                    <span>👍 Upvote App</span>
                    <span className="font-extrabold text-white">{item.like_count}</span>
                  </button>
                  <SocialShare
                    url={typeof window !== 'undefined' ? `${window.location.origin}/${username}#${item.id}` : `https://portfolio-platform.dev/${username}#${item.id}`}
                    title={`${item.title} on ${username}'s Portfolio`}
                    description={`Check out ${item.title} by ${username} on Portfolio Platform.`}
                  />
                </div>
                
                <span className="text-xs text-neutral-500 font-medium">
                  {item.reviews?.length || 0} reviews • {item.comments_list?.length || 0} comments
                </span>
              </div>
            </div>
          </article>
        );
      }) : (
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-12 text-center shadow-xl space-y-2">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="text-lg font-bold text-neutral-300">No matching projects found</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto">Try adjusting your search keywords or selecting another category filter.</p>
        </div>
      )}

      {/* Write Review Report Modal */}
      {activeReviewItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-bold text-neutral-100">Submit Review Report</h3>
              <button 
                onClick={() => setActiveReviewItemId(null)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Reviewer Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Good)</option>
                  <option value={3}>3 Stars (Average)</option>
                  <option value={2}>2 Stars (Poor)</option>
                  <option value={1}>1 Star (Critical Issues)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Review & Suggestions</label>
                <textarea
                  required
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Detail your testing results, feedback, and improvement suggestions..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Specs Visual Canvas Environment Inputs */}
              <div className="border-t border-b border-neutral-800 py-4 my-2 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Review Environment Canvas</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-450 uppercase mb-1">Operating System</label>
                    <select
                      value={specsOs}
                      onChange={(e) => setSpecsOs(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="macOS">macOS</option>
                      <option value="Windows">Windows</option>
                      <option value="Linux">Linux</option>
                      <option value="iOS">iOS</option>
                      <option value="Android">Android</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-450 uppercase mb-1">Browser</label>
                    <select
                      value={specsBrowser}
                      onChange={(e) => setSpecsBrowser(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Chrome">Chrome</option>
                      <option value="Safari">Safari</option>
                      <option value="Firefox">Firefox</option>
                      <option value="Edge">Edge</option>
                      <option value="Opera">Opera</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-semibold text-neutral-450 uppercase mb-1">Resolution</label>
                    <input
                      type="text"
                      value={specsResolution}
                      onChange={(e) => setSpecsResolution(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testPassed}
                      onChange={(e) => setTestPassed(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-800 text-blue-600 focus:ring-blue-500 bg-neutral-950"
                    />
                    <span className="text-xs text-neutral-300 font-medium">All automated test cases & manual scenarios passed successfully</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Upload Screenshots / Media</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'screenshots')}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs file:mr-4 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {screenshotUrls.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {screenshotUrls.map((url, i) => (
                      <img key={i} src={url} alt="Uploaded" className="w-12 h-12 object-cover rounded border border-neutral-850" />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Upload Results File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'results')}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs file:mr-4 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {resultsFileUrl && (
                  <p className="text-xs text-green-400 mt-1">✓ Report uploaded</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Errors Logs / Messages came across</label>
                <textarea
                  rows={2}
                  value={errorLogs}
                  onChange={(e) => setErrorLogs(e.target.value)}
                  placeholder="Paste error logs, messages, or warnings here..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActiveReviewItemId(null)}
                  className="flex-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading Files...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
