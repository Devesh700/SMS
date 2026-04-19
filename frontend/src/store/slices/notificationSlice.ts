import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
}

const notificationSlice = createSlice({
  name: "notifications",
  initialState: { items: [], unreadCount: 0 } as NotificationState,
  reducers: {
    setNotifications: (state, action: PayloadAction<{ notifications: AppNotification[]; unreadCount: number }>) => {
      state.items = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.items.find((i) => i.id === action.payload);
      if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
    markAllRead: (state) => {
      state.items.forEach((i) => { i.isRead = true; });
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, markRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
