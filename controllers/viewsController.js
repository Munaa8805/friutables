import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import featureHighlights from '../data/featureHighlights.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { clearAuthCookie } from './auth.js';
import saveProductImageUploads from '../utils/saveProductImageUploads.js';
import deleteProductImageFilesIfUnused from '../utils/deleteProductImageFilesIfUnused.js';

/** Category used to scope products on the home page */
const HOME_PRODUCTS_CATEGORY_ID = '69dc391f1ee2dada48d688ef';
const CART_COOKIE_NAME = 'fruitables_cart';
const CART_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const readCartItems = (req) => {
    let parsed = [];
    try {
        parsed = JSON.parse(req.cookies?.[CART_COOKIE_NAME] || '[]');
    } catch (error) {
        parsed = [];
    }
    if (!Array.isArray(parsed)) {
        return [];
    }
    return parsed
        .map((item) => ({
            productId: String(item?.productId || ''),
            qty: Math.max(1, Math.min(99, Number(item?.qty) || 1)),
        }))
        .filter((item) => mongoose.isValidObjectId(item.productId));
};

const writeCartItems = (res, cartItems) => {
    res.cookie(CART_COOKIE_NAME, JSON.stringify(cartItems), {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: CART_COOKIE_MAX_AGE_MS,
    });
};

const loadCartDetails = async (cartItems) => {
    if (!cartItems.length) {
        return { items: [], subtotal: 0 };
    }

    const ids = cartItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: ids } }).lean();
    const byId = new Map(products.map((prod) => [String(prod._id), prod]));

    const items = cartItems
        .map((item) => {
            const product = byId.get(item.productId);
            if (!product) return null;
            const unitPrice = Number(product.price) || 0;
            const lineTotal = unitPrice * item.qty;
            const images = Array.isArray(product.images)
                ? product.images
                : product.images
                    ? [product.images]
                    : [];
            const imageFile = images[0] || 'fruite-item-5.jpg';
            const imageSrc =
                typeof imageFile === 'string' && imageFile.indexOf('http') === 0
                    ? imageFile
                    : '/img/' + String(imageFile).replace(/^\//, '');

            return {
                productId: item.productId,
                name: product.name,
                qty: item.qty,
                unitPrice,
                lineTotal,
                imageSrc,
            };
        })
        .filter(Boolean);

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items, subtotal };
};

const getAuthenticatedUser = async (req) => {
    const token = req.cookies?.token;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id).lean();
    } catch (error) {
        return null;
    }
};

export const getHomePage = asyncHandler(async (req, res, next) => {
    const categories = await Category.find().sort({ name: 1 });
    const homeProducts = await Product.find()
        .populate('category')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
    const vegetables = await Product.find({ category: HOME_PRODUCTS_CATEGORY_ID })
        .populate('category')
        .sort({ name: 1 })
        .lean();
    res.status(200).render('home', {
        title: 'Home',
        message: 'Welcome to the home page',
        featureHighlights,
        categories,
        homeProducts,
        vegetables,
    });
});


export const getContactPage = asyncHandler(async (req, res, next) => {
    res.status(200).render('contact', {
        title: 'Contact',
        message: 'Welcome to the contact page',
    });
});

const SHOP_PAGE_SIZE = 9;

