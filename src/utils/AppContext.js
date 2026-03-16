import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  isOnboarded: false,
  user: {
    name: '',
    voicePersonality: 'Warm & Friendly',
    streakDays: 0,
    totalConversations: 0,
    xpPoints: 0,
    level: 1,
    milestones: [],
    signLanguage: 'NSL',
    lastActiveDate: null,   // ISO string — used for streak tracking
  },
  caregiver: { name: '', phone: '', relationship: '' },
  settings: {
    hapticEnabled:    true,
    dangerAlerts:     true,
    speechAlerts:     true,
    domesticAlerts:   true,
    ambientAlerts:    true,   // was missing — MyEarsScreen needs this
    fontSize:         'medium',
    highContrast:     false,
    downloadedPacks:  [],     // tracks which LanguagePacks are installed
  },
  soundAlerts:       [],
  conversations:     [],
  emergencyContacts: [],
};

function updateStreak(user) {
  const today = new Date().toDateString();
  const last  = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
  if (last === today) return user; // already active today, no change

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = last === yesterday.toDateString();

  return {
    ...user,
    streakDays:     wasYesterday ? user.streakDays + 1 : 1,
    lastActiveDate: new Date().toISOString(),
  };
}

function reducer(state, action) {
  switch (action.type) {

    case 'COMPLETE_ONBOARDING':
      return { ...state, isOnboarded: true, user: updateStreak(state.user) };

    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'ADD_XP': {
      const newXP = state.user.xpPoints + action.payload;
      return {
        ...state,
        user: {
          ...updateStreak(state.user),
          xpPoints: newXP,
          level: Math.floor(newXP / 500) + 1,
        },
      };
    }

    case 'ADD_MILESTONE': {
      // Prevent duplicate milestones
      const alreadyHas = state.user.milestones.some(m => m.id === action.payload.id);
      if (alreadyHas) return state;
      return {
        ...state,
        user: {
          ...state.user,
          milestones: [...state.user.milestones, action.payload],
          xpPoints:   state.user.xpPoints + (action.payload.xp || 0),
          level:      Math.floor((state.user.xpPoints + (action.payload.xp || 0)) / 500) + 1,
        },
      };
    }

    case 'INCREMENT_CONVERSATIONS': {
      const newCount = state.user.totalConversations + 1;
      return {
        ...state,
        user: {
          ...updateStreak(state.user),
          totalConversations: newCount,
        },
      };
    }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'ADD_ALERT':
      return { ...state, soundAlerts: [action.payload, ...state.soundAlerts].slice(0, 100) };

    case 'ADD_CONVERSATION':
      return { ...state, conversations: [action.payload, ...state.conversations].slice(0, 200) };

    case 'SET_EMERGENCY_CONTACTS':
      return { ...state, emergencyContacts: action.payload };

    case 'SET_CAREGIVER':
      return { ...state, caregiver: action.payload };

    case 'TICK_STREAK':
      return { ...state, user: updateStreak(state.user) };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Persist key state on every change ─────────────────────────────────────
  useEffect(() => {
    AsyncStorage.setItem('kira_state', JSON.stringify({
      isOnboarded:       state.isOnboarded,
      user:              state.user,
      caregiver:         state.caregiver,
      settings:          state.settings,
      emergencyContacts: state.emergencyContacts,
    })).catch(() => {});
  }, [state]);

  // ── Rehydrate persisted state on launch ───────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('kira_state').then(data => {
      if (!data) return;
      try {
        const saved = JSON.parse(data);
        if (saved.isOnboarded)             dispatch({ type: 'COMPLETE_ONBOARDING' });
        if (saved.user)                    dispatch({ type: 'SET_USER',              payload: saved.user });
        if (saved.caregiver?.name)         dispatch({ type: 'SET_CAREGIVER',         payload: saved.caregiver });
        if (saved.settings)                dispatch({ type: 'SET_SETTINGS',          payload: saved.settings });
        if (saved.emergencyContacts?.length) dispatch({ type: 'SET_EMERGENCY_CONTACTS', payload: saved.emergencyContacts });
      } catch {}
    }).catch(() => {});
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};