import { InjectedEthereumSigner, InjectedEthereumSignerMinimalProvider, createData } from "arbundles";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { AoSigner, AoWalletConnector } from "../aoWallet";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

/**
 * @param ethersProvider - BrowserProvider
 * @returns signer
 */
export const connectEthereumWallet: AoWalletConnector = async (_, onDisconnect) => {
  if (!window.ethereum) {
    return {
      success: false,
      error: "No injected Ethereum wallet",
    }
  }

  let ethSigner: InjectedEthereumSigner;
  let address: string;
  try {
    const ethersProvider = new BrowserProvider(window.ethereum)
    const ethersSigner = await ethersProvider.getSigner()
    address = await ethersSigner.getAddress()
    const provider: InjectedEthereumSignerMinimalProvider = {
      getSigner: () => ({
          signMessage: (message: string | Uint8Array) => ethersSigner.signMessage(message),
      })
    }
    ethSigner = new InjectedEthereumSigner(provider)
    await ethSigner.setPublicKey()
  } catch (error) {
    return {
      success: false,
      error,
    }
  }

  // let interval: NodeJS.Timeout;
  if (onDisconnect) {
    // TODO
  }

  const signer = async (...args: Parameters<AoSigner>) => {
    const transactionArgs = args[0];
    const { data, tags, target, anchor } = transactionArgs;
    const dataItem = createData(data, ethSigner, {
      target,
      anchor,
      tags: tags?.filter(x => x.name && x.value) as {
        name: string;
        value: string;
      }[] | undefined ?? [],
    })

    const res = await dataItem.sign(ethSigner)
      .then(async () => ({
        id: dataItem.id,
        raw: dataItem.getRaw(),
      }))
    return res
  }

  return {
    success: true,
    result: {
      type: "Ethereum",
      anonymous: false,
      address,
      signer,
    },
    // TODO: ethersProvider.?,
    disconnect: () => {}
  }
}