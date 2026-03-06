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
    <div className="pf-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex justify-end">
          <div className="w-full max-w-xl rounded-[2rem] pf-card p-4">
            <p className="mb-3 text-sm font-semibold text-[var(--pf-text)]">Design</p>
            <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="rounded-[2.25rem] pf-card p-8 lg:p-10">
            <span className="pf-hero-badge px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              Geschützter Autoteile-Marktplatz
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-[var(--pf-text)] sm:text-5xl">
              PartFinder 🚗
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--pf-muted)]">
              Login erforderlich. Registrierte Nutzer sehen den Marktplatz, Detailseiten, WhatsApp-Kontakt,
              In-App-Chat, Verkäuferprofile und das persönliche Dashboard.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] pf-stat p-4">
                <p className="text-sm text-[var(--pf-muted)]">Kontakt</p>
                <p className="mt-2 text-xl font-black text-[var(--pf-text)]">WhatsApp + Chat</p>
              </div>
              <div className="rounded-[1.5rem] pf-stat p-4">
                <p className="text-sm text-[var(--pf-muted)]">Verkäuferprofil</p>
                <p className="mt-2 text-xl font-black text-[var(--pf-text)]">Name & Bild</p>
              </div>
              <div className="rounded-[1.5rem] pf-stat p-4">
                <p className="text-sm text-[var(--pf-muted)]">Dashboard</p>
                <p className="mt-2 text-xl font-black text-[var(--pf-text)]">Profil & Inserate</p>
              </div>
            </div>
          </section>

          <div className="rounded-[2rem] pf-card p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <span className="pf-hero-badge px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
                Nur für eingeloggte Nutzer
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--pf-text)]">
                {mode === 'register' ? 'Konto erstellen' : 'Anmelden'}
              </h2>
              <p className="mt-2 text-sm text-[var(--pf-muted)]">
                Sichere E-Mail-Anmeldung mit Firebase Auth.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  mode === 'login' ? 'pf-button-primary' : 'text-[var(--pf-muted)] hover:bg-black/5'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  mode === 'register' ? 'pf-button-primary' : 'text-[var(--pf-muted)] hover:bg-black/5'
                }`}
              >
                Registrieren
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Dein Anzeigename"
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
                  placeholder="name@beispiel.de"
                  className="pf-input px-4 py-3"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Passwort</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  minLength={6}
                  className="pf-input px-4 py-3"
                  required
                />
              </label>

              <button type="submit" disabled={loading} className="pf-button-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Bitte warten…' : mode === 'register' ? 'Konto erstellen' : 'Einloggen'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
