import asyncHandler from '../middleware/async.js';
import Category from '../models/Category.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getCategories = asyncHandler(async (req, res, next) => {
    const categories = await Category.find();
    if (!categories) {
        return next(new ErrorResponse('No categories found', 404));
    }
    res.status(200).json({
        success: true,
        data: categories,
    });
});


export const getCategory = asyncHandler(async (req, res, next) => {
    if (!req.params.id) {
        return next(new ErrorResponse('Category not found', 404));
    }
    const category = await Category.findById(req.params.id).populate('products');
    if (!category) {
        return next(new ErrorResponse('Category not found', 404));
    }
    res.status(200).json({
        success: true,
        data: category,
    });
});

export const createCategory = asyncHandler(async (req, res, next) => {
    const { name, description, image } = req.body;
    if (!name) {
        return next(new ErrorResponse('Name is required', 400));
    }
    const category = await Category.create(req.body);
    if (!category) {
        return next(new ErrorResponse('Category not created', 400));
    }
    res.status(201).json({
        success: true,
        data: category,
    });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
    if (!req.params.id) {
        return next(new ErrorResponse('Category not found', 404));
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: category,
    });
});




export const deleteCategory = asyncHandler(async (req, res, next) => {
    if (!req.params.id) {
        return next(new ErrorResponse('Category not found', 404));
    }
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        data: {},
    });
});