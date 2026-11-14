import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Phone, Truck, Gift, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCategories, useSettings } from '../hooks/useData';
import SearchBox from './SearchBox';

export default function Header() {
  const { count, setOpen, bump } = useCart();
  const { user } = useAuth();
  const { data: s } = useSettings();
  const { data: cats } = useCategories();
  const [menu, setMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const link = ({ isActive }) => `whitespace-nowrap px-3 py-2 text-sm font-medium transition ${isActive ? 'text-gold-600' : 'text-choco-800 hover:text-gold-600'}`;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-choco-900 text-xs text-choco-100">
        <div className="container-x flex items-center justify-between py-2">
          <span className="flex items-center gap-1.5"><Truck size={14} className="text-gold-400" />{s?.announcement || 'Fast delivery across Bangladesh'}</span>
          <a href={`tel:${s?.hotline}`} className="hidden items-center gap-1.5 hover:text-white sm:flex"><Phone size={14} className="text-gold-400" />Hotline: {s?.hotline}</a>
        </div>
      </div>

      <div className="container-x flex items-center gap-3 py-3 lg:gap-8">
        <button className="lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu /></button>
        <Link to="/" className="flex shrink-0 items-center" aria-label="ECR Choco BD">
          <img
            src="/esr-choco-bd-logo.png"
            alt="ECR Choco BD"
            className="h-9 w-auto max-w-[145px] object-contain sm:h-11 sm:max-w-[170px]"
          />
        </Link>
        <SearchBox className="hidden flex-1 lg:block" />
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <button className="rounded-lg p-2 hover:bg-stone-100 lg:hidden" onClick={() => setShowSearch((v) => !v)} aria-label="Search"><Search size={20} /></button>
          <Link to="/track-order" className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-choco-800 hover:bg-stone-100 md:flex"><Truck size={18} />Track Order</Link>
          <Link to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-choco-800 hover:bg-stone-100">
            <User size={20} /><span className="hidden md:inline">{user ? user.name.split(' ')[0] : 'Login'}</span>
          </Link>
          <button onClick={() => setOpen(true)} className="relative flex items-center gap-2 rounded-lg bg-choco-800 px-3 py-2 text-white hover:bg-choco-900" aria-label={`Cart, ${count} items`}>
            <ShoppingBag size={18} />
            <span className="hidden text-sm font-semibold sm:inline">Cart</span>
            <span key={bump} className="absolute -right-2 -top-2 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-gold-500 px-1 text-[11px] font-bold">{count}</span>
          </button>
        </div>
      </div>
      {showSearch && <div className="container-x pb-3 lg:hidden"><SearchBox onDone={() => setShowSearch(false)} /></div>}

      <nav className="hidden border-t border-stone-100 lg:block">
        <div className="container-x flex items-center">
          <NavLink to="/" end className={link}>Home</NavLink>
          {cats?.map((c) => <NavLink key={c._id} to={`/category/${c.slug}`} className={link}>{c.name}</NavLink>)}
          <NavLink to="/shop" className={link}>All Products</NavLink>
          <NavLink to="/gift-box-builder" className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-gold-600 hover:bg-gold-50"><Gift size={16} />Build Your Gift Box</NavLink>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade" onClick={() => setMenu(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-5 shadow-lift">
            <div className="mb-4 flex items-center justify-between"><span className="font-display text-lg font-bold">Menu</span><button onClick={() => setMenu(false)} aria-label="Close menu"><X /></button></div>
            <div className="flex flex-col" onClick={() => setMenu(false)}>
              <NavLink to="/" end className={link}>Home</NavLink>
              {cats?.map((c) => <NavLink key={c._id} to={`/category/${c.slug}`} className={link}>{c.name}</NavLink>)}
              <NavLink to="/shop" className={link}>All Products</NavLink>
              <NavLink to="/gift-box-builder" className={link}>Build Your Gift Box</NavLink>
              <NavLink to="/track-order" className={link}>Track Order</NavLink>
              <NavLink to={user ? '/account' : '/login'} className={link}>{user ? 'My Account' : 'Login / Register'}</NavLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
