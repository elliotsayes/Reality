import { base32, base64urlnopad } from "@scure/base";
import Arweave from "arweave";

export const defaultArweave = Arweave.init({});

export function fetchUrl(txId: string) {
  const txIdData = base64urlnopad.decode(txId);
  const base32UnpaddedTxId = base32.encode(txIdData).replace(/=/g, "");
  return `https://${base32UnpaddedTxId}.arweave.net/${txId}`;
}
