
import { createContext, useContext } from "react";

interface EditPermissionContextType {
  canEdit: boolean;
}

const EditPermissionContext = createContext<EditPermissionContextType>({ canEdit: true });

export const EditPermissionProvider = EditPermissionContext.Provider;

export function useEditPermission() {
  return useContext(EditPermissionContext);
}
