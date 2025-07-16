'use client';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set('flow', flow);
          void signIn('password', formData).catch((error) => {
            let toastTitle = '';
            if (error.message.includes('Invalid password')) {
              toastTitle = 'Mot de passe incorrect. Veuillez réessayer.';
            } else {
              toastTitle =
                flow === 'signIn'
                  ? 'Impossible de se connecter, vouliez-vous vous inscrire ?'
                  : 'Impossible de s\'inscrire, vouliez-vous vous connecter ?';
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Mot de Passe"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === 'signIn' ? 'Connexion' : 'Inscription'}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === 'signIn'
              ? "Tu n'as pas de compte? "
              : 'Already have an account? '}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
          >
            {flow === 'signIn' ? "S'inscrire" : 'Se connecter'}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button className="auth-button" onClick={() => void signIn('anonymous')}>
        Connexion anonyme
      </button>
    </div>
  );
}
