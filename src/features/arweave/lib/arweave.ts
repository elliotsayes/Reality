import Arweave from "arweave";

export const defaultArweave = Arweave.init({});

export function fetchUrl(txId: string) {
  return `https://arweave.net/${txId}`;
}
