import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';

const authErrorMap = {
  'auth/email-already-in-use': 'Diese E-Mail wird bereits verwendet.',
  'auth/invalid-email': 'Die E-Mail-Adresse ist ungültig.',
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
  'auth/missing-password': 'Bitte ein Passwort eingeben.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte später erneut probieren.',
};

export default function Auth({ onToast }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        onToast('Konto erstellt. Du bist jetzt eingeloggt.', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onToast('Login erfolgreich.', 'success');
      }
    } catch (error) {
      console.error(error);
      onToast(authErrorMap[error.code] || 'Authentifizierung fehlgeschlagen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_25%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Geschützter Marktplatz
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">PartFinder 🚗</h1>
          <p className="mt-2 text-sm text-slate-300">
            Nur eingeloggte Nutzer sehen den Marktplatz und können Autoteile anbieten.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === 'register'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">E-Mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@beispiel.de"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Passwort</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mindestens 6 Zeichen"
              minLength={6}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Bitte warten…'
              : mode === 'register'
                ? 'Konto erstellen'
                : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}
