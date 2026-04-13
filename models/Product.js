import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        maxlength: [50, 'Name can not be more than 50 characters'],
        trim: true,
        minlength: [3, 'Name can not be less than 3 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters'],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please add a category'],
    },
    images: {
        type: [String],
        default: 'default.jpg',
    },
    stock: {
        type: Number,
        required: [true, 'Please add a stock'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        set: (val) => Math.round(val * 10) / 10,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;