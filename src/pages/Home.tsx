import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';

const imgPetalisseHomepage = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgRectangle = '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png';
const imgRectangle1 = '/figma-assets/2b39a24648f5a21e9e527dfe97992fd042715209.png';
const imgRectangle2 = '/figma-assets/1908ddbd2af05246c15d1de98d9563a4801070c0.png';
const imgCircleX = '/figma-assets/7b642d06d625e4424c2227fba19b230bf5e9e625.svg';
const imgRose = '/figma-assets/6651ea04a82113b00c24d2d807dd1e8a69558b14.svg';
const imgRibbonDecor = '/figma-assets/83e3dbead479064a1491bf2ee2e2870b124ffba7.svg';
const imgLine = '/figma-assets/cc59bfc996c199663b36f3ef980785829799417a.svg';
const imgCircleX1 = '/figma-assets/30497267791ed37c1ad211ab632d1b7ec2782774.svg';
const imgInstagram = '/figma-assets/61242fa42cf1591147b709b00c26b1201880564e.svg';
const imgCircleX2 = '/figma-assets/bcd9a84b032010459db4a52a7f22c54922a3c2d4.svg';

export default function Home() {
  const { add } = useCart();

  // Selected bestsellers matching the Figma design
  const bestsellers = [
    products.find((p) => p.id === 'rose-garden-charm') || {
      id: 'rose-garden-charm',
      name: 'Rose Garden Charm',
      price: 12,
      img: '/figma-assets/a53065cbd3c94f32f92edb4e749a2fac1e370cbe.png',
      alt: 'Rose Garden Charm',
      category: 'Mobile Charms',
      description: 'Delicate glass rosebuds with matching periwinkle and soft cream beads.',
    },
    products.find((p) => p.id === 'daisy-chain-bag-charm') || {
      id: 'daisy-chain-bag-charm',
      name: 'Daisy Chain Bag Charm',
      price: 15,
      img: '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png',
      alt: 'Daisy Chain Bag Charm',
      category: 'Bag Charms',
      description: 'Intricately woven clay daisy chain adorned with a silky satin ribbon.',
    },
    products.find((p) => p.id === 'surprise-mystery-jar') || {
      id: 'surprise-mystery-jar',
      name: 'Surprise Mystery Jar',
      price: 18,
      img: '/figma-assets/0d22810fc669233e88307889744dc5d3861f800e.png',
      alt: 'Surprise Mystery Jar',
      category: 'Mystery Jars',
      description: 'A whimsical jar containing limited edition charms and tiny sculpted clay sweets.',
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-6 px-4 sm:px-6 pb-28 relative bg-repeat"
      style={{
        backgroundImage: `url("${imgPetalisseHomepage}")`,
        backgroundSize: '153.6px 153.6px',
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
        {/* Flourish: Top Left */}
        <div
          className="absolute -top-1.5 -left-1.5 opacity-85 size-6 pointer-events-none z-10"
          data-node-id="2:123"
          data-name="flourish-top-left"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Top Right */}
        <div
          className="absolute -top-1.5 -right-1.5 opacity-85 size-6 rotate-90 pointer-events-none z-10"
          data-node-id="2:126"
          data-name="flourish-top-right"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Left */}
        <div
          className="absolute -bottom-1.5 -left-1.5 opacity-85 size-6 rotate-180 pointer-events-none z-10"
          data-node-id="2:209"
          data-name="flourish-bottom-left"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Right */}
        <div
          className="absolute -bottom-1.5 -right-1.5 opacity-85 size-6 -rotate-90 pointer-events-none z-10"
          data-node-id="2:212"
          data-name="flourish-bottom-right"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* ── HERO SECTION ── */}
        <section
          className="flex flex-col items-center gap-3 pt-2 pb-1 text-center relative"
          data-node-id="2:129"
          data-name="hero-section"
        >
          {/* Rose Icon */}
          <div
            className="flex items-center justify-center size-10 mb-0.5"
            data-node-id="2:130"
            data-name="rose-mark"
          >
            <img alt="Petalisse Rose" className="size-8 block" src={imgRose} />
          </div>

          {/* Logo Title */}
          <h1
            className="font-parisienne text-[#6b1a2a] text-5xl sm:text-[54px] leading-none tracking-normal select-none"
            data-node-id="2:133"
          >
            Petalisse
          </h1>

          {/* Ribbon Decor */}
          <div
            className="h-4 w-[120px] my-0.5 relative flex items-center justify-center"
            data-node-id="2:134"
            data-name="ribbon-decor"
          >
            <img alt="" className="h-full w-auto max-w-none block" src={imgRibbonDecor} />
          </div>

          {/* Tagline */}
          <p
            className="font-parisienne text-[#8b827d] text-2xl sm:text-[22px] leading-snug"
            data-node-id="2:139"
          >
            Made slowly. Loved endlessly.
          </p>

          {/* Shop Now Button */}
          <Link
            to="/shop"
            className="mt-2 inline-flex items-center justify-center bg-[#6b1a2a] hover:bg-[#50131f] active:scale-95 transition-all text-white font-cormorant font-bold text-sm tracking-wider uppercase px-9 py-3 rounded-full drop-shadow-[0px_4px_6px_rgba(107,26,42,0.25)]"
            data-node-id="2:140"
            data-name="shop-now-button"
          >
            Shop Now
          </Link>
        </section>

        {/* ── OUR COLLECTIONS SECTION ── */}
        <section
          className="flex flex-col gap-4 w-full"
          data-node-id="2:142"
          data-name="categories-section"
        >
          {/* Title with Lines */}
          <div
            className="flex items-center justify-between w-full px-1"
            data-node-id="2:143"
            data-name="Frame"
          >
            <div className="h-px flex-1 max-w-[60px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
            <h2
              className="font-cormorant font-bold text-[#6b1a2a] text-[18px] uppercase tracking-widest text-center px-2"
              data-node-id="2:145"
            >
              Our Collections
            </h2>
            <div className="h-px flex-1 max-w-[60px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
          </div>

          {/* Collections Grid */}
          <div
            className="grid grid-cols-3 gap-3 w-full"
            data-node-id="2:147"
            data-name="categories-grid"
          >
            {/* Mobile Charms */}
            <Link
              to="/shop?category=Mobile+Charms"
              className="group flex flex-col gap-2 items-center"
              data-node-id="2:148"
              data-name="category-card-mobile-charms"
            >
              <div
                className="aspect-[5/6] w-full rounded-xl overflow-hidden border border-[#6b1a2a]/10 bg-[#FAF5F0] shadow-xs group-hover:shadow-md group-hover:scale-[1.02] transition-all"
                data-node-id="2:149"
              >
                <img
                  alt="Mobile Charms"
                  className="size-full object-cover"
                  src={imgRectangle}
                />
              </div>
              <p
                className="font-cormorant font-semibold text-[#6b1a2a] text-sm text-center group-hover:underline"
                data-node-id="2:151"
              >
                Mobile Charms
              </p>
            </Link>

            {/* Bag Charms */}
            <Link
              to="/shop?category=Bag+Charms"
              className="group flex flex-col gap-2 items-center"
              data-node-id="2:152"
              data-name="category-card-bag-charms"
            >
              <div
                className="aspect-[5/6] w-full rounded-xl overflow-hidden border border-[#6b1a2a]/10 bg-[#FAF5F0] shadow-xs group-hover:shadow-md group-hover:scale-[1.02] transition-all"
                data-node-id="2:153"
              >
                <img
                  alt="Bag Charms"
                  className="size-full object-cover"
                  src={imgRectangle1}
                />
              </div>
              <p
                className="font-cormorant font-semibold text-[#6b1a2a] text-sm text-center group-hover:underline"
                data-node-id="2:155"
              >
                Bag Charms
              </p>
            </Link>

            {/* Mystery Jars */}
            <Link
              to="/shop?category=Mystery+Jars"
              className="group flex flex-col gap-2 items-center"
              data-node-id="2:156"
              data-name="category-card-mystery-jars"
            >
              <div
                className="aspect-[5/6] w-full rounded-xl overflow-hidden border border-[#6b1a2a]/10 bg-[#FAF5F0] shadow-xs group-hover:shadow-md group-hover:scale-[1.02] transition-all"
                data-node-id="2:157"
              >
                <img
                  alt="Mystery Jars"
                  className="size-full object-cover"
                  src={imgRectangle2}
                />
              </div>
              <p
                className="font-cormorant font-semibold text-[#6b1a2a] text-sm text-center group-hover:underline"
                data-node-id="2:159"
              >
                Mystery Jars
              </p>
            </Link>
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
              className="font-parisienne text-[#6b1a2a] text-4xl leading-tight"
              data-node-id="2:162"
            >
              Our Favorites
            </h2>
            <p
              className="font-cormorant text-[#8b827d] text-xs uppercase tracking-widest"
              data-node-id="2:163"
            >
              Lovingly Handcrafted Best Sellers
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full" data-node-id="2:164" data-name="bestseller-list">
            {bestsellers.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-[rgba(107,26,42,0.08)] rounded-2xl p-3 flex gap-3 items-center shadow-xs hover:shadow-md transition-all group relative"
                data-name="bestseller-item"
              >
                <Link
                  to={`/product/${product.id}`}
                  className="size-20 rounded-lg overflow-hidden shrink-0 border border-[rgba(107,26,42,0.06)]"
                >
                  <img
                    alt={product.name}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={product.img}
                  />
                </Link>

                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      to={`/product/${product.id}`}
                      className="font-cormorant font-bold text-[#6b1a2a] text-base truncate hover:underline"
                    >
                      {product.name}
                    </Link>
                    <span className="font-sans font-bold text-[#6b1a2a] text-[15px] shrink-0">
                      ₹{product.price}
                    </span>
                  </div>
                  <p className="font-cormorant text-[#8b827d] text-[13px] leading-snug line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-1 flex items-center justify-end">
                    <button
                      onClick={() => add(product)}
                      className="text-[11px] font-cormorant font-bold tracking-wider uppercase text-[#6b1a2a] bg-[#f9d5e5]/50 hover:bg-[#f9d5e5] px-2.5 py-0.5 rounded-full transition-colors"
                      title="Add to cart"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ABOUT SECTION (PINK CARD) ── */}
        <section
          className="bg-[#f9d5e5] border border-[rgba(107,26,42,0.1)] rounded-[20px] p-6 flex flex-col gap-3 items-center text-center"
          data-node-id="2:186"
          data-name="about-section"
        >
          <div className="size-5 shrink-0 opacity-80" data-node-id="2:187" data-name="circle-x">
            <img alt="" className="size-full block" src={imgCircleX1} />
          </div>
          <h3
            className="font-cormorant font-semibold text-[#6b1a2a] text-lg leading-snug"
            data-node-id="2:189"
          >
            Your little handmade corner, with more love in every piece.
          </h3>
          <p
            className="font-cormorant text-[#6b1a2a]/80 text-[13px] leading-relaxed"
            data-node-id="2:190"
          >
            Each charm and jar is patiently sculpted, beaded, and tied in our cozy home studio to bring sweet magic to your daily life.
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
              <img alt="Pinterest" className="size-4 block" src={imgCircleX2} />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="size-8 bg-[#f9d5e5] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              data-name="social-icon-tiktok"
              aria-label="TikTok"
            >
              <img alt="TikTok" className="size-4 block" src={imgCircleX2} />
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
