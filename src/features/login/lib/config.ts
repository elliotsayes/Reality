import { ConnectConfig } from "@/features/ao/lib/aoWallet";
import { permissionsRequested, permissionsRequired } from "@/features/ao/lib/config";

export const connectConfig: ConnectConfig = {
  permissionsRequested,
  permissionsRequired,
  appInfo: {
    name: "WeaveWorld",
    // TODO: Add logo
    // logo: 
  },
}

export const localKeyLocalStorageKey = "tempArweaveKey";
