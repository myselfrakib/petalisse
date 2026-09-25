import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useContent } from '../context/ContentContext';
import { getColorHex } from '../lib/colorUtils';

const imgGinghamBg = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgChevronLeft = '/figma-assets/de70edd513d91ef52fc2c1fa9af3cbf0656b675a.svg';
const imgHeartOff = '/figma-assets/a4218a712707605dca77ea94d626a12e7752a2f9.svg';
const imgStar = '/figma-assets/e5661ff90a08d0ef498b4a8e0cbcf128d63d8c4e.svg';
const imgStarHalf = '/figma-assets/21eb3a9be2d2d7eebdb5e4c0aa1fa59268e30849.svg';
const imgLine = '/figma-assets/e9e84de87b7ae2588d34219b769e2fb5daf39c0e.svg';
const imgRibbonBowVector = '/figma-assets/0626f56c437e6b6a4a08e8852fff1b424c74934c.svg';
const imgInstagram = '/figma-assets/8d964f5cb081cbd1713fd967e91ab8637a48771b.svg';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { products } = useContent();

  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [id, products]);

  // Catalog navigation between products
  const currentIndex = useMemo(() => {
    return products.findIndex((p) => p.id === id);
  }, [products, id]);

  const prevProduct = useMemo(() => {
    if (products.length <= 1) return null;
    const prevIdx = (currentIndex - 1 + products.length) % products.length;
    return products[prevIdx];
  }, [products, currentIndex]);

  const nextProduct = useMemo(() => {
    if (products.length <= 1) return null;
    const nextIdx = (currentIndex + 1) % products.length;
    return products[nextIdx];
  }, [products, currentIndex]);

  const [slideAnim, setSlideAnim] = useState<'left' | 'right' | null>(null);

  const goToProduct = useCallback(
    (targetProduct: (typeof products)[0] | null, direction: 'left' | 'right') => {
      if (!targetProduct || targetProduct.id === product?.id) return;
      setSlideAnim(direction);
      setTimeout(() => {
        navigate(`/product/${targetProduct.id}`);
        setActiveImageIndex(0);
        setQty(1);
        setSlideAnim(null);
      }, 160);
    },
    [navigate, product?.id]
  );

  // Gallery thumbnails
  const gallery = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      const valid = product.images.filter(Boolean);
      if (valid.length > 0) return valid;
    }
    return product.img ? [product.img] : [];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor('');
    }
  }, [product]);

  // Touch and drag swipe detection for sliding images & products
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartXRef.current = clientX;
    touchStartYRef.current = clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartXRef.current === null) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const diffX = clientX - touchStartXRef.current;
    const diffY = clientY - (touchStartYRef.current ?? clientY);

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swiped left -> next
        if (gallery.length > 1 && activeImageIndex < gallery.length - 1) {
          setActiveImageIndex((i) => i + 1);
        } else if (nextProduct) {
          goToProduct(nextProduct, 'left');
        }
      } else {
        // Swiped right -> prev
        if (gallery.length > 1 && activeImageIndex > 0) {
          setActiveImageIndex((i) => i - 1);
        } else if (prevProduct) {
          goToProduct(prevProduct, 'right');
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Keyboard left/right arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        if (gallery.length > 1 && activeImageIndex > 0) {
          setActiveImageIndex((i) => i - 1);
        } else if (prevProduct) {
          goToProduct(prevProduct, 'right');
        }
      } else if (e.key === 'ArrowRight') {
        if (gallery.length > 1 && activeImageIndex < gallery.length - 1) {
          setActiveImageIndex((i) => i + 1);
        } else if (nextProduct) {
          goToProduct(nextProduct, 'left');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gallery.length, activeImageIndex, prevProduct, nextProduct, goToProduct]);

  // Related products horizontal scrolling
  const relatedScrollRef = useRef<HTMLDivElement>(null);
  const scrollRelated = (direction: 'left' | 'right') => {
    if (relatedScrollRef.current) {
      const amount = direction === 'left' ? -220 : 220;
      relatedScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const others = products.filter((p) => p.id !== product.id);
    return others.map((p) => ({
      id: p.id,
      name: p.name,
      price: `₹${p.discountedPrice ?? p.price}`,
      img: p.img || (p.images && p.images[0]) || '',
    }));
  }, [products, product]);

  const handleAddToCart = () => {
    if (!product) return;
    const colorToUse = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);
    add(product, qty, colorToUse);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const colorToUse = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);
    add(product, qty, colorToUse);
    navigate('/cart');
  };

  if (!product) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-[#fdfbf7]" style={{ backgroundColor: '#fdfbf7' }}>
        <div className="max-w-md bg-[#84c9f13a] p-8 rounded-3xl border border-[#6b1a2a]/10 shadow-sm flex flex-col items-center gap-3" style={{ backgroundColor: '#84c9f13a' }}>
          <span className="font-parisienne text-4xl text-[#6b1a2a]">Petalisse</span>
          <h2 className="font-cormorant font-bold text-xl text-[#2C2724]">Product Not Found</h2>
          <p className="font-cormorant text-[#8b827d] text-sm">
            This piece may have been updated or removed from the catalog.
          </p>
          <Link
            to="/shop"
            className="mt-2 px-6 py-2 rounded-full bg-[#6b1a2a] text-white font-cormorant font-bold text-xs uppercase tracking-wider hover:bg-[#50131f] transition"
          >
            Explore Active Catalog &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-5 px-4 sm:px-6 pb-28 relative bg-[#fdfbf7]"
      style={{
        backgroundColor: '#fdfbf7',
      }}
      data-node-id="9:179"
      data-name="petalisse-product-detail"
    >
      {/* Floating Side Slide Buttons for larger screens / desktop */}
      {prevProduct && (
        <button
          type="button"
          onClick={() => goToProduct(prevProduct, 'right')}
          className="hidden md:flex fixed left-[max(1rem,calc(50vw-275px))] top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/95 border border-[#6b1a2a]/20 shadow-lg items-center justify-center text-[#6b1a2a] hover:bg-[#6b1a2a] hover:text-white transition-all cursor-pointer z-30 group active:scale-95"
          title={`Previous Product: ${prevProduct.name}`}
          aria-label="Previous product"
        >
          <img alt="Prev" className="size-4 block group-hover:brightness-200 transition" src={imgChevronLeft} />
        </button>
      )}

      {nextProduct && (
        <button
          type="button"
          onClick={() => goToProduct(nextProduct, 'left')}
          className="hidden md:flex fixed right-[max(1rem,calc(50vw-275px))] top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/95 border border-[#6b1a2a]/20 shadow-lg items-center justify-center text-[#6b1a2a] hover:bg-[#6b1a2a] hover:text-white transition-all cursor-pointer z-30 group active:scale-95"
          title={`Next Product: ${nextProduct.name}`}
          aria-label="Next product"
        >
          <img alt="Next" className="size-4 block rotate-180 group-hover:brightness-200 transition" src={imgChevronLeft} />
        </button>
      )}

      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] px-4 sm:px-5 py-6 relative flex flex-col gap-7 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)] bg-[#84c9f13a]"
        style={{
          backgroundColor: '#84c9f13a',
        }}
        data-node-id="9:180"
        data-name="paper-center-panel"
      >
        {/* ── TOP NAVBAR ── */}
        <header
          className="border-b border-[#6b1a2a]/10 pb-3 flex items-center justify-between w-full"
          data-node-id="9:193"
          data-name="top-navbar"
        >
          <Link
            to="/shop"
            className="bg-[#f9d5e5] rounded-[12px] p-2 size-8 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs"
            data-node-id="9:194"
            data-name="nav-back-button"
            aria-label="Back to shop"
          >
            <img alt="Back" className="size-3.5 block" src={imgChevronLeft} />
          </Link>

          <Link
            to="/"
            className="font-meow text-[#6b1a2a] text-[38px] sm:text-[42px] leading-none hover:opacity-90 tracking-wide select-none"
            style={{ fontFamily: "'Meow Script', cursive" }}
            data-node-id="9:196"
          >
            Petalisse
          </Link>

          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`rounded-[12px] p-2 size-8 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer ${
              isWishlisted ? 'bg-[#6b1a2a] text-white' : 'bg-[#f9d5e5] hover:bg-[#f3bed3]'
            }`}
            data-node-id="9:197"
            data-name="nav-wishlist-button"
            aria-label="Toggle wishlist"
          >
            <img
              alt="Wishlist"
              className={`size-3.5 block transition-all ${
                isWishlisted ? 'filter invert brightness-200' : ''
              }`}
              src={imgHeartOff}
            />
          </button>
        </header>

        {/* ── IMAGE CAROUSEL SECTION (TOUCH & ARROW SLIDABLE) ── */}
        <section
          className={`flex flex-col gap-4 items-center w-full transition-all duration-200 ${
            slideAnim === 'left'
              ? '-translate-x-6 opacity-40'
              : slideAnim === 'right'
              ? 'translate-x-6 opacity-40'
              : 'translate-x-0 opacity-100'
          }`}
          data-node-id="9:199"
          data-name="image-carousel-section"
        >
          {/* Main Hero Image with Slidable Track and Touch Swiping */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            className="aspect-square w-full bg-white border border-[rgba(107,26,42,0.1)] rounded-[20px] overflow-hidden relative shadow-xs select-none cursor-grab active:cursor-grabbing group"
            data-node-id="9:200"
            data-name="hero-image-container"
          >
            {/* Sliding Image Track */}
            <div
              className="flex size-full transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${activeImageIndex * 100}%)`,
              }}
            >
              {gallery.map((imgSrc, idx) => (
                <div key={idx} className="size-full shrink-0 relative">
                  <img
                    alt={`${product.name} - Photo ${idx + 1}`}
                    src={imgSrc}
                    className="size-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Left Slide Arrow (Image or Previous Product) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (gallery.length > 1 && activeImageIndex > 0) {
                  setActiveImageIndex((prev) => prev - 1);
                } else if (prevProduct) {
                  goToProduct(prevProduct, 'right');
                }
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/90 hover:bg-white text-[#6b1a2a] shadow-md flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
              aria-label={
                gallery.length > 1 && activeImageIndex > 0
                  ? 'Previous image'
                  : prevProduct
                  ? `Previous product: ${prevProduct.name}`
                  : 'Previous'
              }
              title={
                gallery.length > 1 && activeImageIndex > 0
                  ? 'Previous image'
                  : prevProduct
                  ? `Previous: ${prevProduct.name}`
                  : 'Previous'
              }
            >
              <img alt="Previous" className="size-3 block" src={imgChevronLeft} />
            </button>

            {/* Right Slide Arrow (Image or Next Product) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (gallery.length > 1 && activeImageIndex < gallery.length - 1) {
                  setActiveImageIndex((prev) => prev + 1);
                } else if (nextProduct) {
                  goToProduct(nextProduct, 'left');
                }
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/90 hover:bg-white text-[#6b1a2a] shadow-md flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
              aria-label={
                gallery.length > 1 && activeImageIndex < gallery.length - 1
                  ? 'Next image'
                  : nextProduct
                  ? `Next product: ${nextProduct.name}`
                  : 'Next'
              }
              title={
                gallery.length > 1 && activeImageIndex < gallery.length - 1
                  ? 'Next image'
                  : nextProduct
                  ? `Next: ${nextProduct.name}`
                  : 'Next'
              }
            >
              <img alt="Next" className="size-3 block rotate-180" src={imgChevronLeft} />
            </button>

            {/* Hint overlay badge */}
            <div className="absolute bottom-2.5 right-2.5 bg-[rgba(253,251,247,0.92)] backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-sans font-medium text-[#6b1a2a] shadow-xs flex items-center gap-1 pointer-events-none z-10">
              <span className="opacity-75">Slide &larr;&rarr;</span>
            </div>
          </div>

          {/* Carousel Dots - only shown if multiple images exist */}
          {gallery.length > 1 && (
            <div
              className="flex items-center justify-center gap-1.5 h-2"
              data-node-id="9:202"
              data-name="carousel-dots"
            >
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'w-4 bg-[#6b1a2a]'
                      : 'w-2 bg-[#6b1a2a]/30 hover:bg-[#6b1a2a]/50'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Thumbnails Row - only shown if multiple images exist */}
          {gallery.length > 1 && (
            <div
              className="flex gap-2 items-center justify-center w-full overflow-x-auto py-1"
              data-node-id="9:207"
              data-name="thumbnails-row"
            >
              {gallery.map((thumb, idx) => {
                const isSelected = activeImageIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-[84px] w-[58px] bg-white rounded-[10px] overflow-hidden shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[2px] border-[#6b1a2a] shadow-xs scale-102 ring-2 ring-[#6b1a2a]/20'
                        : 'border border-[rgba(107,26,42,0.15)] opacity-80 hover:opacity-100'
                    }`}
                    data-name={`thumb-${idx}`}
                  >
                    <img
                      alt=""
                      src={thumb}
                      className="size-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── PRODUCT INFO SECTION ── */}
        <section
          className="flex flex-col gap-3 items-start w-full"
          data-node-id="9:216"
          data-name="product-info-section"
        >
          <h2
            className="font-alex text-[#6b1a2a] text-3xl sm:text-4xl md:text-5xl leading-tight text-left"
            style={{ fontFamily: "'Alex Brush', cursive" }}
            data-node-id="9:217"
          >
            {product.name}
          </h2>

          {/* Rating */}
          <div
            className="flex gap-2 items-center"
            data-node-id="9:218"
            data-name="rating-row"
          >
            <div className="flex gap-0.5 items-center" data-name="stars">
              <img alt="" className="size-3.5 block" src={imgStar} />
              <img alt="" className="size-3.5 block" src={imgStar} />
              <img alt="" className="size-3.5 block" src={imgStar} />
              <img alt="" className="size-3.5 block" src={imgStar} />
              <img alt="" className="size-3.5 block" src={imgStarHalf} />
            </div>
            <span
              className="font-cormorant text-[#8b827d] text-sm"
              data-node-id="9:225"
            >
              4.5 (128 reviews)
            </span>
          </div>

          {/* Price & Savings */}
          <div
            className="flex gap-3 items-center w-full"
            data-node-id="9:226"
            data-name="price-row"
          >
            {product.discountedPrice !== undefined ? (
              <>
                <span
                  className="font-sans font-bold text-[#6b1a2a] text-[28px] leading-none"
                  data-node-id="9:227"
                >
                  ₹{product.discountedPrice}
                </span>
                <span
                  className="font-sans text-[#8b827d] text-base line-through"
                  data-node-id="9:228"
                >
                  ₹{product.price}
                </span>
                <span
                  className="bg-[#f9d5e5] px-2 py-1 rounded-[6px] font-cormorant font-bold text-[#6b1a2a] text-xs leading-none"
                  data-node-id="9:229"
                >
                  Save ₹{(product.price - product.discountedPrice).toFixed(0)}
                </span>
              </>
            ) : (
              <span
                className="font-sans font-bold text-[#6b1a2a] text-[28px] leading-none"
                data-node-id="9:227"
              >
                ₹{product.price}
              </span>
            )}
          </div>
        </section>

        {/* ── QUANTITY AND ACTIONS ── */}
        <section
          className="flex flex-col gap-5 items-start w-full"
          data-node-id="9:240"
          data-name="quantity-and-actions"
        >
          {/* Color Variants Option - Just before Quantity */}
          {product.colors && product.colors.length > 0 && (
            <div
              className="flex flex-col gap-2.5 w-full pb-4 border-b border-[rgba(107,26,42,0.08)]"
              data-name="color-variants-row"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-cormorant font-bold text-[#6b1a2a] text-lg">
                  Color:{' '}
                  <span className="font-sans font-medium text-sm text-[#4A423B]">
                    {selectedColor || product.colors[0]}
                  </span>
                </span>
                <span className="font-sans text-[11px] text-[#8b827d]">
                  {product.colors.length} {product.colors.length === 1 ? 'choice' : 'choices'} available
                </span>
              </div>

              {/* Color Pills & Swatches */}
              <div className="flex flex-wrap gap-2 items-center" data-name="color-options-selector">
                {product.colors.map((color) => {
                  const isSelected = (selectedColor || product.colors![0]) === color;
                  const swatchHex = getColorHex(color);
                  const isWhiteOrCream =
                    swatchHex.toUpperCase() === '#FFFFFF' ||
                    swatchHex.toUpperCase() === '#FFFFF0' ||
                    swatchHex.toUpperCase() === '#FAF9F6';

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-sans transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#6b1a2a] text-white shadow-sm ring-2 ring-[#6b1a2a]/25 font-semibold'
                          : 'bg-white border border-[#DED5C9] text-[#4A423B] hover:border-[#6b1a2a]/40 hover:bg-[#FAF5F0] font-medium'
                      }`}
                      aria-label={`Select color ${color}`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={`size-3.5 rounded-full shrink-0 ${
                          isWhiteOrCream ? 'border border-[#DED5C9]' : ''
                        }`}
                        style={{ backgroundColor: swatchHex }}
                      />
                      <span>{color}</span>
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white shrink-0 ml-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div
            className="flex items-center justify-between w-full"
            data-node-id="9:241"
            data-name="quantity-selector-row"
          >
            <span
              className="font-cormorant font-bold text-[#6b1a2a] text-lg"
              data-node-id="9:242"
            >
              Quantity
            </span>

            <div className="flex items-center" data-name="selector">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="bg-[#fdfbf7] border border-[#6b1a2a] hover:bg-[#faf5f0] h-8 w-9 flex items-center justify-center rounded-l-[8px] font-sans font-bold text-[#6b1a2a] text-base transition-colors cursor-pointer"
                data-name="minus-button"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <div
                className="bg-white border-y border-[#6b1a2a] h-8 w-11 flex items-center justify-center font-sans font-bold text-[#6b1a2a] text-sm"
                data-name="quantity-value"
              >
                {qty}
              </div>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="bg-[#fdfbf7] border border-[#6b1a2a] hover:bg-[#faf5f0] h-8 w-9 flex items-center justify-center rounded-r-[8px] font-sans font-bold text-[#6b1a2a] text-base transition-colors cursor-pointer"
                data-name="plus-button"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex gap-3 items-center w-full"
            data-node-id="9:250"
            data-name="action-buttons-row"
          >
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3.5 rounded-full font-cormorant font-bold text-base uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                addedNotice
                  ? 'bg-[#2E7D32] text-white border-2 border-[#2E7D32]'
                  : 'bg-white border-[1.5px] border-[#6b1a2a] text-[#6b1a2a] hover:bg-[#6b1a2a] hover:text-white shadow-xs'
              }`}
              data-name="add-to-cart-button"
            >
              {addedNotice ? '✓ Added' : 'Add to Cart'}
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 py-3.5 rounded-full bg-[#6b1a2a] hover:bg-[#50131f] active:scale-98 text-white font-cormorant font-bold text-base uppercase tracking-wider shadow-sm transition-all duration-200 cursor-pointer"
              data-name="buy-now-button"
            >
              Buy Now
            </button>
          </div>
        </section>

        {/* ── DESCRIPTION SECTION ── */}
        <section
          className="flex flex-col gap-3 items-start w-full text-left"
          data-node-id="9:231"
          data-name="description-section"
        >
          <h3
            className="font-cormorant font-bold text-[#6b1a2a] text-xl"
            data-node-id="9:232"
          >
            Description
          </h3>
          <p
            className="font-cormorant text-[#8b827d] text-[15px] leading-[1.5] whitespace-pre-line"
            data-node-id="9:233"
          >
            {product.description || 'A delicate handcrafted piece made with love and care.'}
          </p>
          {product.details && product.details.length > 0 && (
            <div
              className="flex flex-col gap-1.5 font-cormorant text-[#8b827d] text-[15px]"
              data-node-id="9:234"
              data-name="bullet-points"
            >
              {product.details.map((detail, idx) => (
                <p key={idx}>• {detail}</p>
              ))}
            </div>
          )}
        </section>

        {/* ── BOW DIVIDER ── */}
        <div
          className="flex items-center justify-center gap-2 w-full py-1 opacity-80"
          data-node-id="9:255"
          data-name="bow-divider-row"
        >
          <div className="h-px flex-1 max-w-[100px]">
            <img alt="" className="size-full block" src={imgLine} />
          </div>
          <div className="size-5 shrink-0 flex items-center justify-center">
            <img alt="" className="size-full block" src={imgRibbonBowVector} />
          </div>
          <div className="h-px flex-1 max-w-[100px]">
            <img alt="" className="size-full block" src={imgLine} />
          </div>
        </div>

        {/* ── RELATED PRODUCTS: YOU MAY ALSO LIKE ── */}
        <section
          className="flex flex-col gap-4 items-start w-full relative"
          data-node-id="9:260"
          data-name="related-products-section"
        >
          <div className="flex items-center justify-between w-full">
            <h3
              className="font-alex text-[#6b1a2a] text-[36px] sm:text-[42px] text-center w-full"
              style={{ fontFamily: "'Alex Brush', cursive" }}
              data-node-id="9:261"
            >
              You May Also Like
            </h3>
          </div>

          {/* Slidable Related Products Track with Left & Right arrows */}
          <div className="relative w-full flex items-center">
            {/* Left slide arrow */}
            <button
              type="button"
              onClick={() => scrollRelated('left')}
              className="absolute -left-2 z-20 size-7 rounded-full bg-white/95 border border-[#6b1a2a]/20 shadow-md flex items-center justify-center text-[#6b1a2a] hover:bg-[#6b1a2a] hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Slide related products left"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Horizontal scrolling row */}
            <div
              ref={relatedScrollRef}
              className="flex gap-3 items-start overflow-x-auto w-full pb-2 px-1 scroll-smooth select-none cursor-grab active:cursor-grabbing"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              data-node-id="9:262"
              data-name="horizontal-scroll"
            >
              {relatedProducts.map((item, idx) => (
                <Link
                  key={idx}
                  to={`/product/${item.id}`}
                  className="bg-white border border-[rgba(107,26,42,0.1)] rounded-[16px] p-2.5 w-[120px] shrink-0 flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  data-name={`related-card-${idx}`}
                >
                  <div className="aspect-square w-full rounded-[10px] overflow-hidden bg-[#FAF5F0]">
                    <img
                      alt={item.name}
                      src={item.img}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 text-left">
                    <p
                      className="font-alex text-[#6b1a2a] text-[17px] truncate group-hover:underline leading-tight"
                      style={{ fontFamily: "'Alex Brush', cursive" }}
                    >
                      {item.name}
                    </p>
                    <p className="font-sans font-bold text-[#6b1a2a] text-[12px]">
                      {item.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Right slide arrow */}
            <button
              type="button"
              onClick={() => scrollRelated('right')}
              className="absolute -right-2 z-20 size-7 rounded-full bg-white/95 border border-[#6b1a2a]/20 shadow-md flex items-center justify-center text-[#6b1a2a] hover:bg-[#6b1a2a] hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Slide related products right"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        {/* ── FOOTER SECTION ── */}
        <footer
          className="border-t border-[rgba(107,26,42,0.1)] pt-6 flex flex-col gap-5 items-center text-center w-full"
          data-node-id="9:287"
          data-name="footer-section"
        >
          <div className="flex flex-col gap-1 items-center" data-name="footer-brand">
            <h4 className="font-parisienne text-[#6b1a2a] text-[34px] leading-none">
              Petalisse
            </h4>
            <p className="font-cormorant text-[#8b827d] text-[15px]">
              Your little handmade corner
            </p>
          </div>

          {/* Navigation links */}
          <div
            className="flex flex-wrap gap-4 items-center justify-center font-cormorant font-bold text-[#6b1a2a] text-[13px] uppercase tracking-wider"
            data-name="footer-navigation"
          >
            <Link to="/shop" className="hover:opacity-75">
              Shop
            </Link>
            <Link to="/" className="hover:opacity-75">
              About
            </Link>
            <a href="mailto:hello@petalisse.com" className="hover:opacity-75">
              Contact
            </a>
            <Link to="/shop" className="hover:opacity-75">
              FAQ
            </Link>
          </div>

          {/* Social Icons */}
          <div
            className="flex gap-3 items-center justify-center"
            data-name="footer-social"
          >
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[#f9d5e5] rounded-full size-9 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Instagram"
            >
              <img alt="Instagram" className="size-4 block" src={imgInstagram} />
            </a>
            <a
              href="https://wa.me/918637373988"
              target="_blank"
              rel="noreferrer"
              className="bg-[#f9d5e5] rounded-full size-9 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="WhatsApp"
            >
              <svg className="size-4 fill-[#6b1a2a]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[#f9d5e5] rounded-full size-9 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Pinterest"
            >
              <svg className="size-4 fill-[#6b1a2a]" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.546.535 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>

          <div className="flex flex-col gap-1 items-center" data-name="footer-bottom">
            <p className="font-cormorant font-bold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
              SMALL DETAILS. BIG PERSONALITY.
            </p>
            <p className="font-cormorant text-[#8b827d] text-xs">
              © 2024 Petalisse. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
