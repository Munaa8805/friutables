import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import dotenv from 'dotenv';
import fileupload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import mongoSanitizeExpress5 from './middleware/mongoSanitizeExpress5.js';
import morgan from 'morgan';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';
import errorHandler from './middleware/error.js';
import currentUser from './middleware/currentUser.js';
import connectDB from './config/db.js';
import viewRoutes from './routes/viewRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();


// Connect to database
connectDB();



const app = express();

// Body parser middleware - parses JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://cdn.jsdelivr.net;"
    );
    next();
});

// EJS templates (see views/layouts/main.ejs + partials)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Cookie parser middleware - parses cookies from request headers
app.use(cookieParser());
app.use(currentUser);

// Shared template locals (e.g. active nav and cart count)
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.currentUrl = req.originalUrl || req.path;
    let cartCount = 0;
    try {
        const cart = JSON.parse(req.cookies?.fruitables_cart || '[]');
        if (Array.isArray(cart)) {
            cartCount = cart.reduce(
                (sum, item) => sum + Math.max(1, Number(item?.qty) || 0),
                0
            );
        }
    } catch (error) {
        cartCount = 0;
    }
    res.locals.cartCount = cartCount;
    next();
});

// Development logging middleware - logs HTTP requests in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// File upload middleware - handles multipart/form-data file uploads (admin product images, etc.)
app.use(
    fileupload({
        limits: { fileSize: 8 * 1024 * 1024 },
        abortOnLimit: true,
    })
);

// Data sanitization - prevents NoSQL injection attacks (Express 5–compatible wrapper)
app.use(mongoSanitizeExpress5());

// Security headers — CSP must allow CDN scripts/styles used in views (jQuery, Bootstrap, fonts, icons)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'script-src': [
                    "'self'",
                    'https://ajax.googleapis.com',
                    'https://cdn.jsdelivr.net',
                ],
                'img-src': ["'self'", 'data:', 'https:'],
            },
        },
    })
);

// XSS protection - sanitizes user input to prevent XSS attacks
app.use(xss());

// Rate limiting - prevents abuse by limiting requests per IP
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// HTTP Parameter Pollution protection - prevents duplicate parameters
app.use(hpp());

// CORS - enables Cross-Origin Resource Sharing
app.use(cors());

// Static files - serves files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// View routes
app.use('/', viewRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
// Error handler middleware - must be after all routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {

    // Close server & exit process
    server.close(() => {
        console.log('Server closed due to unhandled promise rejection');
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {

    console.log('Shutting down due to uncaught exception');
    process.exit(1);
});
