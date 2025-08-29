"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, MessageSquare, Loader2 } from "lucide-react";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  onCommentCreated: () => void;
}

interface CommentFormData {
  content: string;
  isPublic: boolean;
}

export default function CommentModal({ isOpen, onClose, campaignId, onCommentCreated }: CommentModalProps) {
  const [formData, setFormData] = useState<CommentFormData>({
    content: "",
    isPublic: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CommentFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create comment");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to create comment");
      }

      // Reset form and close modal
      setFormData({
        content: "",
        isPublic: true,
      });
      onCommentCreated();
      onClose();
      
    } catch (err) {
      console.error("Error creating comment:", err);
      setError(err instanceof Error ? err.message : "Failed to create comment");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        content: "",
        isPublic: true,
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-[#104901] rounded-3xl blur opacity-20"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#104901]">Add Comment</h2>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={saving}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#104901] mb-2">
                Your Comment *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Share your thoughts, encouragement, or questions about this campaign..."
                rows={6}
                className="rounded-xl border-gray-300 focus:border-[#104901] focus:ring-[#104901]"
                required
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">
                Keep your comment respectful and supportive. Maximum 1000 characters.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleInputChange("isPublic", checked as boolean)}
                className="border-[#104901] text-[#104901] focus:ring-[#104901]"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this comment public (visible to all supporters)
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
                className="text-[#104901] border-[#104901] hover:bg-[#104901] hover:text-white rounded-xl px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.content.trim()}
                className="bg-gradient-to-r from-green-600 to-[#104901] text-white rounded-xl px-8 py-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Posting Comment...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
