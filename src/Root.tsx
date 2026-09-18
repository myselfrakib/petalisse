import { Link, Outlet, useLocation } from 'react-router';
import { useCart } from './context/CartContext';
import { RoseIcon } from './components/Icons';

const imgHome = '/figma-assets/dffa408d6d19e91d6b056849cc2f0972b6a36cdd.svg';
const imgShoppingBag = '/figma-assets/083e4c888f3568dd2146ebd73c535dfaacf6999c.svg';
const imgShoppingCart = '/figma-assets/193193dd439a9155e5ecf36970d1492759a04e4b.svg';
const imgUser = '/figma-assets/aeedbf4595c71cd130d1af6dca8e6e70b4da52aa.svg';

export default function Root() {
  const { count } = useCart();
  const { pathname } = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: imgHome },
    { label: 'Shop', path: '/shop', icon: imgShoppingBag },
    { label: 'Cart', path: '/cart', icon: imgShoppingCart, badge: count },
    { label: 'Profile', path: '/profile', icon: imgUser },
  ];

  return (
    <div className="font-body text-ink min-h-screen flex flex-col bg-[#FDFBF7]">
      {/* Desktop Header (hidden on mobile) */}
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
          <Link
            to="/profile"
            className={`font-cormorant font-semibold text-sm tracking-wider uppercase transition-colors ${
              pathname === '/profile' ? 'text-[#6B1A2A]' : 'text-[#8B827D] hover:text-[#6B1A2A]'
            }`}
          >
            Profile
          </Link>
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

      {/* Main Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Bottom Navigation Bar (Figma Node 12:3) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        data-node-id="12:3"
        data-name="bottom-navigation"
      >
        <div className="w-full max-w-[430px] bg-[#FAF5F0] border-t border-[rgba(107,26,42,0.08)] shadow-[0px_-2px_10px_rgba(44,62,80,0.08)] flex h-[72px] items-center justify-around px-4 py-2 pointer-events-auto backdrop-blur-sm">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? pathname === '/'
                : pathname.startsWith(item.path);

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`relative flex flex-col gap-1 items-center justify-center w-16 py-1 transition-all ${
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
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
