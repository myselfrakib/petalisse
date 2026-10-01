import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { router } from './routes';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <CartProvider>
          <WishlistProvider>
            <SplashScreen />
            <RouterProvider router={router} />
          </WishlistProvider>
        </CartProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
