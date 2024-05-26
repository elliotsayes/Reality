import { PermissionType } from "./aoWallet"

export const requiredPermissions: Array<PermissionType> = [
  "ACCESS_ADDRESS",
  "SIGN_TRANSACTION",
  // "ACCESS_PUBLIC_KEY",
  // "ENCRYPT",
  // "DECRYPT",
  "SIGNATURE",
  "ACCESS_ARWEAVE_CONFIG",
]

export const requestedPermissions = [
  ...requiredPermissions,
  // ...optionalPermissions,
]
