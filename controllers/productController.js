import asyncHandler from '../middleware/async.js';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';

export const getProducts = asyncHandler(async (req, res, next) => {
    const products = await Product.find().populate('category');
    const totalProducts = await Product.countDocuments();
    if (!products) {
        return next(new ErrorResponse('No products found', 404));
    }
    res.status(200).json({
        success: true,
        totalProducts: totalProducts,
        data: products,

    });
});


export const getProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    res.status(200).json({
        success: true,
        data: product,
    });
});

export const createProduct = asyncHandler(async (req, res, next) => {
    const { name, description, price, category, images, stock, isActive } = req.body;
    if (!name || !description || !price || !category || !stock || !isActive) {
        return next(new ErrorResponse('Please add all fields', 400));
    }
    const product = await Product.create(req.body);
    if (!product) {
        return next(new ErrorResponse('Product not created', 400));
    }
    res.status(201).json({
        success: true,
        data: product,
    });
});


export const updateProduct = asyncHandler(async (req, res, next) => {
    if (!req.params.id) {
        return next(new ErrorResponse('Product not found', 404));
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!product) {
        return next(new ErrorResponse('Product not updated', 400));
    }
    res.status(200).json({
        success: true,
        data: product,
    });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
    if (!req.params.id) {
        return next(new ErrorResponse('Product not found', 404));
    }
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        data: {},
    });
});