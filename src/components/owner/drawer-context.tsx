import { createContext, useContext } from "react";

export type ClientDrawerTarget = { clientId: string; appointmentId?: string | undefined };
export const ClientDrawerContext = createContext<(target: ClientDrawerTarget) => void>(() => {});
export const useClientDrawer = () => useContext(ClientDrawerContext);
