import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Library, Clapperboard, Calendar, Clock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDuration, relativeDate } from '@/lib/lectureUtils';

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Function to create highlighted snippet
function createSnippet(text, query, maxLength = 50) {
  if (!text || !query) return { snippet: '', highlighted: false };
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return { snippet: text.substring(0, maxLength * 2) + '...', highlighted: false };
  
  const start = Math.max(0, index - maxLength);
  const end = Math.min(text.length, index + query.length + maxLength);
  
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return { snippet, highlighted: true, matchIndex: index - start + (start > 0 ? 3 : 0) };
}

// Function to highlight matching text
function highlightText(text, query) {
  if (!query) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 font-semibold rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [lectures, setLectures] = useState([]);
  const [digests, setDigests] = useState([]);
  const [transcriptMap, setTranscriptMap] = useState({});
  const [loading, setLoading] = useState(true);
  const debouncedQuery = useDebounce(query, 300);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [lecturesData, digestsData, transcriptsData] = await Promise.all([
          base44.entities.Lecture.list('-created_date', 200),
          base44.entities.Digest.list('-created_date', 200),
          base44.entities.Transcript.filter({}, 'timestamp', 2000),
        ]);
        
        // Build transcript map: lecture_id -> full transcript text
        const tMap = {};
        (transcriptsData || []).forEach(t => {
          if (!tMap[t.lecture_id]) tMap[t.lecture_id] = '';
          tMap[t.lecture_id] += (t.text || '') + ' ';
        });
        
        setLectures(lecturesData || []);
        setDigests(digestsData || []);
        setTranscriptMap(tMap);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Search and filter results
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { lectures: [], digests: [], total: 0 };
    }

    const q = debouncedQuery.toLowerCase();
    
    // Search lectures
    const matchedLectures = lectures
      .map(lecture => {
        let matchField = null;
        let snippet = '';
        
        // Check title
        if (lecture.title?.toLowerCase().includes(q)) {
          matchField = 'title';
          const result = createSnippet(lecture.title, debouncedQuery, 50);
          snippet = result.snippet;
        }
        // Check description
        else if (lecture.description?.toLowerCase().includes(q)) {
          matchField = 'description';
          const result = createSnippet(lecture.description, debouncedQuery, 50);
          snippet = result.snippet;
        }
        // Check transcript
        else if (transcriptMap[lecture.id]) {
          const transcriptText = transcriptMap[lecture.id];
          if (transcriptText.toLowerCase().includes(q)) {
            matchField = 'transcript';
            const result = createSnippet(transcriptText, debouncedQuery, 50);
            snippet = result.snippet;
          }
        }
        // Check course
        if (!matchField && lecture.course?.toLowerCase().includes(q)) {
          matchField = 'course';
          snippet = lecture.course;
        }
        // Check tags
        if (!matchField && lecture.tags?.some(tag => tag.toLowerCase().includes(q))) {
          matchField = 'tags';
          const matchedTag = lecture.tags.find(tag => tag.toLowerCase().includes(q));
          snippet = `Tag: ${matchedTag}`;
        }
        
        if (matchField) {
          return { ...lecture, matchField, snippet };
        }
        return null;
      })
      .filter(Boolean);

    // Search digests
    const matchedDigests = digests
      .map(digest => {
        let matchField = null;
        let snippet = '';
        
        // Check title
        if (digest.title?.toLowerCase().includes(q)) {
          matchField = 'title';
          const result = createSnippet(digest.title, debouncedQuery, 50);
          snippet = result.snippet;
        }
        // Check content
        else if (digest.content?.toLowerCase().includes(q)) {
          matchField = 'content';
          const result = createSnippet(digest.content, debouncedQuery, 50);
          snippet = result.snippet;
        }
        // Check lecture title (for digest's parent lecture)
        else if (digest.lecture_title?.toLowerCase().includes(q)) {
          matchField = 'lecture';
          snippet = digest.lecture_title;
        }
        
        if (matchField) {
          return { ...digest, matchField, snippet };
        }
        return null;
      })
      .filter(Boolean);

    return {
      lectures: matchedLectures,
      digests: matchedDigests,
      total: matchedLectures.length + matchedDigests.length,
    };
  }, [debouncedQuery, lectures, digests, transcriptMap]);

  const isSearching = query !== debouncedQuery;
  const hasQuery = debouncedQuery.trim().length > 0;
  const hasResults = searchResults.total > 0;

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Search</h1>
          <p className="text-muted-foreground text-sm">
            Search across lecture titles, transcripts, topics, and digests.
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder='Try "normalization"...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-14 text-lg"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !hasQuery ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Start typing to search your lectures.
            </p>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground text-center">
              No matches for "{debouncedQuery}". Try a different search term.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{searchResults.total}</span> result{searchResults.total !== 1 ? 's' : ''} for "{debouncedQuery}"
            </div>

            {/* Lectures Section */}
            {searchResults.lectures.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Library className="w-5 h-5" />
                  Lectures ({searchResults.lectures.length})
                </h2>
                <div className="space-y-3">
                  {searchResults.lectures.map(lecture => (
                    <Card 
                      key={lecture.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/lectures/${lecture.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="shrink-0">
                            {lecture.thumbnail_url ? (
                              <img 
                                src={lecture.thumbnail_url} 
                                alt={lecture.title}
                                className="w-24 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                                <Library className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1 hover:text-primary transition-colors">
                              {highlightText(lecture.title, debouncedQuery)}
                            </h3>
                            
                            {lecture.snippet && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {highlightText(lecture.snippet, debouncedQuery)}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              {lecture.course && (
                                <span className="flex items-center gap-1">
                                  <Library className="w-3 h-3" />
                                  {lecture.course}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {relativeDate(lecture.created_date)}
                              </span>
                              {lecture.duration > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(lecture.duration)}
                                </span>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {lecture.matchField === 'transcript' ? 'Found in transcript' : 
                                 lecture.matchField === 'tags' ? 'Found in tags' :
                                 lecture.matchField === 'course' ? 'Found in course' :
                                 lecture.matchField === 'description' ? 'Found in description' :
                                 'Found in title'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Digests Section */}
            {searchResults.digests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clapperboard className="w-5 h-5" />
                  Digests ({searchResults.digests.length})
                </h2>
                <div className="space-y-3">
                  {searchResults.digests.map(digest => (
                    <Card 
                      key={digest.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/digests/${digest.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="shrink-0">
                            <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                              <Clapperboard className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1 hover:text-primary transition-colors">
                              {highlightText(digest.title, debouncedQuery)}
                            </h3>
                            
                            {digest.snippet && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {highlightText(digest.snippet, debouncedQuery)}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              {digest.lecture_title && (
                                <span className="flex items-center gap-1">
                                  <Library className="w-3 h-3" />
                                  {digest.lecture_title}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {relativeDate(digest.created_date)}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {digest.matchField === 'content' ? 'Found in content' :
                                 digest.matchField === 'lecture' ? 'Found in lecture name' :
                                 'Found in title'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
