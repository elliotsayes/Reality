import { Login } from "@/features/login/components/Login";
import Main from "@/features/main/components/Main";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";

const versePathRegex = /^([a-zA-Z0-9_-]{43})$/;

export const Route = createLazyFileRoute("/$")({
  component: VerseId,
});

function VerseId() {
  const { _splat } = useParams({
    // Not sure why I have to do this but whatever
    select: (params) => ({
      _splat: Object.prototype.hasOwnProperty.call(params, "_splat")
        ? String((params as Record<"_splat", string>)._splat)
        : "",
    }),
    strict: false,
  });

  let verseId = undefined;
  const match = versePathRegex.exec(_splat);
  if (match) {
    verseId = match[1];
  } else {
    return <div>Invalid verse ID</div>;
  }

  return (
    <Login>
      {(wallet, disconnect) => {
        return (
          <Main wallet={wallet} disconnect={disconnect} verseId={verseId} />
        );
      }}
    </Login>
  );
}
