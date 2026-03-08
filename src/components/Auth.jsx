import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import ThemeSwitcher from './ThemeSwitcher';

const authErrorMap = {
  'auth/email-already-in-use': 'This email is already in use.',
  'auth/invalid-email': 'The email address is invalid.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/missing-password': 'Please enter a password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
};

export default function Auth({ onToast, theme, onThemeChange }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logoSrc = `${import.meta.env.BASE_URL}partfinder-logo.svg`;

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

        onToast('Account created. You are now signed in.', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onToast('Signed in successfully.', 'success');
      }
    } catch (error) {
      console.error(error);
      onToast(authErrorMap[error.code] || 'Authentication failed.', 'error');
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
          <img src={logoSrc} alt="PartFinder" className="h-auto w-full max-w-[18rem]" />
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--pf-text)]">Auto Parts Marketplace</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--pf-muted)]">
            Secure access. Sign in first, then browse listings, chats, favorites, and your dashboard.
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
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'register' ? 'bg-[var(--pf-primary)] text-[#04111a]' : 'text-[var(--pf-muted)]'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Display name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Alex Miller"
                className="pf-input px-4 py-3"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Email</span>
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
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Password</span>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="pf-input px-4 py-3"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="pf-button-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
