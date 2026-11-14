import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';
import { Field, Seo } from '../components/ui';

function Shell({ title, sub, children, foot }) {
  return (
    <div className="container-x flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-stone-500">{sub}</p>
        {children}
        <p className="mt-6 text-center text-sm text-stone-500">{foot}</p>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const u = await login(f.email, f.password); nav(loc.state?.from || (u.role === 'admin' ? '/admin' : '/account'), { replace: true }); }
    catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Welcome back" sub="Log in to view your orders and saved addresses." foot={<>New here? <Link to="/register" className="font-semibold text-gold-600">Create an account</Link></>}>
      <Seo title="Login" noindex />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="input" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <button className="btn-primary w-full py-3" disabled={busy}>Log in</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await register(f); toast.success('Account created'); nav('/account', { replace: true }); }
    catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Shell title="Create your account" sub="Track orders and check out faster. Guest checkout is always available." foot={<>Already registered? <Link to="/login" className="font-semibold text-gold-600">Log in</Link></>}>
      <Seo title="Create account" noindex />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input className="input" required minLength={2} value={f.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email"><input className="input" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Mobile number"><input className="input" placeholder="01XXXXXXXXX" value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        <Field label="Password" hint="At least 8 characters"><input className="input" type="password" required minLength={8} value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <button className="btn-primary w-full py-3" disabled={busy}>Create account</button>
      </form>
    </Shell>
  );
}
