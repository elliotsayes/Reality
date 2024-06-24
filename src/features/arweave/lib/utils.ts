export const truncateAddress = (
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4,
  middleText: string = "...",
) => {
  return `${address.slice(0, prefixLength)}${middleText}${address.slice(-suffixLength)}`;
};
