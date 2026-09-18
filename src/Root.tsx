import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { useContent } from './context/ContentContext';
import { RoseIcon } from './components/Icons';
import { AuthModal } from './components/AuthModal';

const imgHome = '/figma-assets/dffa408d6d19e91d6b056849cc2f0972b6a36cdd.svg';
const imgShoppingBag = '/figma-assets/083e4c888f3568dd2146ebd73c535dfaacf6999c.svg';
const imgShoppingCart = '/figma-assets/193193dd439a9155e5ecf36970d1492759a04e4b.svg';
const imgUser = '/figma-assets/aeedbf4595c71cd130d1af6dca8e6e70b4da52aa.svg';

export default function Root() {
  const { count } = useCart();
  const { currentUser, isAdmin } = useAuth();
  const { siteContent } = useContent();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isAdminPage = pathname.startsWith('/admin');

  const navItems = [
    { label: 'Home', path: '/', icon: imgHome },
    { label: 'Shop', path: '/shop', icon: imgShoppingBag },
    { label: 'Cart', path: '/cart', icon: imgShoppingCart, badge: count },
    { label: 'Profile', path: '/profile', icon: imgUser },
  ];

  const handleUserClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      setAuthModalOpen(true);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="font-body text-ink min-h-screen flex flex-col bg-[#FDFBF7]">
      {/* Announcement Bar */}
      {!isAdminPage && siteContent.announcementText && (
        <div className="bg-[#6B1A2A] text-white py-1.5 px-4 text-center text-xs tracking-wider font-light flex items-center justify-center gap-2">
          <span>✨</span>
          <span>{siteContent.announcementText}</span>
          <span>✨</span>
        </div>
      )}

      {/* Desktop Header */}
      {!isAdminPage && (
        <header className="hidden md:flex sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#6B1A2A]/10 px-8 py-3 items-center justify-between">
          <Link to="/" className="font-parisienne text-4xl text-[#6B1A2A] leading-none hover:opacity-90">
            Petalisse
          </Link>

          <nav className="flex items-center gap-7">
            <Link
              to="/"
              className={`font-cormorant font-semibold text-sm tracking-wider uppercase transition-colors ${
                pathname === '/' ? 'text-[#6B1A2A]' : 'text-[#8B827D] hover:text-[#6B1A2A]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`font-cormorant font-semibold text-sm tracking-wider uppercase transition-colors ${
                pathname.startsWith('/shop') ? 'text-[#6B1A2A]' : 'text-[#8B827D] hover:text-[#6B1A2A]'
              }`}
            >
              Shop
            </Link>

            <RoseIcon className="w-3.5 h-4 text-[#6B1A2A] opacity-40" />

            {/* Profile or Sign in */}
            {currentUser ? (
              <Link
                to="/profile"
                className={`font-cormorant font-semibold text-sm tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                  pathname === '/profile' ? 'text-[#6B1A2A]' : 'text-[#8B827D] hover:text-[#6B1A2A]'
                }`}
              >
                <span>{currentUser.displayName?.split(' ')[0] || 'Profile'}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="font-cormorant font-semibold text-sm tracking-wider uppercase text-[#8B827D] hover:text-[#6B1A2A] transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Admin Link if Admin or in dev */}
            {isAdmin && (
              <Link
                to="/admin"
                className="px-2 py-0.5 rounded-md bg-[#8E5B59]/10 text-[#8E5B59] text-xs font-semibold uppercase tracking-wider hover:bg-[#8E5B59]/20 transition"
              >
                Admin Panel
              </Link>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-1.5 text-[#6B1A2A] hover:opacity-80 transition-opacity"
              aria-label="Cart"
            >
              <img src={imgShoppingCart} alt="Cart" className="size-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#6B1A2A] text-white text-[10px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          </nav>
        </header>
      )}

      {/* Main Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Bottom Navigation Bar (Figma Node 12:3) */}
      {!isAdminPage && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden"
          data-node-id="12:3"
          data-name="bottom-navigation"
        >
          <div className="w-full max-w-[430px] bg-[#FAF5F0] border-t border-[rgba(107,26,42,0.08)] shadow-[0px_-2px_10px_rgba(44,62,80,0.08)] flex h-[72px] items-center justify-around px-4 py-2 pointer-events-auto backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.path);

              const isProfile = item.path === '/profile';

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => {
                    if (isProfile && !currentUser) {
                      setAuthModalOpen(true);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`relative flex flex-col gap-1 items-center justify-center w-16 py-1 transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#6b1a2a] scale-105'
                      : 'text-[#8b827d] hover:text-[#6b1a2a]'
                  }`}
                >
                  <div className="relative size-5">
                    <img
                      alt={item.label}
                      className={`size-full block transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-70'
                      }`}
                      src={item.icon}
                    />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-[#6b1a2a] text-white text-[9px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-sans text-[11px] leading-tight ${
                      isActive ? 'font-semibold text-[#6b1a2a]' : 'font-medium text-[#8b827d]'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Customer Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
