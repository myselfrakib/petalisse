import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { CartProvider } from './context/CartContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
