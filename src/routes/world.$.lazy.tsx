import { Login } from "@/features/login/components/Login";
import Main from "@/features/main/components/Main";
import {
  createLazyFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";

const worldPathRegex = /^([a-zA-Z0-9_-]{43})$/;

export const Route = createLazyFileRoute("/world/$")({
  component: WorldId,
});

// const addressWhitelist = [
//   "0cQJ5Hd4oCaL57CWP-Pqe5_e0D4_ZDWuxKBgR9ke1SI", // me
//   "0yTSTgkCdcgxZHshUDHobfo_sHzW7ZIbqse8eMy_wJY", // sam
//   "hKibO41ULSd4cbh7rrHSZXy8bwd6t0fRGkihmPkklGY", // alberto
//   "D_zXubpRWd5Z-MASCJMB9EIGkNEu2D_a6GGN1JOpj2Y", // moira
//   "71jBJuC2FPubKtv687Q1kc8ee43l_a_8D9TZGIgShzg",
//   "uf_FqRvLqjnFMc8ZzGkF4qWKuNmUIQcYP0tPlCGORQk",
//   "v2XXwq_FvVqH2KR4p_x8H-SQ7rDwZBbykSv-59__Avc",
//   "aC75VhWSsEOnp-SMg3l40o4lvs1OxBNMYXVZnt-7lhw",
//   "5VPys2doO8c-eX2wKu07u9Fh2d_K7PtZ6pThV_K1I6s",
//   "UPJHTNsaKcC6baqLFHMAMI7daWPIG3NDDfFQ2s2h8T0",
//   "q-RR9fXWCubz3a5-KndWAjKblsG_qB-zXdcQibIL3lw",
//   "MnYBURB3NcF6R2tfWkXWMtdzv0X1tchgXpWZPKpmjuA",
//   "YvdNQ-5DFa67zDH6ANMBaf7n4hg5jTpDoz84JtqXmAo",
//   "IWJPipyG_rq6Wq_UWJZbbUEek930Goo30MktSoiWtFk",
//   "qqg_q69nWNQwEXUajdX-Zy3du9HMz-p0Wp-8tFQGDtU",
//   "FZx2g_LPDIj09ksj8dksbMWqjnSxoXAyEqxPrQDc1MI",
//   "YxFhHPuYgB1PvchIjcQ569bn9WMspuxrJgT71DFg4uo",
//   "sM9nBtAlqIfxTLOXv4aYm9u3JsOyvKqG8XLb5UirT_I",
// ];

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

  console.log(_splat);

  const navigate = useNavigate();
  if (_splat.startsWith("main")) {
    navigate({
      to: "/",
    });
  }

  let worldId = undefined;
  const match = worldPathRegex.exec(_splat);
  if (match) {
    worldId = match[1];
  }

  if (!worldId) {
    return <div>Invalid world ID</div>;
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
