import { useState } from "react";

type LoginPageProps = {
  onLoginSuccess: (
    token: string,
    refreshToken: string,
    user: { id: string; displayName: string; role: string; email: string },
  ) => void;
  showToast: (tone: "success" | "error", message: string) => void;
};

export function LoginPage({ onLoginSuccess, showToast }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("error", "Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || "Erreur d'authentification");
      }

      showToast("success", "Connexion réussie !");
      onLoginSuccess(body.token, body.refreshToken, body.user);
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f6] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <img
              src="/Procura_Logo.png"
              alt="Procura Logo"
              className="h-full w-full object-contain rounded-lg"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Plateforme Procura
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Source-to-Contract sécurisé on-premise
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Adresse Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              placeholder="votre.nom@procura.dz"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/10 transition hover:bg-emerald-700 hover:shadow-emerald-700/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[11px] text-slate-400">
          Chiffrement de bout-en-bout &bull; Conformité lois 18-07 & 23-12
        </div>
      </div>
    </div>
  );
}
