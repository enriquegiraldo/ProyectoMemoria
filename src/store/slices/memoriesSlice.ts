import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Memory, Comment, Reaction, MemoriesState, CreateMemoryData, UpdateMemoryData, CreateCommentData } from '../../types';
import { MemoriesService, MemoriesFilter } from '../../services/memoriesService';

export interface MemoriesState {
  memories: Memory[];
  comments: Comment[];
  reactions: Reaction[];
  currentMemory: Memory | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    tags: string[];
    mediaType: string[];
    dateRange: { start: string; end: string } | null;
  };
}

const initialState: MemoriesState = {
  memories: [],
  comments: [],
  reactions: [],
  currentMemory: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    tags: [],
    mediaType: [],
    dateRange: null,
  },
};

// Async thunks
export const fetchMemories = createAsyncThunk(
  'memories/fetchMemories',
  async (filter: MemoriesFilter, { rejectWithValue }) => {
    try {
      const response = await MemoriesService.getMemories(filter);
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Error al cargar las memorias');
      }

      return response.data as Memory[];
    } catch (error) {
      return rejectWithValue('Error inesperado al cargar las memorias');
    }
  }
);

export const createMemory = createAsyncThunk(
  'memories/createMemory',
  async (memoryData: CreateMemoryData, { rejectWithValue }) => {
    try {
      const response = await MemoriesService.createMemory(memoryData);
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Error al crear la memoria');
      }

      return response.data as Memory;
    } catch (error) {
      return rejectWithValue('Error inesperado al crear la memoria');
    }
  }
);

export const updateMemory = createAsyncThunk(
  'memories/updateMemory',
  async ({ id, memoryData }: { id: string; memoryData: Partial<Memory> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Error al actualizar la memoria');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Error de conexión');
    }
  }
);

export const deleteMemory = createAsyncThunk(
  'memories/deleteMemory',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        return rejectWithValue('Error al eliminar la memoria');
      }

      return id;
    } catch (error) {
      return rejectWithValue('Error de conexión');
    }
  }
);

export const addComment = createAsyncThunk(
  'memories/addComment',
  async (commentData: { content: string; memoryId: string; parentCommentId?: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Error al agregar el comentario');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Error de conexión');
    }
  }
);

export const addReaction = createAsyncThunk(
  'memories/addReaction',
  async (reactionData: { type: string; referenceId: string; referenceType: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reactionData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Error al agregar la reacción');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Error de conexión');
    }
  }
);

const memoriesSlice = createSlice({
  name: 'memories',
  initialState,
  reducers: {
    setCurrentMemory: (state, action: PayloadAction<Memory | null>) => {
      state.currentMemory = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<MemoriesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch memories
      .addCase(fetchMemories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMemories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.memories = action.payload.memories;
        state.comments = action.payload.comments;
        state.reactions = action.payload.reactions;
      })
      .addCase(fetchMemories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create memory
      .addCase(createMemory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMemory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.memories.unshift(action.payload);
      })
      .addCase(createMemory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update memory
      .addCase(updateMemory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMemory.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.memories.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.memories[index] = action.payload;
        }
        if (state.currentMemory?.id === action.payload.id) {
          state.currentMemory = action.payload;
        }
      })
      .addCase(updateMemory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete memory
      .addCase(deleteMemory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMemory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.memories = state.memories.filter(m => m.id !== action.payload);
        if (state.currentMemory?.id === action.payload) {
          state.currentMemory = null;
        }
      })
      .addCase(deleteMemory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      })
      // Add reaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const existingIndex = state.reactions.findIndex(
          r => r.userId === action.payload.userId && 
               r.referenceId === action.payload.referenceId &&
               r.referenceType === action.payload.referenceType
        );
        
        if (existingIndex !== -1) {
          state.reactions[existingIndex] = action.payload;
        } else {
          state.reactions.push(action.payload);
        }
      });
  },
});

export const { setCurrentMemory, setFilters, clearFilters, clearError } = memoriesSlice.actions;
export default memoriesSlice.reducer;
