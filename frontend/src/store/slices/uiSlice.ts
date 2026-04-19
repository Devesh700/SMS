import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── UI Slice ─────────────────────────────────────────────────────────────────
interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  isLoading: boolean;
}

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarCollapsed: false,
    theme: "light" as const,
    isLoading: false,
  } as UIState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => { state.sidebarCollapsed = action.payload; },
    setTheme: (state, action: PayloadAction<UIState["theme"]>) => { state.theme = action.payload; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setTheme, setLoading } = uiSlice.actions;
export default uiSlice.reducer;
