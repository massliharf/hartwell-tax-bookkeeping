import { createContext, useContext } from "react";

export type ClientDrawerTarget = { clientId: string; appointmentId?: string };
export const ClientDrawerContext = createContext<(target: ClientDrawerTarget) => void>(() => {});
export const useClientDrawer = () => useContext(ClientDrawerContext);
