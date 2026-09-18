import { createBrowserRouter } from 'react-router';
import Root from './Root';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Profile from './pages/Profile';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'shop', Component: Shop },
      { path: 'product/:id', Component: Product },
      { path: 'cart', Component: Cart },
      { path: 'profile', Component: Profile },
    ],
  },
]);
