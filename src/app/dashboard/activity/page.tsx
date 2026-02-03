'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Filter, Search } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ActivityEvent {
  id: string;
  tool: string;
  status: 'success' | 'error' | 'pending';
  created_at: string;
  credits_used: number;
  metadata?: any;
}

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [filter, search, page]);

  const loadActivities = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('usage_events')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (search) {
        query = query.ilike('tool', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (page === 1) {
        setActivities(data || []);
      } else {
        setActivities(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === 20);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredActivities = activities.filter(activity => {
    if (filter !== 'all' && activity.status !== filter) return false;
    if (search && !activity.tool.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Activity History</h1>
          <p className="text-muted-foreground">Complete history of your AI tool usage</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'success', 'error', 'pending'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by tool name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div 
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7) 0%, rgba(10, 10, 20, 0.85) 100%)',
          border: '1px solid rgba(138, 43, 226, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {loading && page === 1 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activities found</p>
          </div>
        ) : (
          <>
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(25, 25, 40, 0.8) 0%, rgba(15, 15, 28, 0.9) 100%)',
                  border: '1px solid rgba(138, 43, 226, 0.15)',
                }}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(activity.status)}
                  <div>
                    <h3 className="font-medium text-foreground capitalize">
                      {activity.tool.replace(/-/g, ' ')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {activity.credits_used} credits
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {activity.status}
                  </p>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}