import { useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

const text = {
  en: {
    title: 'Auto Parts Marketplace',
    subtitle: 'Secure access. Sign in first, then browse listings, chats, favorites, and your dashboard.',
    signIn: 'Sign In',
    register: 'Register',
    displayName: 'Display name',
    displayNamePlaceholder: 'e.g. Alex Miller',
    email: 'Email',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    wait: 'Please wait...',
    createAccount: 'Create Account',
    successRegister: 'Account created. You are now signed in.',
    successLogin: 'Signed in successfully.',
    errorFallback: 'Authentication failed.',
  },
  de: {
    title: 'Autoteile-Marktplatz',
    subtitle: 'Geschuetzter Zugang. Erst anmelden, dann Marktplatz, Chats, Favoriten und Dashboard nutzen.',
    signIn: 'Login',
    register: 'Registrieren',
    displayName: 'Anzeigename',
    displayNamePlaceholder: 'z. B. Max Muster',
    email: 'E-Mail',
    password: 'Passwort',
    passwordPlaceholder: 'Mindestens 6 Zeichen',
    wait: 'Bitte warten...',
    createAccount: 'Konto erstellen',
    successRegister: 'Konto erstellt. Du bist jetzt eingeloggt.',
    successLogin: 'Login erfolgreich.',
    errorFallback: 'Authentifizierung fehlgeschlagen.',
  },
};

const authErrorMap = {
  en: {
    'auth/email-already-in-use': 'This email is already in use.',
    'auth/invalid-email': 'The email address is invalid.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/missing-password': 'Please enter a password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
  },
  de: {
    'auth/email-already-in-use': 'Diese E-Mail wird bereits verwendet.',
    'auth/invalid-email': 'Die E-Mail-Adresse ist ungueltig.',
    'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
    'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    'auth/missing-password': 'Bitte ein Passwort eingeben.',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte spaeter erneut probieren.',
    'auth/operation-not-allowed': 'E-Mail/Passwort-Anmeldung ist in Firebase nicht aktiviert.',
  },
};

export default function Auth({ language = 'en', onLanguageChange, onToast, theme, onThemeChange }) {
  const t = text[language] || text.en;
  const errors = authErrorMap[language] || authErrorMap.en;
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logoSrc = useMemo(() => `${import.meta.env.BASE_URL}partfinder-icon.png`, []);

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

        onToast(t.successRegister, 'success');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onToast(t.successLogin, 'success');
      }
    } catch (error) {
      console.error(error);
      onToast(errors[error.code] || t.errorFallback, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pf-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6">
        <LanguageSwitcher value={language} onChange={onLanguageChange} />
        <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
      </div>

      <div className="w-full max-w-md rounded-[2rem] pf-card p-5 sm:p-6">
        <div className="mb-6">
          <img
            src={logoSrc}
            alt="PartFinder"
            className="h-24 w-24 rounded-[1.4rem] border border-[color:var(--pf-border)] object-cover shadow-xl"
          />
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--pf-text)]">{t.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--pf-muted)]">{t.subtitle}</p>
        </div>

        <div className="mb-5 inline-flex rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'login' ? 'bg-[var(--pf-primary)] text-[#04111a]' : 'text-[var(--pf-muted)]'
            }`}
          >
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'register' ? 'bg-[var(--pf-primary)] text-[#04111a]' : 'text-[var(--pf-muted)]'
            }`}
          >
            {t.register}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.displayName}</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.displayNamePlaceholder}
                className="pf-input px-4 py-3"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.email}</span>
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
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.password}</span>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.passwordPlaceholder}
              className="pf-input px-4 py-3"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="pf-button-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t.wait : mode === 'register' ? t.createAccount : t.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
