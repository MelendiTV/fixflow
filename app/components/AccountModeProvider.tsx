"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AccountRole = "customer" | "provider" | "admin";
type AccountMode = "customer" | "provider";

type AccountModeContextType = {
  mode: AccountMode;
  setMode: (mode: AccountMode) => void;
  canUseProviderMode: boolean;
  setAccountRole: (role: AccountRole) => void;
};

const AccountModeContext =
  createContext<AccountModeContextType | null>(null);

const STORAGE_KEY = "relydo_account_mode";

export function AccountModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [accountRole, setAccountRole] =
    useState<AccountRole>("customer");

  const [mode, setModeState] =
    useState<AccountMode>("customer");

  const canUseProviderMode =
    accountRole === "provider";

  useEffect(() => {
    const savedMode =
      window.localStorage.getItem(STORAGE_KEY);

    if (accountRole === "provider") {
      const providerMode: AccountMode =
        savedMode === "customer"
          ? "customer"
          : "provider";

      setModeState(providerMode);

      window.localStorage.setItem(
        STORAGE_KEY,
        providerMode
      );

      return;
    }

    setModeState("customer");

    window.localStorage.setItem(
      STORAGE_KEY,
      "customer"
    );
  }, [accountRole]);

  function setMode(
    nextMode: AccountMode
  ) {
    if (
      nextMode === "provider" &&
      !canUseProviderMode
    ) {
      return;
    }

    setModeState(nextMode);

    window.localStorage.setItem(
      STORAGE_KEY,
      nextMode
    );
  }

  return (
    <AccountModeContext.Provider
      value={{
        mode,
        setMode,
        canUseProviderMode,
        setAccountRole,
      }}
    >
      {children}
    </AccountModeContext.Provider>
  );
}

export function useAccountMode() {
  const context =
    useContext(AccountModeContext);

  if (!context) {
    throw new Error(
      "useAccountMode must be used inside AccountModeProvider"
    );
  }

  return context;
}