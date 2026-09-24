import { useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useContent } from '../context/ContentContext';

const imgPetalisseHomepage = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgRectangle = '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png';
const imgRectangle1 = '/figma-assets/2b39a24648f5a21e9e527dfe97992fd042715209.png';
const imgRectangle2 = '/figma-assets/1908ddbd2af05246c15d1de98d9563a4801070c0.png';
const imgRose = '/figma-assets/6651ea04a82113b00c24d2d807dd1e8a69558b14.svg';
const imgLine = '/figma-assets/cc59bfc996c199663b36f3ef980785829799417a.svg';
const imgInstagram = '/figma-assets/61242fa42cf1591147b709b00c26b1201880564e.svg';

const ALL_COLLECTIONS = [
  {
    key: 'Mobile Charms',
    label: 'Mobile Charms',
    defaultImg: '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png',
  },
  {
    key: 'Bag Charms',
    label: 'Bag Charms',
    defaultImg: '/figma-assets/2b39a24648f5a21e9e527dfe97992fd042715209.png',
  },
  {
    key: 'Mystery Jars',
    label: 'Mystery Jars',
    defaultImg: '/figma-assets/1908ddbd2af05246c15d1de98d9563a4801070c0.png',
  },
  {
    key: 'Jewellery',
    label: 'Jewellery',
    defaultImg: '/figma-assets/aac1d8d4d024ee6d6c049df2d059dfd80fda2226.png',
  },
  {
    key: 'Hair Accessories',
    label: 'Hair Accessories',
    defaultImg: '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png',
  },
  {
    key: 'Desk & Room Decor',
    label: 'Desk & Room Decor',
    defaultImg: '/figma-assets/e8a9f4c7977ea3291af5fdf421b0c3f7801f21ed.png',
  },
  {
    key: 'Cute Functional Things',
    label: 'Cute Functional Things',
    defaultImg: '/figma-assets/a53065cbd3c94f32f92edb4e749a2fac1e370cbe.png',
  },
];

