import { useState, useMemo, useEffect } from 'react';
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
const imgMusic = '/figma-assets/bad5b028c25c88ade4fa563979c8b804247d22b8.svg';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { products } = useContent();

  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [id, products]);

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

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const others = products.filter((p) => p.id !== product.id);
    return others.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      price: `₹${p.discountedPrice ?? p.price}`,
      img: p.img,
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-[#FAF5F0]">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-[#6b1a2a]/10 shadow-sm flex flex-col items-center gap-3">
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
      className="min-h-screen w-full flex flex-col items-center justify-start py-5 px-4 sm:px-6 pb-28 relative bg-repeat"
      style={{
        backgroundImage: `url("${imgGinghamBg}")`,
        backgroundSize: '153.6px 153.6px',
      }}
      data-node-id="9:179"
      data-name="petalisse-product-detail"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] bg-[#fdfbf7] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] px-4 sm:px-5 py-6 relative flex flex-col gap-8 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)]"
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

        {/* ── IMAGE CAROUSEL SECTION ── */}
        <section
          className="flex flex-col gap-4 items-center w-full"
          data-node-id="9:199"
          data-name="image-carousel-section"
        >
          {/* Main Hero Image */}
          <div
            className="aspect-square w-full bg-white border border-[rgba(107,26,42,0.1)] rounded-[20px] overflow-hidden relative shadow-xs group"
            data-node-id="9:200"
            data-name="hero-image-container"
          >
            <img
              alt={product.name}
              src={gallery[activeImageIndex] || gallery[0] || product.img}
              className="size-full object-cover transition-all duration-300"
            />
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/85 hover:bg-white text-[#6b1a2a] shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Previous image"
                >
                  <img alt="Previous" className="size-3 block" src={imgChevronLeft} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/85 hover:bg-white text-[#6b1a2a] shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Next image"
                >
                  <img alt="Next" className="size-3 block rotate-180" src={imgChevronLeft} />
                </button>
              </>
            )}
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
            className="font-sans font-semibold text-[#6b1a2a] text-2xl sm:text-3xl leading-snug text-left tracking-tight"
            style={{ fontFamily: "'Inter', sans-serif" }}
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
          className="flex flex-col gap-4 items-start w-full"
          data-node-id="9:260"
          data-name="related-products-section"
        >
          <h3
            className="font-parisienne text-[#6b1a2a] text-[32px] text-center w-full"
            data-node-id="9:261"
          >
            You May Also Like
          </h3>

          {/* Horizontal scrolling row */}
          <div
            className="flex gap-3 items-start overflow-x-auto w-full pb-2 scrollbar-none"
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
                    className="font-sans font-semibold text-[#6b1a2a] text-[13px] truncate group-hover:underline"
                    style={{ fontFamily: "'Inter', sans-serif" }}
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
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[#f9d5e5] rounded-full size-9 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="TikTok"
            >
              <img alt="TikTok" className="size-4 block" src={imgMusic} />
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
