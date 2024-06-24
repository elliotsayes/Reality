import { PermissionType } from "./aoWallet";

export const permissionsRequired: Array<PermissionType> = [
  "ACCESS_ADDRESS",
  "SIGN_TRANSACTION",
  // "ACCESS_PUBLIC_KEY",
  // "ENCRYPT",
  // "DECRYPT",
  "SIGNATURE",
  "ACCESS_ARWEAVE_CONFIG",
];

export const permissionsRequested = [
  ...permissionsRequired,
  // ...optionalPermissions,
];