export default function Home() {
  const { add } = useCart();
  const { products, siteContent } = useContent();
  const collectionsScrollRef = useRef<HTMLDivElement>(null);

  const scrollCollections = (direction: 'left' | 'right') => {
    if (collectionsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      collectionsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Selected favorites / bestsellers managed live from Admin Panel DB
  const bestsellers = useMemo(() => {
    // 1. Explicitly selected in CMS
    if (siteContent.featuredProductIds && siteContent.featuredProductIds.length > 0) {
      const selected = siteContent.featuredProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as typeof products;
      if (selected.length > 0) return selected;
    }
    // 2. Marked as isFavorite in product table
    const marked = products.filter((p) => p.isFavorite);
    if (marked.length > 0) return marked;
    // 3. Fallback to active catalog
    return products.slice(0, 4);
  }, [products, siteContent.featuredProductIds]);


  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-6 px-4 sm:px-6 pb-28 relative"
      style={{
        backgroundColor: '#84c9f13a',
      }}
      data-node-id="2:121"
      data-name="petalisse-homepage"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] bg-[#fdfbf7] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] p-5 sm:p-7 relative flex flex-col gap-9 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)]"
        data-node-id="2:122"
        data-name="paper-center-panel"
      >
        {/* ── HERO SECTION ── */}
        <section
          className="flex flex-col items-center gap-3 pt-2 pb-1 text-center relative"
          data-node-id="2:129"
          data-name="hero-section"
        >
          {/* Logo Title */}
          <h1
            className="font-parisienne text-[#6b1a2a] text-5xl sm:text-[54px] leading-none tracking-normal select-none"
            data-node-id="2:133"
          >
            Petalisse
          </h1>

          {/* Sub-heading: Small details 🌹 big Personality!! */}
          <p
            className="font-cormorant font-bold text-[#6b1a2a] text-[16px] sm:text-[17px] tracking-wider flex items-center justify-center gap-2 select-none"
            data-node-id="2:139"
          >
            <span>Small details</span>
            <img alt="Petalisse Rose" className="size-4.5 sm:size-5 block shrink-0 object-contain" src={imgRose} />
            <span>big Personality!!</span>
          </p>
        </section>

        {/* ── OUR COLLECTIONS SECTION (SLIDABLE CAROUSEL) ── */}
        <section
          className="flex flex-col gap-3.5 w-full relative"
          data-node-id="2:142"
          data-name="categories-section"
        >
          {/* Header with Lines and Scroll Controls */}
          <div className="flex items-center justify-between w-full px-1">
            <div className="h-px flex-1 max-w-[36px] sm:max-w-[50px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCollections('left')}
                className="size-7 rounded-full bg-white border border-[#6b1a2a]/15 text-[#6b1a2a] hover:bg-[#FAF5F0] hover:border-[#6b1a2a]/30 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                aria-label="Scroll collections left"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h2
                className="font-cormorant font-bold text-[#6b1a2a] text-[17px] sm:text-[18px] uppercase tracking-widest text-center px-1 select-none"
                data-node-id="2:145"
              >
                Our Collections
              </h2>

              <button
                type="button"
                onClick={() => scrollCollections('right')}
                className="size-7 rounded-full bg-white border border-[#6b1a2a]/15 text-[#6b1a2a] hover:bg-[#FAF5F0] hover:border-[#6b1a2a]/30 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                aria-label="Scroll collections right"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="h-px flex-1 max-w-[36px] sm:max-w-[50px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
          </div>

          {/* Slidable Carousel Container */}
          <div
            ref={collectionsScrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pt-1 px-1 -mx-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            data-name="categories-carousel"
          >
            {ALL_COLLECTIONS.map((col) => {
              const coverImg = siteContent.collectionCovers?.[col.key] || col.defaultImg;

              return (
                <Link
                  key={col.key}
                  to={`/shop?category=${encodeURIComponent(col.key)}`}
                  className="group flex flex-col gap-2 items-center w-[112px] sm:w-[124px] shrink-0 snap-start"
                  data-name={`category-card-${col.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <div className="aspect-[5/6] w-full rounded-2xl overflow-hidden border border-[#6b1a2a]/12 bg-[#FAF5F0] shadow-xs group-hover:shadow-md group-hover:scale-[1.03] transition-all relative">
                    <img
                      alt={col.label}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={coverImg}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = col.defaultImg;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] sm:text-sm text-center leading-tight line-clamp-2 px-0.5 group-hover:underline">
                    {col.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── OUR FAVORITES SECTION ── */}
        <section
          className="flex flex-col gap-4 w-full"
          data-node-id="2:160"
          data-name="bestsellers-section"
        >
          <div className="flex flex-col gap-0.5 items-center text-center" data-node-id="2:161">
            <h2
              className="font-cormorant font-bold text-[#6b1a2a] text-2xl sm:text-[26px] tracking-wider select-none"
              data-node-id="2:162"
            >
              Best Sellers
            </h2>
            <p
              className="font-cormorant text-[#8b827d] text-xs uppercase tracking-widest"
              data-node-id="2:163"
            >
              Lovingly Handcrafted Best Sellers
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full" data-node-id="2:164" data-name="bestseller-list">
            {bestsellers.length > 0 ? (
              bestsellers.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-[rgba(107,26,42,0.08)] rounded-2xl p-3 flex gap-3 items-center shadow-xs hover:shadow-md transition-all group relative"
                  data-name="bestseller-item"
                >
                  <Link
                    to={`/product/${product.id}`}
                    className="size-20 rounded-lg overflow-hidden shrink-0 border border-[rgba(107,26,42,0.06)] relative block"
                  >
                    <img
                      alt={product.name}
                      className={`size-full object-cover transition-all duration-300 ${
                        product.images && product.images.length > 1
                          ? 'group-hover:opacity-0 group-hover:scale-105'
                          : 'group-hover:scale-105'
                      }`}
                      src={product.img || product.images?.[0]}
                    />
                    {product.images && product.images.length > 1 && product.images[1] && (
                      <img
                        alt={product.name}
                        src={product.images[1]}
                        className="size-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                    )}
                    {product.images && product.images.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-sans px-1 rounded-sm pointer-events-none">
                        {product.images.length}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        to={`/product/${product.id}`}
                        className="font-cormorant font-bold text-[#6b1a2a] text-base truncate hover:underline"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {product.discountedPrice !== undefined ? (
                          <>
                            <span className="font-sans font-bold text-[#6b1a2a] text-[15px]">
                              ₹{product.discountedPrice}
                            </span>
                            <del className="font-sans text-[#8b827d] text-xs">
                              ₹{product.price}
                            </del>
                          </>
                        ) : (
                          <span className="font-sans font-bold text-[#6b1a2a] text-[15px]">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-cormorant text-[#8b827d] text-[13px] leading-snug line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-1 flex items-center justify-end">
                      <button
                        onClick={() => add(product)}
                        className="text-[11px] font-cormorant font-bold tracking-wider uppercase text-[#6b1a2a] bg-[#f9d5e5]/50 hover:bg-[#f9d5e5] px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                        title="Add to cart"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-[rgba(107,26,42,0.08)] rounded-2xl p-6 text-center shadow-xs">
                <span className="font-parisienne text-2xl text-[#6b1a2a] block mb-1">
                  Artisan Studio
                </span>
                <p className="font-cormorant text-[#8b827d] text-xs">
                  Showing live boutique inventory. Add your handcrafted charms in the Admin Panel to feature them here!
                </p>
                <Link
                  to="/admin"
                  className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#6b1a2a]/10 hover:bg-[#6b1a2a]/20 text-[#6b1a2a] font-cormorant font-bold text-xs uppercase tracking-wider transition"
                >
                  Admin Console &rarr;
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── PROMO BANNER SECTION (LIVE CMS) ── */}
        {(siteContent.promoBannerText || siteContent.promoBannerUrl) && (
          <section className="relative overflow-hidden rounded-[20px] border border-[#6b1a2a]/10 bg-gradient-to-br from-[#FAF0ED] to-[#FDF5F2] p-5 shadow-xs">
            {siteContent.promoBannerUrl && (
              <div className="w-full h-36 rounded-xl overflow-hidden mb-3 border border-[#6b1a2a]/10">
                <img
                  src={siteContent.promoBannerUrl}
                  alt={siteContent.promoBannerText || 'Promo Banner'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/figma-assets/2b39a24648f5a21e9e527dfe97992fd042715209.png';
                  }}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5 text-center">
              <span className="font-cormorant font-bold text-[#6b1a2a] text-lg uppercase tracking-wider">
                {siteContent.promoBannerText || 'Crafted for the Dreamers & Collectors'}
              </span>
              <p className="font-cormorant text-[#8b827d] text-xs leading-relaxed">
                {siteContent.promoBannerSubtext || 'Each charm carries its own gentle story, sculpted by hand with delicate intention and finished with artisanal ribbon.'}
              </p>
              <div className="mt-2 flex justify-center">
                <Link
                  to="/shop"
                  className="inline-flex items-center text-[11px] font-cormorant font-bold tracking-widest uppercase text-white bg-[#6b1a2a] px-4 py-1.5 rounded-full hover:bg-[#50131f] transition-all"
                >
                  Explore Collection &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}


        {/* ── ABOUT SECTION (BLUE CARD) ── */}
        <section
          className="bg-[#e6f0fa] border border-[#aec6e4]/60 rounded-[20px] p-6 flex flex-col gap-3 items-center text-center"
          data-node-id="2:186"
          data-name="about-section"
        >
          <h3
            className="font-cormorant font-semibold text-[#6b1a2a] text-lg leading-snug"
            data-node-id="2:189"
          >
            {siteContent.aboutTitle || 'Your little handmade corner, with more love in every piece.'}
          </h3>
          <p
            className="font-cormorant text-[#6b1a2a]/80 text-[13px] leading-relaxed"
            data-node-id="2:190"
          >
            {siteContent.aboutDescription || 'Each charm and jar is patiently sculpted, beaded, and tied in our cozy home studio to bring sweet magic to your daily life.'}
          </p>
        </section>

        {/* ── FABRIC BANNER (DASHED BOX) ── */}
        <section
          className="bg-white border-2 border-[#e28fa9] border-dashed rounded-2xl px-3 py-4 flex flex-col gap-2.5 items-center text-center w-full"
          data-node-id="2:191"
          data-name="fabric-banner"
        >
          <p
            className="font-cormorant font-bold text-[#6b1a2a] text-sm uppercase tracking-wider"
            data-node-id="2:192"
          >
            MADE BY HAND. MADE TO BE YOURS.
          </p>
          <p
            className="font-cormorant text-[#8b827d] text-xs leading-relaxed"
            data-node-id="2:193"
          >
            Beaded • Clay • Woolen • Hair Accessories • Bag Charms • Hair Ties
          </p>
        </section>

        {/* ── FOOTER SECTION ── */}
        <footer
          className="border-t border-[rgba(107,26,42,0.1)] pt-5 flex flex-col gap-6 items-center text-center w-full"
          data-node-id="2:194"
          data-name="footer-section"
        >
          <div className="flex flex-col gap-1.5 items-center">
            <p
              className="font-cormorant font-bold text-[#6b1a2a] text-[15px] uppercase tracking-widest"
              data-node-id="2:196"
            >
              SMALL DETAILS. BIG PERSONALITY.
            </p>
            <p
              className="font-parisienne text-[#8b827d] text-2xl"
              data-node-id="2:197"
            >
              - Petalisse -
            </p>
          </div>

          {/* Social Links */}
          <div
            className="flex gap-4 items-center justify-center"
            data-node-id="2:198"
            data-name="social-links"
          >
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="size-8 bg-[#f9d5e5] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              data-name="social-icon-instagram"
              aria-label="Instagram"
            >
              <img alt="Instagram" className="size-4 block" src={imgInstagram} />
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noreferrer"
              className="size-8 bg-[#f9d5e5] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              data-name="social-icon-pinterest"
              aria-label="Pinterest"
            >
              <svg className="size-4 fill-[#6b1a2a]" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.546.535 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="size-8 bg-[#f9d5e5] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              data-name="social-icon-tiktok"
              aria-label="TikTok"
            >
              <svg className="size-4 fill-[#6b1a2a]" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3.14 15.7a6.34 6.34 0 0 0 10.86 4.43 6.27 6.27 0 0 0 1.9-4.48V8.75a8.16 8.16 0 0 0 4.79 1.54V6.85a4.85 4.85 0 0 1-1.1-.16z" />
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <p
            className="font-cormorant text-[#8b827d] text-xs"
            data-node-id="2:208"
          >
            © Petalisse 2024. Lovingly made.
          </p>
        </footer>
      </main>
    </div>
  );
}
