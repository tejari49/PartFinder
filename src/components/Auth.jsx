import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import ThemeSwitcher from './ThemeSwitcher';

const authErrorMap = {
  'auth/email-already-in-use': 'Diese E-Mail wird bereits verwendet.',
  'auth/invalid-email': 'Die E-Mail-Adresse ist ungültig.',
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
  'auth/missing-password': 'Bitte ein Passwort eingeben.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte später erneut probieren.',
  'auth/operation-not-allowed': 'E-Mail/Passwort-Anmeldung ist in Firebase noch nicht aktiviert.',
};

export default function Auth({ onToast, theme, onThemeChange }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

        if (name.trim()) {
          await updateProfile(credential.user, {
            displayName: name.trim(),
          });
        }

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
    <div className="pf-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
      </div>

      <div className="w-full max-w-md rounded-[2rem] pf-card p-5 sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pf-primary)]">PartFinder</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--pf-text)]">Autoteile-Marktplatz 🚗</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--pf-muted)]">
            Geschützter Zugang. Erst Login, dann Marktplatz, Chats, Favoriten und Dashboard.
          </p>
        </div>

        <div className="mb-5 inline-flex rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'login' ? 'bg-[var(--pf-primary)] text-[#04111a]' : 'text-[var(--pf-muted)]'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'register' ? 'bg-[var(--pf-primary)] text-[#04111a]' : 'text-[var(--pf-muted)]'
            }`}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Anzeigename</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="z. B. Max Muster"
                className="pf-input px-4 py-3"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">E-Mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@email.com"
              className="pf-input px-4 py-3"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Passwort</span>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mindestens 6 Zeichen"
              className="pf-input px-4 py-3"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="pf-button-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Bitte warten…' : mode === 'register' ? 'Konto erstellen' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}
