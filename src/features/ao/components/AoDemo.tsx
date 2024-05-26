import { useApi } from "arweave-wallet-kit";

export function AoDemo() {
  const api = useApi();

  return (
    <div>
      <h1>AoDemo</h1>
      <p>
        {api ? "Has API" : "No API"}
      </p>
    </div>
  )
}
