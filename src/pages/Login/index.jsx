import { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';

const GRID_BG = [
  'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
  'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
].join(',');

const INPUT_CLASS = [
  'w-full h-11 pl-10 pr-4 rounded-xl',
  'border border-zinc-200 bg-zinc-50/50',
  'text-sm text-zinc-900 placeholder:text-zinc-400',
  'transition-all duration-200',
  'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 focus:bg-white',
].join(' ');

function Login() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({ username: '', password: '', tenantId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const {
    mutate: login, isPending, error, isError,
  } = useLogin();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    login(form, {
      onSuccess: () => navigate('/', { replace: true }),
    });
  };

  const errorMessage = isError
    ? error?.message || 'Login failed. Please check your credentials.'
    : null;

  const canSubmit = form.username && form.password && form.tenantId;

  return (
    <div className="min-h-dvh flex bg-white">
      {/* ── Left: Branded panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-navy-900 overflow-hidden flex-col justify-end p-14">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: GRID_BG, backgroundSize: '72px 72px' }}
        />
        <div className="absolute top-[20%] right-[-8%] w-[550px] h-[550px] rounded-full bg-brand/12 blur-[160px]" />
        <div className="absolute bottom-[-8%] left-[8%] w-[380px] h-[380px] rounded-full bg-brand/8 blur-[120px]" />

        <div className="relative z-10 max-w-md">
          <div className="w-10 h-10 rounded-xl bg-white/8 backdrop-blur-sm border border-white/6 flex items-center justify-center mb-10">
            <div className="w-4 h-4 rounded-[4px] bg-white/80" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tighter leading-[1.08]">
            Build with
            <br />
            confidence.
          </h1>
          <p className="mt-5 text-[15px] text-white/40 leading-relaxed max-w-[44ch]">
            Multi-tenant platform for your team — manage workflows, orchestrate
            AI operations, ship faster.
          </p>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile brand mark */}
          <div className="lg:hidden mb-10">
            <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-white/80" />
            </div>
          </div>

          <h2 className="text-[1.625rem] font-semibold tracking-tight text-zinc-900">
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Enter your credentials to access the platform.
          </p>

          {/* Error banner */}
          {errorMessage ? (
            <div className="mt-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-[13px] text-red-600 leading-snug">{errorMessage}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Tenant ID */}
            <fieldset className="space-y-1.5">
              <label htmlFor="login-tenant" className="block text-[13px] font-medium text-zinc-700">
                Tenant ID
              </label>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400"
                  strokeWidth={1.5}
                />
                <input
                  id="login-tenant"
                  type="text"
                  name="tenantId"
                  value={form.tenantId}
                  onChange={handleChange}
                  placeholder="tnt_xyz456"
                  autoComplete="organization"
                  className={INPUT_CLASS}
                />
              </div>
            </fieldset>

            {/* Username */}
            <fieldset className="space-y-1.5">
              <label htmlFor="login-username" className="block text-[13px] font-medium text-zinc-700">
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400"
                  strokeWidth={1.5}
                />
                <input
                  id="login-username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="admin"
                  autoComplete="username"
                  className={INPUT_CLASS}
                />
              </div>
            </fieldset>

            {/* Password */}
            <fieldset className="space-y-1.5">
              <label htmlFor="login-password" className="block text-[13px] font-medium text-zinc-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400"
                  strokeWidth={1.5}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`${INPUT_CLASS} pr-11!`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </fieldset>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className={[
                'mt-2 w-full h-11 flex items-center justify-center gap-2',
                'rounded-xl bg-navy-900 text-white text-sm font-medium',
                'transition-all duration-200 cursor-pointer',
                'hover:bg-navy-900/90',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
              ].join(' ')}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