export const getShopPage = asyncHandler(async (req, res, next) => {
    const categoriesList = await Category.find().sort({ name: 1 }).lean();
    const countAgg = await Product.aggregate([
        { $group: { _id: '$category', n: { $sum: 1 } } },
    ]);
    const nByCat = Object.fromEntries(
        countAgg.map((x) => [x._id.toString(), x.n])
    );
    const categories = categoriesList.map((c) => ({
        ...c,
        productCount: nByCat[c._id.toString()] || 0,
    }));

    const productFilter = {};
    if (req.query.category && mongoose.isValidObjectId(req.query.category)) {
        productFilter.category = req.query.category;
    }
    const parsedMaxPrice = Number(req.query.maxPrice);
    const selectedMaxPrice =
        Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0
            ? parsedMaxPrice
            : null;
    if (selectedMaxPrice !== null) {
        productFilter.price = { $lte: selectedMaxPrice };
    }

    const totalProducts = await Product.countDocuments(productFilter);
    const totalPages = Math.max(1, Math.ceil(totalProducts / SHOP_PAGE_SIZE));

    const rawPage =
        req.query.page ??
        req.query[' page'] ??
        req.query['page '];
    let currentPage = Math.max(1, parseInt(String(rawPage ?? '').trim(), 10) || 1);
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const products = await Product.find(productFilter)
        .sort({ createdAt: -1 })
        .populate('category')
        .skip((currentPage - 1) * SHOP_PAGE_SIZE)
        .limit(SHOP_PAGE_SIZE)
        .lean();

    const selectedCategoryId =
        req.query.category && mongoose.isValidObjectId(req.query.category)
            ? req.query.category
            : null;

    res.status(200).render('shop', {
        title: 'Shop',
        message: 'Welcome to the shop page',
        categories,
        products,
        selectedCategoryId,
        selectedMaxPrice,
        currentPage,
        totalPages,
        totalProducts,
        pageSize: SHOP_PAGE_SIZE,
    });
});

export const getAdminProductsPage = asyncHandler(async (req, res, next) => {
    const products = await Product.find()
        .populate('category')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).render('admin-products', {
        title: 'Admin — Products',
        products,
        adminUser: req.adminUser,
        notice: req.query.notice || '',
        error: req.query.error || '',
    });
});

const parseAdminImagesInput = (raw) => {
    if (!raw || !String(raw).trim()) {
        return ['default.jpg'];
    }
    return String(raw)
        .split(/[,|\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
};

/** Uploaded files first, then manual filenames (excluding duplicate default when uploads exist). */
const mergeAdminProductImages = (uploadedFilenames, manualRaw) => {
    const fromText = parseAdminImagesInput(manualRaw);
    if (uploadedFilenames.length) {
        const extra = fromText.filter((f) => f !== 'default.jpg');
        return [...uploadedFilenames, ...extra];
    }
    return fromText;
};

const buildAdminProductPayload = (body, imagesArray) => {
    const name = (body.name || '').trim();
    const description = (body.description || '').trim();
    const price = Number(body.price);
    const category = body.category;
    const stock = Number(body.stock);
    const isActive = body.isActive === 'on' || body.isActive === 'true';
    const images =
        imagesArray && imagesArray.length
            ? imagesArray
            : parseAdminImagesInput(body.manualImages);
    let rating;
    let numReviews;
    if (body.rating !== undefined && String(body.rating).trim() !== '') {
        rating = Math.min(5, Math.max(0, Number(body.rating)));
    }
    if (body.numReviews !== undefined && String(body.numReviews).trim() !== '') {
        numReviews = Math.max(0, parseInt(body.numReviews, 10) || 0);
    }
    return {
        name,
        description,
        price,
        category,
        stock,
        isActive,
        images,
        rating,
        numReviews,
    };
};

export const getAdminProductNewPage = asyncHandler(async (req, res, next) => {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.status(200).render('admin-product-form', {
        title: 'New product',
        isEdit: false,
        product: null,
        categories,
        imagesDisplay: 'default.jpg',
        error: req.query.error || '',
        adminUser: req.adminUser,
    });
});

export const getAdminProductEditPage = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Invalid product id'));
    }
    const product = await Product.findById(id).lean();
    if (!product) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Product not found'));
    }
    const categories = await Category.find().sort({ name: 1 }).lean();
    const imgs = Array.isArray(product.images) ? product.images : product.images ? [product.images] : [];
    const imagesDisplay = imgs.length ? imgs.join(', ') : 'default.jpg';
    res.status(200).render('admin-product-form', {
        title: 'Edit product',
        isEdit: true,
        product,
        categories,
        imagesDisplay,
        error: req.query.error || '',
        adminUser: req.adminUser,
    });
});

