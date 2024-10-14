import { Login } from "@/features/login/components/Login";
import Main from "@/features/main/components/Main";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";

const worldPathRegex = /^([a-zA-Z0-9_-]{43})$/;

export const Route = createLazyFileRoute("/$")({
  component: WorldId,
});

function WorldId() {
  const { _splat } = useParams({
    // Not sure why I have to do this but whatever
    select: (params) => ({
      _splat: Object.prototype.hasOwnProperty.call(params, "_splat")
        ? String((params as Record<"_splat", string>)._splat)
        : "",
    }),
    strict: false,
  });

  let worldId = undefined;
  const match = worldPathRegex.exec(_splat);
  if (match) {
    worldId = match[1];
  } else {
    ``;
    return <div>Invalid verse ID</div>;
  }

  return (
    <Login>
      {(wallet, disconnect) => {
        return (
          <Main wallet={wallet} disconnect={disconnect} worldId={worldId} />
        );
      }}
    </Login>
  );
}
