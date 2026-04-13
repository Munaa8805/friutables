import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        maxlength: [50, 'Name can not be more than 50 characters'],
        trim: true,
        unique: true,
        lowercase: true,
        minlength: [3, 'Name can not be less than 3 characters'],

    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters'],
        trim: true,
    },
    image: {
        type: String,
        default: 'default.jpg',
        trim: true,
    },
    slug: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

CategorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
});

const Category = mongoose.model('Category', CategorySchema);

export default Category;