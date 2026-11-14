import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingChat from './components/FloatingChat';
import { Spinner } from './components/ui';
import { useAuth } from './context/AuthContext';
import { useSettings } from './hooks/useData';
import { initPixel, pageView } from './lib/pixel';

import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import TrackOrder from './pages/TrackOrder';
import { Login, Register } from './pages/AuthPages';
import Account from './pages/Account';
import GiftBox from './pages/GiftBox';
import { NotFound, StaticPage } from './pages/Misc';

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminBanners = lazy(() => import('./pages/admin/Banners'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminSettings = lazy(() => import('./pages/admin/SettingsPage'));
const Chalan = lazy(() => import('./pages/admin/Chalan'));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); pageView(); }, [pathname]);
  return null;
}

function RequireAuth({ admin }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <FloatingChat />
    </div>
  );
}

export default function App() {
  const { data: settings } = useSettings();
  useEffect(() => { if (settings?.metaPixelId) initPixel(settings.metaPixelId); }, [settings?.metaPixelId]);

  return (
    <>
      <ScrollTop />
      <Suspense fallback={<Spinner full />}>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="category/:slug" element={<Shop />} />
            <Route path="product/:slug" element={<Product />} />
            <Route path="gift-box-builder" element={<GiftBox />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success/:orderNumber" element={<OrderSuccess />} />
            <Route path="track-order" element={<TrackOrder />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="about" element={<StaticPage kind="about" />} />
            <Route path="delivery-policy" element={<StaticPage kind="delivery" />} />
            <Route element={<RequireAuth />}>
              <Route path="account" element={<Account />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<RequireAuth admin />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="admin/chalan/:id" element={<Chalan />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
