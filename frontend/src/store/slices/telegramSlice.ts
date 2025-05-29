import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Telegram Web App types
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (buttonId: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showScanQrPopup(params: {
    text?: string;
  }, callback?: (text: string) => void): void;
  closeScanQrPopup(): void;
  readTextFromClipboard(callback?: (text: string) => void): void;
  requestWriteAccess(callback?: (granted: boolean) => void): void;
  requestContact(callback?: (granted: boolean) => void): void;
  invokeCustomMethod(method: string, params: any, callback?: (error: string, result: any) => void): void;
}

interface TelegramState {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isReady: boolean;
  isLoading: boolean;
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  viewportHeight: number;
  isExpanded: boolean;
  platform: string;
  version: string;
}

const initialState: TelegramState = {
  webApp: null,
  user: null,
  isReady: false,
  isLoading: true,
  initData: '',
  colorScheme: 'light',
  themeParams: {},
  viewportHeight: window.innerHeight,
  isExpanded: false,
  platform: 'unknown',
  version: '6.0',
};

// Async thunk to initialize Telegram Web App
export const initializeTelegramWebApp = createAsyncThunk(
  'telegram/initialize',
  async (_, { dispatch }) => {
    return new Promise<TelegramWebApp>((resolve, reject) => {
      // Check if we're running in Telegram
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const webApp = (window as any).Telegram.WebApp;

        // Initialize the web app
        webApp.ready();

        // Expand the web app
        webApp.expand();

        // Set up theme
        if (webApp.themeParams) {
          dispatch(setThemeParams(webApp.themeParams));
        }

        // Set up viewport change listener
        const handleViewportChange = () => {
          dispatch(setViewportHeight(webApp.viewportHeight));
          dispatch(setIsExpanded(webApp.isExpanded));
        };

        webApp.onEvent('viewportChanged', handleViewportChange);

        resolve(webApp);
      } else {
        // Mock Telegram Web App for development
        const mockWebApp = {
          initData: '',
          initDataUnsafe: {
            user: {
              id: 123456789,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'en',
            },
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash',
          },
          version: '6.0',
          platform: 'web',
          colorScheme: 'light' as const,
          themeParams: {
            bg_color: '#ffffff',
            text_color: '#000000',
            hint_color: '#707579',
            link_color: '#3390ec',
            button_color: '#3390ec',
            button_text_color: '#ffffff',
            secondary_bg_color: '#f7f7f7',
          },
          isExpanded: true,
          viewportHeight: window.innerHeight,
          viewportStableHeight: window.innerHeight,
          headerColor: '#3390ec',
          backgroundColor: '#ffffff',
          isClosingConfirmationEnabled: false,
          BackButton: {
            isVisible: false,
            show: () => {},
            hide: () => {},
            onClick: () => {},
            offClick: () => {},
          },
          MainButton: {
            text: '',
            color: '#3390ec',
            textColor: '#ffffff',
            isVisible: false,
            isActive: true,
            isProgressVisible: false,
            setText: () => {},
            onClick: () => {},
            offClick: () => {},
            show: () => {},
            hide: () => {},
            enable: () => {},
            disable: () => {},
            showProgress: () => {},
            hideProgress: () => {},
            setParams: () => {},
          },
          HapticFeedback: {
            impactOccurred: () => {},
            notificationOccurred: () => {},
            selectionChanged: () => {},
          },
          ready: () => {},
          expand: () => {},
          close: () => {},
          sendData: () => {},
          openLink: () => {},
          openTelegramLink: () => {},
          showPopup: () => {},
          showAlert: () => {},
          showConfirm: () => {},
          showScanQrPopup: () => {},
          closeScanQrPopup: () => {},
          readTextFromClipboard: () => {},
          requestWriteAccess: () => {},
          requestContact: () => {},
          invokeCustomMethod: () => {},
        } as TelegramWebApp;

        resolve(mockWebApp);
      }
    });
  }
);

const telegramSlice = createSlice({
  name: 'telegram',
  initialState,
  reducers: {
    setWebApp: (state, action: PayloadAction<TelegramWebApp>) => {
      state.webApp = action.payload;
      state.user = action.payload.initDataUnsafe.user || null;
      state.initData = action.payload.initData;
      state.colorScheme = action.payload.colorScheme;
      state.viewportHeight = action.payload.viewportHeight;
      state.isExpanded = action.payload.isExpanded;
      state.platform = action.payload.platform;
      state.version = action.payload.version;
    },
    setUser: (state, action: PayloadAction<TelegramUser | null>) => {
      state.user = action.payload;
    },
    setIsReady: (state, action: PayloadAction<boolean>) => {
      state.isReady = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setColorScheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.colorScheme = action.payload;
    },
    setThemeParams: (state, action: PayloadAction<Record<string, string>>) => {
      state.themeParams = action.payload;
    },
    setViewportHeight: (state, action: PayloadAction<number>) => {
      state.viewportHeight = action.payload;
    },
    setIsExpanded: (state, action: PayloadAction<boolean>) => {
      state.isExpanded = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeTelegramWebApp.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeTelegramWebApp.fulfilled, (state, action) => {
        state.webApp = action.payload;
        state.user = action.payload.initDataUnsafe.user || null;
        state.initData = action.payload.initData;
        state.colorScheme = action.payload.colorScheme;
        state.viewportHeight = action.payload.viewportHeight;
        state.isExpanded = action.payload.isExpanded;
        state.platform = action.payload.platform;
        state.version = action.payload.version;
        state.isReady = true;
        state.isLoading = false;
      })
      .addCase(initializeTelegramWebApp.rejected, (state) => {
        state.isLoading = false;
        state.isReady = false;
      });
  },
});

export const {
  setWebApp,
  setUser,
  setIsReady,
  setIsLoading,
  setColorScheme,
  setThemeParams,
  setViewportHeight,
  setIsExpanded,
} = telegramSlice.actions;

export default telegramSlice.reducer;
