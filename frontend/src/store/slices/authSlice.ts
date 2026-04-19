import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    plan: string;
    primaryColor?: string;
  } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: Cookies.get("accessToken") || null,
  refreshToken: Cookies.get("refreshToken") || null,
  user: null,
  tenant: null,
  isAuthenticated: !!Cookies.get("accessToken"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      user: AuthState["user"];
      tenant: AuthState["tenant"];
    }>) => {
      const { accessToken, refreshToken, user, tenant } = action.payload;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.tenant = tenant;
      state.isAuthenticated = true;
      Cookies.set("accessToken", accessToken, { expires: 1 / 96 }); // 15 min
      Cookies.set("refreshToken", refreshToken, { expires: 7 });
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      Cookies.set("accessToken", action.payload, { expires: 1 / 96 });
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.tenant = null;
      state.isAuthenticated = false;
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
    },
    setUser: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, updateToken, logout, setUser } = authSlice.actions;
export default authSlice.reducer;
