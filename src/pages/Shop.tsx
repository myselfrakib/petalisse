import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useCart } from '../context/CartContext';
import { useContent } from '../context/ContentContext';
import { Product } from '../types';

const imgGinghamBg = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgChevronLeft = '/figma-assets/de70edd513d91ef52fc2c1fa9af3cbf0656b675a.svg';
const imgShoppingBag = '/figma-assets/8aab77e6404936a9df121d7028258a27c83ee8b7.svg';
const imgHeart = '/figma-assets/31e27e08eda6d57eca61746b58532f5771b76653.svg';
const imgRibbonBow = '/figma-assets/f5ee34f9c15fa3218e53c9e0f3259ab4fed5a2ad.svg';

const SHOP_CATEGORIES = ['All', 'Mobile Charms', 'Bag Charms', 'Mystery Jars'];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { add, count } = useCart();
  const { products } = useContent();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('petalisse_favorites');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('petalisse_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const [displayCount, setDisplayCount] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('petalisse_shop_display_count');
      return saved ? parseInt(saved, 10) : 10;
    } catch {
      return 10;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('petalisse_shop_display_count', String(displayCount));
    } catch {}
  }, [displayCount]);

  const activeCategory = searchParams.get('category') ?? 'All';

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [activeCategory, products]);

  const displayedProducts = filtered.slice(0, displayCount);

  const setCategory = (cat: string) => {
    setDisplayCount(10);
    if (cat === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: (typeof products)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    add(product);
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((current) => (current === product.id ? null : current));
    }, 1200);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 6);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-5 px-4 sm:px-6 pb-28 relative bg-repeat"
      style={{
        backgroundImage: `url("${imgGinghamBg}")`,
        backgroundSize: '153.6px 153.6px',
      }}
      data-node-id="2:216"
      data-name="petalisse-shop-page"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] bg-[#fdfbf7] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] px-4 sm:px-5 py-6 relative flex flex-col gap-7 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)]"
        data-node-id="2:217"
        data-name="paper-center-panel"
      >
        {/* ── TOP NAVBAR ── */}
        <header
          className="border-b border-[#6b1a2a]/10 pb-3 flex items-center justify-between w-full"
          data-node-id="2:224"
          data-name="top-navbar"
        >
          <Link
            to="/"
            className="bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs"
            data-node-id="2:225"
            data-name="nav-back-button"
            aria-label="Back to home"
          >
            <img alt="Back" className="size-3.5 block" src={imgChevronLeft} />
          </Link>

          <Link to="/" className="font-parisienne text-[#6b1a2a] text-[32px] leading-none hover:opacity-90">
            Petalisse
          </Link>

          <Link
            to="/cart"
            className="relative bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs"
            data-node-id="2:228"
            data-name="nav-cart-button"
            aria-label="View Cart"
          >
            <img alt="Cart" className="size-3.5 block" src={imgShoppingBag} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#6b1a2a] text-white text-[9px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
        </header>

        {/* ── CATEGORY FILTERS ── */}
        <div
          className="flex flex-wrap gap-2 items-center justify-center w-full"
          data-node-id="2:238"
          data-name="category-filters-container"
        >
          {SHOP_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`font-cormorant font-bold text-[13px] uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#6b1a2a] text-white drop-shadow-[0px_2px_4px_rgba(107,26,42,0.25)] scale-102'
                    : 'bg-white border border-[#6b1a2a]/15 text-[#6b1a2a] hover:border-[#6b1a2a]/40 hover:bg-[#FAF5F0]'
                }`}
                data-name="category-tab"
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── PRODUCT GRID (2 COLUMNS) ── */}
        {displayedProducts.length > 0 ? (
          <div
            className="grid grid-cols-2 gap-3.5 w-full"
            data-node-id="2:248"
            data-name="product-grid"
          >
          {displayedProducts.map((product) => {
            const isFav = !!favorites[product.id];
            const isAdded = addedId === product.id;

            return (
              <div
                key={product.id}
                className="flex flex-col gap-2.5 items-stretch group"
                data-name="product-card"
              >
                {/* Image Container with Favorite Button */}
                <div
                  className="bg-white border border-[rgba(107,26,42,0.1)] rounded-[16px] overflow-hidden relative aspect-square shadow-xs group-hover:shadow-md transition-all"
                  data-name="image-container"
                >
                  <Link to={`/product/${product.id}`} className="block size-full relative">
                    <img
                      alt={product.name}
                      src={product.img || product.images?.[0]}
                      className={`size-full object-cover transition-all duration-300 ${
                        product.images && product.images.length > 1
                          ? 'group-hover:opacity-0 group-hover:scale-105'
                          : 'group-hover:scale-105'
                      }`}
                    />
                    {product.images && product.images.length > 1 && product.images[1] && (
                      <img
                        alt={product.name}
                        src={product.images[1]}
                        className="size-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                    )}
                  </Link>

                  {/* Photo count indicator if multiple photos exist */}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-2 left-2 bg-[rgba(253,251,247,0.92)] backdrop-blur-xs px-1.5 py-0.5 rounded-full text-[10px] font-sans font-medium text-[#6b1a2a] shadow-xs flex items-center gap-1 pointer-events-none z-10">
                      <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{product.images.length}</span>
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(e, product.id)}
                    className="absolute top-2 right-2 bg-[rgba(253,251,247,0.94)] backdrop-blur-xs size-7 rounded-[14px] shadow-[0px_2px_6px_rgba(107,26,42,0.14)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10"
                    data-name="favorite-overlay"
                    aria-label="Add to wishlist"
                  >
                    <img
                      alt="Favorite"
                      src={imgHeart}
                      className={`size-3.5 transition-all ${isFav ? 'filter brightness-75 scale-110 drop-shadow-xs' : 'opacity-85'}`}
                      style={{
                        filter: isFav
                          ? 'drop-shadow(0 0 2px rgba(200,35,51,0.8)) hue-rotate(-10deg) saturate(2)'
                          : undefined,
                      }}
                    />
                  </button>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 px-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <Link
                      to={`/product/${product.id}`}
                      className="font-cormorant font-bold text-[#6b1a2a] text-[15px] sm:text-[16px] truncate hover:underline flex-1"
                      title={product.name}
                    >
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      {product.discountedPrice !== undefined ? (
                        <>
                          <span className="font-sans font-bold text-[#6b1a2a] text-[14px] sm:text-[15px]">
                            ₹{product.discountedPrice}
                          </span>
                          <del className="font-sans text-[#8b827d] text-[11px]">
                            ₹{product.price}
                          </del>
                        </>
                      ) : (
                        <span className="font-sans font-bold text-[#6b1a2a] text-[14px] sm:text-[15px] shrink-0">
                          ₹{product.price}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-cormorant text-[#8b827d] text-[12px] leading-[1.3] line-clamp-2 h-[31px]">
                    {product.description}
                  </p>

                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className={`mt-1 h-7 rounded-[6px] font-cormorant font-bold text-[11px] uppercase tracking-wider w-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isAdded
                        ? 'bg-[#2E7D32] text-white scale-98'
                        : 'bg-[#6b1a2a] hover:bg-[#50131f] active:scale-95 text-white shadow-xs'
                    }`}
                    data-name="add-to-cart"
                  >
                    {isAdded ? '✓ Added' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        ) : (
          <div className="bg-white border border-[rgba(107,26,42,0.08)] rounded-2xl p-8 text-center shadow-xs w-full flex flex-col items-center">
            <span className="font-parisienne text-3xl text-[#6b1a2a] block mb-1">
              Boutique Collection
            </span>
            <p className="font-cormorant text-[#8b827d] text-xs max-w-xs mb-3">
              {activeCategory === 'All'
                ? 'No live products yet. Create your first handcrafted charm in the Admin Panel to see it appear here immediately!'
                : `No live products in "${activeCategory}" yet. Add products to this category from the Admin Panel.`}
            </p>
            <Link
              to="/admin"
              className="px-5 py-2 rounded-full bg-[#6b1a2a] text-white font-cormorant font-bold text-xs uppercase tracking-wider hover:bg-[#50131f] transition shadow-xs"
            >
              + Add Product in Admin
            </Link>
          </div>
        )}

        {/* ── LOAD MORE BUTTON ── */}
        {displayedProducts.length < filtered.length && (
          <div className="flex items-center justify-center pt-2" data-node-id="2:324">
            <button
              onClick={handleLoadMore}
              className="bg-white border border-[#6b1a2a] text-[#6b1a2a] hover:bg-[#6b1a2a] hover:text-white px-11 py-2.5 rounded-full font-cormorant font-bold text-[13px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs"
              data-node-id="2:325"
              data-name="load-more-button"
            >
              Load More
            </button>
          </div>
        )}

        {/* ── FABRIC PROMO BANNER ── */}
        <div
          className="bg-[#e6f0fa] border-2 border-[#aec6e4] border-dashed rounded-[16px] px-4 py-3.5 flex gap-3 items-center justify-center text-[#6b1a2a] w-full"
          data-node-id="2:327"
          data-name="fabric-promo-banner"
        >
          <div className="size-5 shrink-0 flex items-center justify-center" data-name="ribbon-bow">
            <img alt="" className="h-4 w-auto block" src={imgRibbonBow} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0" data-name="banner-text">
            <p className="font-sans font-bold text-[13px] sm:text-[14px] uppercase tracking-wide">
              FREE SHIPPING on orders over ₹35
            </p>
            <p className="font-cormorant text-[12px] opacity-85 leading-tight">
              Discount applied automatically at checkout
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
