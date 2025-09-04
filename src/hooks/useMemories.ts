// src/hooks/useMemories.ts
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
import { Memory, Comment, Reaction, CreateMemoryData } from '../types';

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

  const loadMemories = async (params: { pageId?: string; page: number; limit: number; search?: string; mediaType?: string; tags?: string[]; sortBy?: string }) => {
    return await dispatch(fetchMemories(params));
  };
  

  // Corregido: createMemory espera CreateMemoryData, no FormData
  const createNewMemory = async (memoryData: CreateMemoryData) => {
    return await dispatch(createMemory(memoryData));
  };

  const updateExistingMemory = async (id: string, memoryData: Partial<Memory>) => {  //aqii antes CreateMemoryData
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

  const setMemory = (memory: Memory | null) => {
    dispatch(setCurrentMemory(memory));
  };

  const updateFilters = (newFilters: Partial<RootState['memories']['filters']>) => {
    dispatch(setFilters(newFilters));
  };

  const resetFilters = () => {
    dispatch(clearFilters());
  };

  const clearMemoriesError = () => {
    dispatch(clearError());
  };

  // Helper functions
  const getMemoryById = (id: string): Memory | undefined => {
    return memories.find((memory: Memory) => memory.id === id);
  };

  const getCommentsByMemoryId = (memoryId: string): Comment[] => {
    return comments.filter((comment: Comment) => comment.memoryId === memoryId);
  };

  const getReactionsByReferenceId = (referenceId: string): Reaction[] => {
    return reactions.filter((reaction: Reaction) => reaction.referenceId === referenceId);
  };

  const getFilteredMemories = (): Memory[] => {
    let filtered: Memory[] = [...memories];

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
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(memory =>
        filters.tags.some(tag => memory.tags.includes(tag))
      );
    }

    // Media type filter
    if (filters.mediaType) {
      filtered = filtered.filter(memory => memory.mediaType === filters.mediaType);//otra posible correccion
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(memory => {
        const memoryDate = new Date(memory.createdAt); // Corregido: usar createdAt en lugar de date
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return memoryDate >= startDate && memoryDate <= endDate;
      });
    }

    return filtered;
  };

  const getMemoriesByType = (type: 'IMAGE' | 'VIDEO' | 'AUDIO'): Memory[] => {
    return memories.filter((memory: Memory) => memory.mediaType === type);
  };

  const getRecentMemories = (limit: number = 10): Memory[] => {
    return memories
      .sort((a: Memory, b: Memory) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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