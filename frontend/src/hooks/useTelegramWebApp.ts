import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { 
  setMainButtonConfig, 
  setBackButtonVisible, 
  setHapticFeedbackEnabled 
} from '../store/slices/uiSlice';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: any;
  MainButton: any;
  HapticFeedback: any;
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
  showPopup(params: any, callback?: (buttonId: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showScanQrPopup(params: any, callback?: (text: string) => void): void;
  closeScanQrPopup(): void;
  readTextFromClipboard(callback?: (text: string) => void): void;
  requestWriteAccess(callback?: (granted: boolean) => void): void;
  requestContact(callback?: (granted: boolean) => void): void;
  invokeCustomMethod(method: string, params: any, callback?: (error: string, result: any) => void): void;
}

export const useTelegramWebApp = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { webApp, isReady, isLoading } = useSelector((state: RootState) => state.telegram);
  const { hapticFeedbackEnabled, mainButtonConfig, backButtonVisible } = useSelector(
    (state: RootState) => state.ui
  );

  // Main Button controls
  const setMainButton = (config: {
    text?: string;
    isVisible?: boolean;
    isActive?: boolean;
    color?: string;
    onClick?: () => void;
  }) => {
    if (!webApp?.MainButton) return;

    const { text, isVisible, isActive, color, onClick } = config;

    // Update Redux state
    dispatch(setMainButtonConfig({
      text: text || mainButtonConfig.text,
      isVisible: isVisible !== undefined ? isVisible : mainButtonConfig.isVisible,
      isActive: isActive !== undefined ? isActive : mainButtonConfig.isActive,
      color: color || mainButtonConfig.color,
    }));

    // Update Telegram MainButton
    if (text) webApp.MainButton.setText(text);
    if (color) webApp.MainButton.setParams({ color });
    if (isActive !== undefined) {
      isActive ? webApp.MainButton.enable() : webApp.MainButton.disable();
    }
    if (isVisible !== undefined) {
      isVisible ? webApp.MainButton.show() : webApp.MainButton.hide();
    }
    if (onClick) {
      webApp.MainButton.offClick(); // Remove previous listeners
      webApp.MainButton.onClick(onClick);
    }
  };

  const showMainButton = (text: string, onClick?: () => void) => {
    setMainButton({ text, isVisible: true, isActive: true, onClick });
  };

  const hideMainButton = () => {
    setMainButton({ isVisible: false });
  };

  // Back Button controls
  const setBackButton = (isVisible: boolean, onClick?: () => void) => {
    if (!webApp?.BackButton) return;

    dispatch(setBackButtonVisible(isVisible));

    if (isVisible) {
      webApp.BackButton.show();
      if (onClick) {
        webApp.BackButton.offClick(); // Remove previous listeners
        webApp.BackButton.onClick(onClick);
      }
    } else {
      webApp.BackButton.hide();
    }
  };

  const showBackButton = (onClick?: () => void) => {
    setBackButton(true, onClick);
  };

  const hideBackButton = () => {
    setBackButton(false);
  };

  // Haptic Feedback
  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      if (hapticFeedbackEnabled && webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(style);
      }
    },
    notification: (type: 'error' | 'success' | 'warning' = 'success') => {
      if (hapticFeedbackEnabled && webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred(type);
      }
    },
    selection: () => {
      if (hapticFeedbackEnabled && webApp?.HapticFeedback) {
        webApp.HapticFeedback.selectionChanged();
      }
    },
  };

  // Utility functions
  const showAlert = (message: string, callback?: () => void) => {
    if (webApp?.showAlert) {
      webApp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  };

  const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
    if (webApp?.showConfirm) {
      webApp.showConfirm(message, callback);
    } else {
      const confirmed = confirm(message);
      callback?.(confirmed);
    }
  };

  const showPopup = (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (buttonId: string) => void) => {
    if (webApp?.showPopup) {
      webApp.showPopup(params, callback);
    } else {
      showAlert(params.message, () => callback?.('ok'));
    }
  };

  const openLink = (url: string, options?: { try_instant_view?: boolean }) => {
    if (webApp?.openLink) {
      webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const openTelegramLink = (url: string) => {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const sendData = (data: string | object) => {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    if (webApp?.sendData) {
      webApp.sendData(dataString);
    } else {
      console.log('Telegram WebApp sendData:', dataString);
    }
  };

  const close = () => {
    if (webApp?.close) {
      webApp.close();
    } else {
      window.close();
    }
  };

  const expand = () => {
    if (webApp?.expand) {
      webApp.expand();
    }
  };

  const readTextFromClipboard = (callback?: (text: string) => void) => {
    if (webApp?.readTextFromClipboard) {
      webApp.readTextFromClipboard(callback);
    } else if (navigator.clipboard?.readText) {
      navigator.clipboard.readText().then(callback).catch(() => callback?.(''));
    } else {
      callback?.('');
    }
  };

  const requestWriteAccess = (callback?: (granted: boolean) => void) => {
    if (webApp?.requestWriteAccess) {
      webApp.requestWriteAccess(callback);
    } else {
      callback?.(false);
    }
  };

  const requestContact = (callback?: (granted: boolean) => void) => {
    if (webApp?.requestContact) {
      webApp.requestContact(callback);
    } else {
      callback?.(false);
    }
  };

  // Theme utilities
  const getThemeParams = () => {
    return webApp?.themeParams || {};
  };

  const getColorScheme = () => {
    return webApp?.colorScheme || 'light';
  };

  // Platform detection
  const getPlatform = () => {
    return webApp?.platform || 'unknown';
  };

  const getVersion = () => {
    return webApp?.version || '6.0';
  };

  // Viewport utilities
  const getViewportHeight = () => {
    return webApp?.viewportHeight || window.innerHeight;
  };

  const isExpanded = () => {
    return webApp?.isExpanded || false;
  };

  return {
    // State
    webApp,
    isReady,
    isLoading,
    
    // Main Button
    setMainButton,
    showMainButton,
    hideMainButton,
    mainButtonConfig,
    
    // Back Button
    setBackButton,
    showBackButton,
    hideBackButton,
    backButtonVisible,
    
    // Haptic Feedback
    hapticFeedback,
    hapticFeedbackEnabled,
    setHapticFeedbackEnabled: (enabled: boolean) => 
      dispatch(setHapticFeedbackEnabled(enabled)),
    
    // Dialogs
    showAlert,
    showConfirm,
    showPopup,
    
    // Navigation
    openLink,
    openTelegramLink,
    sendData,
    close,
    expand,
    
    // Clipboard and permissions
    readTextFromClipboard,
    requestWriteAccess,
    requestContact,
    
    // Theme and appearance
    getThemeParams,
    getColorScheme,
    
    // Platform info
    getPlatform,
    getVersion,
    
    // Viewport
    getViewportHeight,
    isExpanded,
  };
};