export const postAdminProductCreate = asyncHandler(async (req, res, next) => {
    let uploaded = [];
    try {
        uploaded = await saveProductImageUploads(req);
    } catch (uploadErr) {
        return res.redirect(
            '/admin/products/new?error=' +
                encodeURIComponent(
                    uploadErr.message || 'Could not save uploaded images.'
                )
        );
    }
    const mergedImages = mergeAdminProductImages(uploaded, req.body.manualImages);
    const p = buildAdminProductPayload(req.body, mergedImages);
    if (!mongoose.isValidObjectId(p.category)) {
        return res.redirect(
            '/admin/products/new?error=' + encodeURIComponent('Please choose a valid category.')
        );
    }
    const cat = await Category.findById(p.category).select('_id').lean();
    if (!cat) {
        return res.redirect(
            '/admin/products/new?error=' + encodeURIComponent('Category not found.')
        );
    }
    if (!p.name || p.name.length < 3) {
        return res.redirect(
            '/admin/products/new?error=' + encodeURIComponent('Name must be at least 3 characters.')
        );
    }
    if (!p.description) {
        return res.redirect(
            '/admin/products/new?error=' + encodeURIComponent('Description is required.')
        );
    }
    if (!Number.isFinite(p.price) || p.price < 0) {
        return res.redirect(
            '/admin/products/new?error=' + encodeURIComponent('Enter a valid price.')
        );
    }
    if (!Number.isFinite(p.stock) || p.stock < 0) {
        return res.redirect(
            '/admin/products/new?error=' + encodeURIComponent('Enter a valid stock amount.')
        );
    }
    try {
        const doc = {
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            stock: p.stock,
            isActive: p.isActive,
            images: p.images,
        };
        if (p.rating !== undefined) doc.rating = p.rating;
        if (p.numReviews !== undefined) doc.numReviews = p.numReviews;
        await Product.create(doc);
        return res.redirect('/admin/products?notice=' + encodeURIComponent('Product created.'));
    } catch (err) {
        const msg =
            err.name === 'ValidationError'
                ? Object.values(err.errors)[0]?.message || 'Validation failed'
                : 'Could not create product';
        return res.redirect('/admin/products/new?error=' + encodeURIComponent(msg));
    }
});

export const postAdminProductUpdate = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Invalid product id'));
    }
    const existing = await Product.findById(id).select('_id').lean();
    if (!existing) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Product not found'));
    }
    let uploaded = [];
    try {
        uploaded = await saveProductImageUploads(req);
    } catch (uploadErr) {
        return res.redirect(
            '/admin/products/' +
                id +
                '/edit?error=' +
                encodeURIComponent(uploadErr.message || 'Could not save uploaded images.')
        );
    }
    const mergedImages = mergeAdminProductImages(uploaded, req.body.manualImages);
    const p = buildAdminProductPayload(req.body, mergedImages);
    if (!mongoose.isValidObjectId(p.category)) {
        return res.redirect(
            '/admin/products/' + id + '/edit?error=' + encodeURIComponent('Please choose a valid category.')
        );
    }
    const cat = await Category.findById(p.category).select('_id').lean();
    if (!cat) {
        return res.redirect(
            '/admin/products/' + id + '/edit?error=' + encodeURIComponent('Category not found.')
        );
    }
    if (!p.name || p.name.length < 3) {
        return res.redirect(
            '/admin/products/' + id + '/edit?error=' + encodeURIComponent('Name must be at least 3 characters.')
        );
    }
    if (!p.description) {
        return res.redirect(
            '/admin/products/' + id + '/edit?error=' + encodeURIComponent('Description is required.')
        );
    }
    if (!Number.isFinite(p.price) || p.price < 0) {
        return res.redirect(
            '/admin/products/' + id + '/edit?error=' + encodeURIComponent('Enter a valid price.')
        );
    }
    if (!Number.isFinite(p.stock) || p.stock < 0) {
        return res.redirect(
            '/admin/products/' + id + '/edit?error=' + encodeURIComponent('Enter a valid stock amount.')
        );
    }
    try {
        const doc = {
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            stock: p.stock,
            isActive: p.isActive,
            images: p.images,
        };
        if (p.rating !== undefined) doc.rating = p.rating;
        if (p.numReviews !== undefined) doc.numReviews = p.numReviews;
        await Product.findByIdAndUpdate(id, doc, { runValidators: true, new: true });
        return res.redirect('/admin/products?notice=' + encodeURIComponent('Product updated.'));
    } catch (err) {
        const msg =
            err.name === 'ValidationError'
                ? Object.values(err.errors)[0]?.message || 'Validation failed'
                : 'Could not update product';
        return res.redirect('/admin/products/' + id + '/edit?error=' + encodeURIComponent(msg));
    }
});

