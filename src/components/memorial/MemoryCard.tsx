// src/components/memorial/MemoryCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Memory, Comment, Reaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useMemories } from '../../hooks/useMemories';

interface MemoryCardProps {
  memory: Memory;
  viewMode?: 'grid' | 'list'; // Prop ya definida
  className?: string;
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: string) => void;
  onView?: (memory: Memory) => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  viewMode = 'grid', // Valor por defecto: grid
  className = '',
  onEdit,
  onDelete,
  onView,
}) => {
  const { canEdit, canComment, user } = useAuth();
  const { addNewComment, addNewReaction, getCommentsByMemoryId, getReactionsByReferenceId } = useMemories();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = getCommentsByMemoryId(memory.id);
  const reactions = getReactionsByReferenceId(memory.id);
  
  const userReaction = reactions.find(r => r.userId === user?.id);
  const likeCount = reactions.filter(r => r.type === 'LIKE').length;
  const heartCount = reactions.filter(r => r.type === 'HEART').length;
  const sadCount = reactions.filter(r => r.type === 'SAD').length;

  const handleReaction = async (type: 'LIKE' | 'HEART' | 'SAD') => {
    if (!user) return;
    
    try {
      await addNewReaction({
        type,
        referenceId: memory.id,
        referenceType: 'MEMORY',
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addNewComment({
        content: newComment,
        memoryId: memory.id,
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderMedia = () => {
    switch (memory.mediaType) {
      case 'IMAGE':
        return (
          <motion.img
            src={memory.mediaUrl}
            alt={memory.title}
            className={`w-full ${viewMode === 'list' ? 'h-32' : 'h-48'} object-cover ${viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-l-lg'}`}
            whileHover={{ scale: 1.02 }}
            onClick={() => onView?.(memory)}
          />
        );
      
      case 'VIDEO':
        return (
          <div className={`relative w-full ${viewMode === 'list' ? 'h-32' : 'h-48'} bg-gray-900 ${viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-l-lg'} overflow-hidden`}>
            <video
              src={memory.mediaUrl}
              className="w-full h-full object-cover"
              controls={false}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => {
                  const video = document.querySelector(`video[src="${memory.mediaUrl}"]`) as HTMLVideoElement;
                  if (video) {
                    if (isPlaying) {
                      video.pause();
                    } else {
                      video.play();
                    }
                  }
                }}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
              </button>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        );
      
      case 'AUDIO':
        return (
          <div className={`w-full ${viewMode === 'list' ? 'h-20' : 'h-24'} bg-gradient-to-r from-blue-500 to-purple-600 ${viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-l-lg'} flex items-center justify-center`}>
            <div className="text-center text-white">
              <Volume2 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">{memory.title}</p>
              <audio
                src={memory.mediaUrl}
                controls
                className="mt-2 w-full max-w-xs"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'} ${className}`}
    >
      {renderMedia()}
      
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {memory.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Por {memory.authorName} • {formatDate(memory.createdAt)} {/* Cambiado de memory.date a memory.createdAt */}
            </p>
          </div>
          
          {canEdit() && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit?.(memory)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete?.(memory.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-4 line-clamp-3">
          {memory.description}
        </p>

        {memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {memory.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleReaction('LIKE')}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                userReaction?.type === 'LIKE' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <span>👍</span>
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={() => handleReaction('HEART')}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                userReaction?.type === 'HEART' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>{heartCount}</span>
            </button>
            
            <button
              onClick={() => handleReaction('SAD')}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                userReaction?.type === 'SAD' ? 'text-yellow-600' : 'text-gray-500 hover:text-yellow-600'
              }`}
            >
              <span>😢</span>
              <span>{sadCount}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length}</span>
            </button>
            
            <button className="text-gray-500 hover:text-gray-700">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>

            {canComment() && (
              <form onSubmit={handleComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MemoryCard;