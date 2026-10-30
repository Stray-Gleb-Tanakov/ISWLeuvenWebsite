import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import { xorReveal } from "@/game/flags";

/* Mini CTF: "Forged Papers". The portal hands out a JWT-style pass and
   "verifies" it client-side. It honours whatever alg the header claims. */

const STORAGE_KEY = "isw_board_token";
const BOARD_MINUTES = "Kzw2CVAuKD48VCxcPjRUMChSNhk=";

const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));

const GUEST_HEADER = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const GUEST_PAYLOAD = b64url(JSON.stringify({ sub: "guest", role: "guest", iss: "isw-board-portal" }));
const GUEST_SIG = "q3J8m1Yb0cXk4dUeZr7lWtN9pA2sHf6vLoE5xCiGjKw";
const GUEST_TOKEN = `${GUEST_HEADER}.${GUEST_PAYLOAD}.${GUEST_SIG}`;

interface Verdict { ok: boolean; reason: string; claims?: { sub?: string; role?: string } }

function verify(token: string): Verdict {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed token: expected header.payload.signature" };
  let header: { alg?: string }, claims: { sub?: string; role?: string };
  try {
    header = JSON.parse(unb64url(parts[0]));
    claims = JSON.parse(unb64url(parts[1]));
  } catch {
    return { ok: false, reason: "malformed token: header or payload isn't base64url JSON" };
  }
  if (String(header.alg).toLowerCase() === "none") return { ok: true, reason: "unsigned token accepted (alg: none)", claims };
  if (header.alg !== "HS256") return { ok: false, reason: `unsupported alg "${header.alg}"` };
  // Only the portal knows the HS256 secret, so the only signature we can vouch for is our own guest pass
  if (`${parts[0]}.${parts[1]}` !== `${GUEST_HEADER}.${GUEST_PAYLOAD}` || parts[2] !== GUEST_SIG) {
    return { ok: false, reason: "signature invalid. Nice try." };
  }
  return { ok: true, reason: "signature valid (HS256)", claims };
}

function loadToken(): string {
  try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
}

const Board = () => {
  const [token, setToken] = useState(loadToken);
  const verdict = token ? verify(token) : null;
  const role = verdict?.ok ? verdict.claims?.role : undefined;

  const present = (t: string) => {
    setToken(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* private window: the textbox still works */ }
  };

  return (
    <PageLayout>
      <div className="py-8 sm:py-16 px-4">
        <div className="container-terminal">
          <header className="mb-8">
            <BackButton />
            <h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
              <span className="text-muted-foreground">user@iswleuven:~$</span> ssh board@portal
            </h1>
            <div className="h-px bg-border w-full mt-4" />
          </header>

          <section className="mb-8 bg-card border border-border p-4 sm:p-6 font-mono text-sm space-y-4">
            <p className="text-muted-foreground"># ISW board portal. Board members only beyond this point.</p>
            {!token && (
              <button onClick={() => present(GUEST_TOKEN)} className="border border-primary text-primary px-3 py-1 hover:bg-primary/10">
                [ continue as guest ]
              </button>
            )}
            {token && (
              <>
                <label className="block text-muted-foreground" htmlFor="board-token"># your pass</label>
                <textarea
                  id="board-token"
                  value={token}
                  onChange={(e) => present(e.target.value)}
                  spellCheck={false}
                  rows={4}
                  className="w-full bg-background border border-border p-2 text-foreground break-all text-xs"
                />
                <p className={verdict?.ok ? "text-primary" : "text-destructive"}>&gt; {verdict?.reason}</p>
                {verdict?.ok && <p className="text-foreground">&gt; signed in as {verdict.claims?.sub ?? "?"} (role: {role ?? "none"})</p>}
              </>
            )}
          </section>

          {role === "board" ? (
            <section className="bg-card border border-primary p-4 sm:p-6 font-mono text-sm">
              <p className="text-primary text-glow"># minutes_last_meeting.txt</p>
              <p className="text-foreground mt-2">- agenda point 1: who keeps leaving the coffee machine on</p>
              <p className="text-foreground">- agenda point 2: the portal checks signatures "later"</p>
              <p className="text-foreground">- {xorReveal(BOARD_MINUTES, role)}</p>
            </section>
          ) : token && verdict?.ok ? (
            <p className="text-muted-foreground font-mono text-sm"># minutes_last_meeting.txt: permission denied (role "board" required)</p>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
};

export default Board;