export const postAdminProductDelete = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Invalid product id'));
    }
    const result = await Product.findByIdAndDelete(id);
    if (!result) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Product not found'));
    }
    try {
        await deleteProductImageFilesIfUnused(result.images);
    } catch (err) {
        console.error('deleteProductImageFilesIfUnused', err);
    }
    return res.redirect('/admin/products?notice=' + encodeURIComponent('Product deleted.'));
});

export const getProductDetailPage = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/shop');
    }
    const product = await Product.findById(id).populate('category').lean();
    if (!product) {
        return res.status(404).render('product-detail', {
            title: 'Product not found',
            notFound: true,
            product: null,
            relatedProducts: [],
        });
    }

    const categoryId = product.category?._id || product.category;
    const relatedProducts = categoryId
        ? await Product.find({
            category: categoryId,
            _id: { $ne: product._id },
        })
            .sort({ createdAt: -1 })
            .limit(16)
            .populate('category')
            .lean()
        : [];

    res.status(200).render('product-detail', {
        title: product.name,
        notFound: false,
        product,
        relatedProducts,
    });
});

export const getCheckoutPage = asyncHandler(async (req, res, next) => {
    const cartItems = readCartItems(req);
    const { items, subtotal } = await loadCartDetails(cartItems);
    const shipping = items.length ? 3 : 0;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;
    const user = await getAuthenticatedUser(req);

    res.status(200).render('checkout', {
        title: 'Checkout',
        message: 'Welcome to the checkout page',
        cartItems: items,
        subtotal,
        shipping,
        tax,
        total,
        user,
        success: req.query.success === '1',
        orderId: req.query.orderId || '',
        error: req.query.error || '',
    });
});

export const placeOrder = asyncHandler(async (req, res, next) => {
    const cartItems = readCartItems(req);
    const { items, subtotal } = await loadCartDetails(cartItems);

    if (!items.length) {
        return res.redirect('/cart');
    }

    const shipping = items.length ? 3 : 0;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;
    const user = await getAuthenticatedUser(req);

    const {
        address,
        city,
        state,
        zip,
        country,
        phone,
        email,
        notes,
        paymentMethod,
    } = req.body;

    const normalizedPaymentMethod = ['cash', 'card', 'bank transfer'].includes(
        paymentMethod
    )
        ? paymentMethod
        : 'cash';

    if (!address || !city || !state || !zip || !country || !phone || !email || !notes) {
        return res.redirect('/checkout?error=Please%20fill%20all%20required%20fields');
    }

    const order = await Order.create({
        user: user?._id,
        orderItems: items.map((item) => ({
            product: item.productId,
            quantity: item.qty,
            price: item.unitPrice,
        })),
        subTotal: subtotal,
        tax,
        shipping,
        total,
        paymentMethod: normalizedPaymentMethod,
        address,
        city,
        state,
        zip,
        country,
        phone,
        email,
        notes,
    });

    writeCartItems(res, []);
    return res.redirect(`/checkout?success=1&orderId=${order._id}`);
});

