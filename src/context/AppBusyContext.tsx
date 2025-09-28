import {createContext, useContext, useState, type ReactNode} from "react";

type AppBusyCtx = {
    isBusy: boolean;
    setBusy: (v: boolean) => void;
    toggleBusy: () => void;
};

const Ctx = createContext<AppBusyCtx | undefined>(undefined);

export function AppBusyProvider({children}: {children: ReactNode}) {
    const [isBusy, setIsBusy] = useState(false);
    return (
        <Ctx.Provider value={{ isBusy, setBusy: setIsBusy, toggleBusy: () => setIsBusy(v => !v) }}>
            {children}
        </Ctx.Provider>
    );
}

export function useAppBusy() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useAppBusy must be used within AppBusyProvider");
    return ctx;
}