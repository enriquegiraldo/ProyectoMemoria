import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  addComment,
  addReaction,
  setCurrentMemory,
  setFilters,
  clearFilters,
  clearError,
} from '../store/slices/memoriesSlice';

export const useMemories = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    memories,
    comments,
    reactions,
    currentMemory,
    isLoading,
    error,
    filters,
  } = useSelector((state: RootState) => state.memories);

  const loadMemories = async (pageId: string) => {
    return await dispatch(fetchMemories(pageId));
  };

  const createNewMemory = async (memoryData: FormData) => {
    return await dispatch(createMemory(memoryData));
  };

  const updateExistingMemory = async (id: string, memoryData: any) => {
    return await dispatch(updateMemory({ id, memoryData }));
  };

  const deleteExistingMemory = async (id: string) => {
    return await dispatch(deleteMemory(id));
  };

  const addNewComment = async (commentData: { content: string; memoryId: string; parentCommentId?: string }) => {
    return await dispatch(addComment(commentData));
  };

  const addNewReaction = async (reactionData: { type: string; referenceId: string; referenceType: string }) => {
    return await dispatch(addReaction(reactionData));
  };

  const setMemory = (memory: any) => {
    dispatch(setCurrentMemory(memory));
  };

  const updateFilters = (newFilters: any) => {
    dispatch(setFilters(newFilters));
  };

  const resetFilters = () => {
    dispatch(clearFilters());
  };

  const clearMemoriesError = () => {
    dispatch(clearError());
  };

  // Helper functions
  const getMemoryById = (id: string) => {
    return memories.find(memory => memory.id === id);
  };

  const getCommentsByMemoryId = (memoryId: string) => {
    return comments.filter(comment => comment.memoryId === memoryId);
  };

  const getReactionsByReferenceId = (referenceId: string) => {
    return reactions.filter(reaction => reaction.referenceId === referenceId);
  };

  const getFilteredMemories = () => {
    let filtered = [...memories];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(memory =>
        memory.title.toLowerCase().includes(searchLower) ||
        memory.description.toLowerCase().includes(searchLower) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(memory =>
        filters.tags.some(tag => memory.tags.includes(tag))
      );
    }

    // Media type filter
    if (filters.mediaType.length > 0) {
      filtered = filtered.filter(memory =>
        filters.mediaType.includes(memory.mediaType)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(memory => {
        const memoryDate = new Date(memory.date);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return memoryDate >= startDate && memoryDate <= endDate;
      });
    }

    return filtered;
  };

  const getMemoriesByType = (type: 'IMAGE' | 'VIDEO' | 'AUDIO') => {
    return memories.filter(memory => memory.mediaType === type);
  };

  const getRecentMemories = (limit: number = 10) => {
    return memories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  return {
    // State
    memories,
    comments,
    reactions,
    currentMemory,
    isLoading,
    error,
    filters,
    
    // Actions
    loadMemories,
    createNewMemory,
    updateExistingMemory,
    deleteExistingMemory,
    addNewComment,
    addNewReaction,
    setMemory,
    updateFilters,
    resetFilters,
    clearMemoriesError,
    
    // Helpers
    getMemoryById,
    getCommentsByMemoryId,
    getReactionsByReferenceId,
    getFilteredMemories,
    getMemoriesByType,
    getRecentMemories,
  };
};
