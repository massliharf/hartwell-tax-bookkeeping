import { createContext, useContext } from "react";

/** The only side panel in the owner app: one appointment. */
export type ApptPanelTarget = { appointmentId: string };
export const ApptPanelContext = createContext<(target: ApptPanelTarget) => void>(() => {});
export const useApptPanel = () => useContext(ApptPanelContext);
