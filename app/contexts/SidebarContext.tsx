"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarCtxType = {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

const SidebarCtx = createContext<SidebarCtxType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <SidebarCtx.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export const useSidebar = () => useContext(SidebarCtx);
