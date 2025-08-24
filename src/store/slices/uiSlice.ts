import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ModalState {
  isOpen: boolean;
  type: 'login' | 'register' | 'memory' | 'comment' | 'upload' | 'settings' | null;
  data?: any;
}

export interface UIState {
  modal: ModalState;
  sidebar: {
    isOpen: boolean;
  };
  loading: {
    global: boolean;
    upload: boolean;
  };
  notifications: {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration: number;
  };
  theme: {
    mode: 'light' | 'dark';
    primaryColor: string;
    secondaryColor: string;
  };
}

const initialState: UIState = {
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  sidebar: {
    isOpen: false,
  },
  loading: {
    global: false,
    upload: false,
  },
  notifications: {
    show: false,
    type: 'info',
    message: '',
    duration: 5000,
  },
  theme: {
    mode: 'light',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action: PayloadAction<{ type: ModalState['type']; data?: any }>) => {
      state.modal.isOpen = true;
      state.modal.type = action.payload.type;
      state.modal.data = action.payload.data;
    },
    closeModal: (state) => {
      state.modal.isOpen = false;
      state.modal.type = null;
      state.modal.data = null;
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    openSidebar: (state) => {
      state.sidebar.isOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebar.isOpen = false;
    },
    
    // Loading actions
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setUploadLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.upload = action.payload;
    },
    
    // Notification actions
    showNotification: (state, action: PayloadAction<{
      type: UIState['notifications']['type'];
      message: string;
      duration?: number;
    }>) => {
      state.notifications.show = true;
      state.notifications.type = action.payload.type;
      state.notifications.message = action.payload.message;
      state.notifications.duration = action.payload.duration || 5000;
    },
    hideNotification: (state) => {
      state.notifications.show = false;
    },
    
    // Theme actions
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme.mode = action.payload;
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.theme.primaryColor = action.payload;
    },
    setSecondaryColor: (state, action: PayloadAction<string>) => {
      state.theme.secondaryColor = action.payload;
    },
    setTheme: (state, action: PayloadAction<Partial<UIState['theme']>>) => {
      state.theme = { ...state.theme, ...action.payload };
    },
  },
});

export const {
  openModal,
  closeModal,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  setGlobalLoading,
  setUploadLoading,
  showNotification,
  hideNotification,
  setThemeMode,
  setPrimaryColor,
  setSecondaryColor,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
