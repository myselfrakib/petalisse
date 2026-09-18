import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';

const imgGinghamBg = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgCircleX = '/figma-assets/020e894ad6dbaa5c1e3c88736940d78054819b79.svg';
const imgChevronLeft = '/figma-assets/de70edd513d91ef52fc2c1fa9af3cbf0656b675a.svg';
const imgHeartOff = '/figma-assets/a4218a712707605dca77ea94d626a12e7752a2f9.svg';
const imgStar = '/figma-assets/e5661ff90a08d0ef498b4a8e0cbcf128d63d8c4e.svg';
const imgStarHalf = '/figma-assets/21eb3a9be2d2d7eebdb5e4c0aa1fa59268e30849.svg';
const imgLine = '/figma-assets/e9e84de87b7ae2588d34219b769e2fb5daf39c0e.svg';
const imgRibbonBowVector = '/figma-assets/0626f56c437e6b6a4a08e8852fff1b424c74934c.svg';
const imgInstagram = '/figma-assets/8d964f5cb081cbd1713fd967e91ab8637a48771b.svg';
const imgMusic = '/figma-assets/bad5b028c25c88ade4fa563979c8b804247d22b8.svg';
const imgCircleX1 = '/figma-assets/308ef628d1b5e18cac6185631e5e1b57d6dfdf25.svg';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();

  const product = useMemo(() => {
    return products.find((p) => p.id === id) || products[0];
  }, [id]);

  // Gallery thumbnails
  const gallery = useMemo(() => {
    const defaultGallery = [
      product.img,
      '/figma-assets/aac1d8d4d024ee6d6c049df2d059dfd80fda2226.png',
      '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png',
      '/figma-assets/e8a9f4c7977ea3291af5fdf421b0c3f7801f21ed.png',
    ];
    return defaultGallery;
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // Related products from Figma design
  const relatedProducts = [
    {
      id: 'lavender-dreams',
      name: 'Lavender Dreams',
      price: '₹1,149',
      img: '/figma-assets/aac1d8d4d024ee6d6c049df2d059dfd80fda2226.png',
    },
    {
      id: 'daisy-chain-bag-charm',
      name: 'Daisy Chain',
      price: '₹1,249',
      img: '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png',
    },
    {
      id: 'velvet-bow-charm',
      name: 'Velvet Bow',
      price: '₹1,099',
      img: '/figma-assets/e8a9f4c7977ea3291af5fdf421b0c3f7801f21ed.png',
    },
    {
      id: 'pearl-blossom-charm',
      name: 'Pearl Blossom',
      price: '₹1,349',
      img: '/figma-assets/87b1093b8bc8eafb7fbcb5d50ec202299799a5b5.png',
    },
  ];

  const handleAddToCart = () => {
    add(product, qty);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNow = () => {
    add(product, qty);
    navigate('/cart');
  };

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
        {/* Flourish: Top Left */}
        <div
          className="absolute -top-1.5 -left-1.5 opacity-85 size-6 pointer-events-none z-10"
          data-node-id="9:181"
          data-name="flourish-top-left"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Top Right */}
        <div
          className="absolute -top-1.5 -right-1.5 opacity-85 size-6 rotate-90 pointer-events-none z-10"
          data-node-id="9:184"
          data-name="flourish-top-right"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Left */}
        <div
          className="absolute -bottom-1.5 -left-1.5 opacity-85 size-6 rotate-180 pointer-events-none z-10"
          data-node-id="9:187"
          data-name="flourish-bottom-left"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Right */}
        <div
          className="absolute -bottom-1.5 -right-1.5 opacity-85 size-6 -rotate-90 pointer-events-none z-10"
          data-node-id="9:190"
          data-name="flourish-bottom-right"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

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
            className="font-parisienne text-[#6b1a2a] text-[32px] leading-none hover:opacity-90"
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
            className="aspect-square w-full bg-white border border-[rgba(107,26,42,0.1)] rounded-[20px] overflow-hidden relative shadow-xs"
            data-node-id="9:200"
            data-name="hero-image-container"
          >
            <img
              alt={product.name}
              src={gallery[activeImageIndex]}
              className="size-full object-cover transition-all duration-300"
            />
          </div>

          {/* Carousel Dots */}
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

          {/* Thumbnails Row */}
          <div
            className="flex gap-2 items-center justify-center w-full"
            data-node-id="9:207"
            data-name="thumbnails-row"
          >
            {gallery.map((thumb, idx) => {
              const isSelected = activeImageIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-[96px] w-[60px] bg-white rounded-[10px] overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[2px] border-[#6b1a2a] shadow-xs scale-102'
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
        </section>

        {/* ── PRODUCT INFO SECTION ── */}
        <section
          className="flex flex-col gap-3 items-start w-full"
          data-node-id="9:216"
          data-name="product-info-section"
        >
          <h2
            className="font-parisienne text-[#6b1a2a] text-4xl leading-tight text-left"
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
            <span
              className="font-sans font-bold text-[#6b1a2a] text-[28px] leading-none"
              data-node-id="9:227"
            >
              ₹999
            </span>
            <span
              className="font-sans text-[#8b827d] text-base line-through"
              data-node-id="9:228"
            >
              ₹1,299
            </span>
            <span
              className="bg-[#f9d5e5] px-2 py-1 rounded-[6px] font-cormorant font-bold text-[#6b1a2a] text-xs leading-none"
              data-node-id="9:229"
              data-name="save-badge"
            >
              Save 23%
            </span>
          </div>
        </section>

        {/* ── QUANTITY AND ACTIONS ── */}
        <section
          className="flex flex-col gap-5 items-start w-full"
          data-node-id="9:240"
          data-name="quantity-and-actions"
        >
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
            className="font-cormorant text-[#8b827d] text-[15px] leading-[1.5]"
            data-node-id="9:233"
          >
            A delicate handmade phone charm featuring miniature roses crafted from polymer clay, adorned with glass beads and finished with a satin ribbon bow. Each piece is unique and made with love.
          </p>
          <div
            className="flex flex-col gap-1.5 font-cormorant text-[#8b827d] text-[15px]"
            data-node-id="9:234"
            data-name="bullet-points"
          >
            <p>• Handmade polymer clay roses</p>
            <p>• Glass bead accents</p>
            <p>• Satin ribbon bow detail</p>
            <p>• Approx. 12cm length</p>
            <p>• Clip-on attachment</p>
          </div>
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
                  <p className="font-cormorant font-bold text-[#6b1a2a] text-[13px] truncate group-hover:underline">
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
              <img alt="Pinterest" className="size-4 block" src={imgCircleX1} />
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
