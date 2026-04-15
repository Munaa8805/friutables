import express from 'express';
import requireAdmin from '../middleware/requireAdmin.js';
import {
    addToCart,
    clearCart,
    getCartPage,
    getCheckoutPage,
    getContactPage,
    getHomePage,
    getLoginPage,
    placeOrder,
    getProfilePage,
    loginUser,
    logoutUser,
    getAdminProductsPage,
    getAdminProductNewPage,
    getAdminProductEditPage,
    postAdminProductCreate,
    postAdminProductUpdate,
    postAdminProductDelete,
    getProductDetailPage,
    getRegisterPage,
    removeCartItem,
    registerUser,
    getShopPage,
    updateCartItem,
} from '../controllers/viewsController.js';

const router = express.Router();

router.get('/', getHomePage);
router.get('/admin/products/new', requireAdmin, getAdminProductNewPage);
router.get('/admin/products/:id/edit', requireAdmin, getAdminProductEditPage);
router.post('/admin/products', requireAdmin, postAdminProductCreate);
router.post('/admin/products/:id/update', requireAdmin, postAdminProductUpdate);
router.post('/admin/products/:id/delete', requireAdmin, postAdminProductDelete);
router.get('/admin/products', requireAdmin, getAdminProductsPage);
router.get('/contact', getContactPage);
router.get('/shop', getShopPage);
router.get('/product/:id', getProductDetailPage);
router.get('/checkout', getCheckoutPage);
router.post('/checkout', placeOrder);
router.get('/cart', getCartPage);
router.get('/login', getLoginPage);
router.get('/register', getRegisterPage);
router.get('/profile', getProfilePage);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.post('/cart/add', addToCart);
router.post('/cart/update', updateCartItem);
router.post('/cart/remove', removeCartItem);
router.post('/cart/clear', clearCart);


export default router;