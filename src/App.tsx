import { ArweaveWalletKit } from "arweave-wallet-kit";
import { ArweaveKitDemo } from "./features/ao/components/ArweaveKitDemo";

export function App() {
  return (
    <ArweaveWalletKit
      config={{
        // TODO: Confirm whether all of these are necessart
        permissions: [
          "ACCESS_ADDRESS",
          "SIGN_TRANSACTION",
          // "ACCESS_PUBLIC_KEY",
          // "ENCRYPT",
          // "DECRYPT",
          "SIGNATURE",
          "ACCESS_ARWEAVE_CONFIG",
        ],
        ensurePermissions: true,
        appInfo: {
          name: "WeaveWorld",
          // TODO: Logo
          // logo:
        },
        // gatewayConfig: {},
      }}
      theme={{
        displayTheme: "light",
        // TODO: Customize
        // https://github.com/labscommunity/arweave-wallet-kit?tab=readme-ov-file#custom-theme
      }}
    >
      <ArweaveKitDemo />
    </ArweaveWalletKit>
  )
}