export const getCartPage = asyncHandler(async (req, res, next) => {
    const cartItems = readCartItems(req);
    const { items, subtotal } = await loadCartDetails(cartItems);
    const shipping = items.length ? 3 : 0;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;

    res.status(200).render('cart', {
        title: 'Cart',
        message: 'Welcome to the cart page',
        cartItems: items,
        subtotal,
        tax,
        shipping,
        total,
    });
});

export const addToCart = asyncHandler(async (req, res, next) => {
    const { productId, qty, redirectTo } = req.body;
    const target = redirectTo || '/cart';

    if (!mongoose.isValidObjectId(productId)) {
        return res.redirect(target);
    }

    const existingProduct = await Product.findById(productId).select('_id').lean();
    if (!existingProduct) {
        return res.redirect(target);
    }

    const incomingQty = Math.max(1, Math.min(99, Number(qty) || 1));
    const cartItems = readCartItems(req);
    const existingItem = cartItems.find((item) => item.productId === String(productId));

    if (existingItem) {
        existingItem.qty = Math.max(1, Math.min(99, existingItem.qty + incomingQty));
    } else {
        cartItems.push({ productId: String(productId), qty: incomingQty });
    }

    writeCartItems(res, cartItems);
    return res.redirect(target);
});

export const updateCartItem = asyncHandler(async (req, res, next) => {
    const { productId, action } = req.body;
    const cartItems = readCartItems(req);
    const idx = cartItems.findIndex((item) => item.productId === String(productId));

    if (idx === -1) {
        return res.redirect('/cart');
    }

    if (action === 'inc') {
        cartItems[idx].qty = Math.min(99, cartItems[idx].qty + 1);
    } else if (action === 'dec') {
        cartItems[idx].qty = cartItems[idx].qty - 1;
    }

    if (cartItems[idx].qty <= 0) {
        cartItems.splice(idx, 1);
    }

    writeCartItems(res, cartItems);
    return res.redirect('/cart');
});

export const removeCartItem = asyncHandler(async (req, res, next) => {
    const { productId } = req.body;
    const cartItems = readCartItems(req).filter(
        (item) => item.productId !== String(productId)
    );
    writeCartItems(res, cartItems);
    return res.redirect('/cart');
});

export const clearCart = asyncHandler(async (req, res, next) => {
    writeCartItems(res, []);
    return res.redirect('/cart');
});

export const getLoginPage = asyncHandler(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Login',
        registered: req.query.registered === '1',
        loggedOut: req.query.loggedout === '1',
        error: req.query.error || '',
    });
});

export const getRegisterPage = asyncHandler(async (req, res, next) => {

    res.status(200).render('register', {
        title: 'Register',
        error: req.query.error || '',
    });
});

export const registerUser = asyncHandler(async (req, res, next) => {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
        return res.redirect('/register?error=Please%20fill%20all%20fields');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.redirect('/register?error=Email%20already%20exists');
    }

    try {
        await User.create({
            name: userName,
            email,
            password,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid data';
            return res.redirect(`/register?error=${encodeURIComponent(firstMessage)}`);
        }
        return next(new ErrorResponse('Could not create account', 500));
    }

    return res.redirect('/login?registered=1');
});

export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.redirect('/login?error=Please%20provide%20email%20and%20password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.redirect('/login?error=Invalid%20credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return res.redirect('/login?error=Invalid%20credentials');
    }

    const token = user.getSignedJwtToken();
    const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE) || 7;
    const options = {
        expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.cookie('token', token, options);
    return res.redirect('/');
});

export const logoutUser = asyncHandler(async (req, res, next) => {
    clearAuthCookie(res);
    return res.redirect('/login?loggedout=1');
});

export const getProfilePage = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.redirect('/login?error=Please%20login%20to%20view%20profile');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).lean();

        if (!user) {
            return res.redirect('/login?error=Please%20login%20to%20view%20profile');
        }
        const orders = await Order.find({ user: user._id })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).render('profile', {
            title: 'My Profile',
            user,
            orders,
        });
    } catch (error) {
        return res.redirect('/login?error=Session%20expired.%20Please%20login%20again');
    }
});

