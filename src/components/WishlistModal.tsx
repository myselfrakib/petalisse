import React, { useState } from 'react';
import { Link } from 'react-router';
import { useWishlist } from '../context/WishlistContext';
import { useContent } from '../context/ContentContext';
import { useCart } from '../context/CartContext';
import { LazyImage } from './LazyImage';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({ isOpen, onClose }) => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { products } = useContent();
  const { add } = useCart();
  const [addedWishlistId, setAddedWishlistId] = useState<string | null>(null);
  const [addedAll, setAddedAll] = useState(false);

  if (!isOpen) return null;

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddToCart = (e: React.MouseEvent, prod: (typeof products)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    add(prod);
    setAddedWishlistId(prod.id);
    setTimeout(() => setAddedWishlistId((curr) => (curr === prod.id ? null : curr)), 1200);
  };

  const handleAddAllToCart = () => {
    wishlistProducts.forEach((p) => add(p));
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      {/* Background click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[420px] max-h-[85vh] bg-[#FAF7F2] rounded-[24px] border border-[#E8E0D5] shadow-2xl flex flex-col overflow-hidden z-10 animate-scale-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#6b1a2a]/10 flex items-center justify-between bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-full bg-[#f9d5e5] text-[#6b1a2a] flex items-center justify-center shadow-xs">
              <svg className="size-4 fill-[#6b1a2a]" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <div>
              <h3 className="font-cormorant font-bold text-[#6b1a2a] text-lg leading-tight uppercase tracking-wider">
                My Wishlist
              </h3>
              <p className="text-[11px] text-[#786F66]">
                {wishlistProducts.length === 1 ? '1 charm saved' : `${wishlistProducts.length} charms saved`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF0ED] text-[#786F66] hover:text-[#6b1a2a] transition cursor-pointer"
            aria-label="Close Wishlist"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {wishlistProducts.length === 0 ? (
            <div className="py-10 px-4 text-center bg-white/70 rounded-2xl border border-dashed border-[#DED5C9] space-y-3">
              <div className="size-12 rounded-full bg-[#f9d5e5] text-[#6b1a2a] flex items-center justify-center mx-auto text-xl shadow-xs">
                ❤️
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#2C2724]">Your Wishlist is Empty</h4>
                <p className="text-xs text-[#786F66] mt-1 font-cormorant max-w-xs mx-auto">
                  Click the heart icon on any charm while browsing the shop to save your favorites here.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-block px-5 py-2 rounded-full bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer active:scale-95"
              >
                Explore Charms
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlistProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-2xl bg-white border border-[rgba(107,26,42,0.08)] shadow-2xs flex items-center gap-3 hover:border-[#6b1a2a]/30 transition group"
                >
                  <Link
                    to={`/product/${prod.id}`}
                    onClick={onClose}
                    className="size-16 rounded-xl overflow-hidden shrink-0 border border-[rgba(107,26,42,0.1)] bg-[#FAF5F0] block relative"
                  >
                    <LazyImage
                      alt={prod.name}
                      src={prod.img || prod.images?.[0] || ''}
                      priority={false}
                      containerClassName="size-full"
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${prod.id}`}
                      onClick={onClose}
                      className="font-cormorant font-bold text-[#6b1a2a] text-sm block truncate hover:underline"
                    >
                      {prod.name}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-sans font-bold text-xs text-[#2C2724]">
                        ₹{prod.discountedPrice ?? prod.price}
                      </span>
                      {prod.discountedPrice && (
                        <span className="text-[10px] text-[#A89E94] line-through">
                          ₹{prod.price}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8C827A] font-cormorant block truncate">
                      {prod.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, prod)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#6b1a2a] hover:bg-[#50131f] text-white text-[11px] font-semibold transition active:scale-95 shadow-2xs cursor-pointer"
                    >
                      {addedWishlistId === prod.id ? '✓ Added' : 'Add to Cart'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromWishlist(prod.id)}
                      className="p-1.5 text-[#8C827A] hover:text-[#c82333] hover:bg-[#FAF0ED] rounded-lg transition cursor-pointer"
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <svg className="size-4 text-[#c82333] fill-[#c82333]" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer if items exist */}
        {wishlistProducts.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#6b1a2a]/10 bg-white/80 backdrop-blur-xs flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm active:scale-95 cursor-pointer text-center"
            >
              {addedAll ? '✓ All Items Added to Cart!' : `Add All to Cart (${wishlistProducts.length})`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-[#DED5C9] bg-white text-xs font-semibold text-[#5C534B] hover:bg-[#F3EDE2] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
