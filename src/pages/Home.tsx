import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useContent } from '../context/ContentContext';

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
  const [activeCollectionIdx, setActiveCollectionIdx] = useState(0);

  // Ordered collections managed live via Admin Panel CMS
  const orderedCollections = useMemo(() => {
    const order = siteContent.collectionOrder;
    if (!order || !order.length) return ALL_COLLECTIONS;

    return [...ALL_COLLECTIONS].sort((a, b) => {
      const idxA = order.indexOf(a.key);
      const idxB = order.indexOf(b.key);
      const posA = idxA === -1 ? 999 : idxA;
      const posB = idxB === -1 ? 999 : idxB;
      return posA - posB;
    });
  }, [siteContent.collectionOrder]);

  const handleCollectionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) {
      setActiveCollectionIdx(0);
      return;
    }
    const ratio = scrollLeft / maxScroll;
    const index = Math.min(
      orderedCollections.length - 1,
      Math.max(0, Math.round(ratio * (orderedCollections.length - 1)))
    );
    setActiveCollectionIdx(index);
  };

  const scrollToCollection = (idx: number) => {
    if (collectionsScrollRef.current) {
      const maxScroll =
        collectionsScrollRef.current.scrollWidth - collectionsScrollRef.current.clientWidth;
      const targetScroll = (idx / (orderedCollections.length - 1)) * maxScroll;
      collectionsScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
    setActiveCollectionIdx(idx);
  };

  // Selected favorites / bestsellers managed live from Admin Panel DB in exact sequence
  const bestsellers = useMemo(() => {
    // 1. Explicitly selected and ordered in CMS
    const chosenIds = siteContent.bestSellerProductIds || siteContent.featuredProductIds;
    if (chosenIds && chosenIds.length > 0) {
      const ordered = chosenIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as typeof products;
      if (ordered.length > 0) return ordered;
    }
    // 2. Marked as isFavorite in product table
    const marked = products.filter((p) => p.isFavorite);
    if (marked.length > 0) return marked;
    // 3. Fallback to active catalog
    return products.slice(0, 4);
  }, [products, siteContent.bestSellerProductIds, siteContent.featuredProductIds]);


  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-6 px-4 sm:px-6 pb-28 relative bg-[#fdfbf7]"
      style={{
        backgroundColor: '#fdfbf7',
      }}
      data-node-id="2:121"
      data-name="petalisse-homepage"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] p-5 sm:p-7 relative flex flex-col gap-9 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)] bg-[#84c9f13a]"
        style={{
          backgroundColor: '#84c9f13a',
        }}
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
            className="font-meow text-[#6b1a2a] text-6xl sm:text-[70px] leading-none tracking-normal select-none"
            style={{ fontFamily: "'Meow Script', cursive" }}
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
          {/* Header with Decorative Lines */}
          <div className="flex items-center justify-between w-full px-1">
            <div className="h-px flex-1 opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>

            <h2
              className="font-cormorant font-bold text-[#6b1a2a] text-[17px] sm:text-[18px] uppercase tracking-widest text-center px-4 select-none"
              data-node-id="2:145"
            >
              Our Collections
            </h2>

            <div className="h-px flex-1 opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
          </div>

          {/* Slidable Carousel Container */}
          <div
            ref={collectionsScrollRef}
            onScroll={handleCollectionsScroll}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pt-1 px-1 -mx-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            data-name="categories-carousel"
          >
            {orderedCollections.map((col) => {
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

          {/* Dots Indicator for Number of Collections */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5" aria-label="Collections pagination">
            {orderedCollections.map((col, idx) => (
              <button
                key={col.key}
                type="button"
                onClick={() => scrollToCollection(idx)}
                aria-label={`Go to ${col.label}`}
                className={`transition-all rounded-full cursor-pointer ${
                  activeCollectionIdx === idx
                    ? 'w-4 h-1.5 bg-[#6b1a2a]'
                    : 'w-1.5 h-1.5 bg-[#6b1a2a]/30 hover:bg-[#6b1a2a]/60'
                }`}
              />
            ))}
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


        {/* ── ABOUT SECTION (BLUE CARD / PETALISSE STORY CARD) ── */}
        <section
          className="bg-[#e6f0fa] border border-[#aec6e4]/60 rounded-[20px] p-6 flex flex-col gap-3.5 items-center text-center"
          data-node-id="2:186"
          data-name="about-section"
        >
          {/* Small Story Image */}
          <div className="size-16 sm:size-20 rounded-2xl overflow-hidden border-2 border-white shadow-xs shrink-0 bg-white/80 ring-1 ring-[#aec6e4]/60">
            <img
              alt="Petalisse Story"
              src={siteContent.aboutImageUrl || '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png'}
              className="size-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png';
              }}
            />
          </div>

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
              className="font-meow text-[#8b827d] text-3xl"
              style={{ fontFamily: "'Meow Script', cursive" }}
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
              href="https://wa.me/918637373988"
              target="_blank"
              rel="noreferrer"
              className="size-8 bg-[#f9d5e5] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              data-name="social-icon-whatsapp"
              aria-label="WhatsApp"
            >
              <svg className="size-4 fill-[#6b1a2a]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
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
