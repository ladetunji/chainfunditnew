import React, { useState, useEffect } from 'react'
import { useCampaignComments } from '@/hooks/use-campaigns';
import { Loader2, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

type Props = {}

const Comments = (props: Props) => {
  // For now, we'll use a mock campaign ID. In a real app, you'd get this from context or props
  const mockCampaignId = "mock-campaign-id";
  const { comments, loading, error, fetchComments, createComment } = useCampaignComments(mockCampaignId);
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await createComment(newComment);
    setNewComment('');
  };

  // Component to render user avatar for comments
  const CommentAvatar = ({ userName, userAvatar }: { userName: string; userAvatar?: string }) => {
    if (userAvatar) {
      return (
        <Image
          src={userAvatar}
          alt={userName}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-10 h-10 bg-[#E5ECDE] rounded-full flex items-center justify-center">
        <User className="h-5 w-5 text-[#104901]" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#104901]" />
        <span className="ml-2 text-lg text-[#104901]">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Error loading comments: {error}</p>
          <button 
            onClick={() => fetchComments()}
            className="px-4 py-2 bg-[#104901] text-white rounded-lg hover:bg-[#0a3a01]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="2xl:container 2xl:mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-[#104901]" />
        <h3 className="text-2xl font-semibold text-[#104901]">Comments</h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-4 border border-[#D9D9D9] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#104901]"
          rows={3}
        />
        <Button 
          type="submit" 
          disabled={!newComment.trim()}
          className="bg-[#104901] text-white hover:bg-[#0a3a01]"
        >
          Post Comment
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-[#C0BFC4] mx-auto mb-4" />
            <p className="text-lg text-[#757575]">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-[#D9D9D9] rounded-lg p-4 bg-white">
              <div className="flex items-start gap-3">
                <CommentAvatar userName={comment.userName} userAvatar={comment.userAvatar} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-[#104901]">{comment.userName}</span>
                    <span className="text-sm text-[#757575]">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[#104901]">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Comments