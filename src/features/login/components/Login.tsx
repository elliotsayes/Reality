import { AoWallet } from "@/features/ao/lib/aoWallet"
import { LoginMenu } from "./LoginMenu"
import { useMachine } from "@xstate/react"
import { loginMachine } from "../machines/loginMachine"

interface LoginProps {
  children: (wallet: AoWallet, disconnect: () => void) => React.ReactNode
}

export function Login({ children }: LoginProps) {
  const [current, send] = useMachine(loginMachine)

  const disconnect = () => send({ type: 'Disconnect' })

  if (current.matches({ "Logging In": "Show Login UI" })) {
    return (
      // show in center of parent element
      <div className="flex flex-col flex-grow justify-around items-center h-full">
        <LoginMenu
          onConnect={(wallet, disconnect) => send({ type: 'Connect', data: { wallet, disconnect: disconnect ?? (() => {}) } })} 
          onDisconnect={disconnect}
        />
        <div />
      </div>
    )
  }

  if (current.matches("Logged In")) {
    if (current.context.wallet === undefined) {
      throw new Error("Wallet is undefined")
    } 
    return children(current.context.wallet, disconnect)
  }

  return null;
}
