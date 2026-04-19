"use client";
import { useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ThemeProvider } from "next-themes";
import { SocketProvider } from "./SocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <SocketProvider>
          {children}
        </SocketProvider>
      </ThemeProvider>
    </Provider>
  );
}
