import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    orderItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        quantity: {
            type: Number,
            required: [true, 'Please add a quantity'],
        },
        price: {
            type: Number,
            required: [true, 'Please add a price'],
        },
    }],
    subTotal: {
        type: Number,
        required: [true, 'Please add a subTotal'],
    },
    tax: {
        type: Number,
        required: [true, 'Please add a tax'],
    },
    shipping: {
        type: Number,
        required: [true, 'Please add a shipping'],
    },
    total: {
        type: Number,
        required: [true, 'Please add a total'],
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank transfer'],
        default: 'cash',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    address: {
        type: String,
        required: [true, 'Please add an address'],
    },
    city: {
        type: String,
        required: [true, 'Please add a city'],
    },
    state: {
        type: String,
        required: [true, 'Please add a state'],
    },
    zip: {
        type: String,
        required: [true, 'Please add a zip'],
    },
    country: {
        type: String,
        required: [true, 'Please add a country'],
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
    },
    notes: {
        type: String,
        required: [true, 'Please add notes'],
    },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', OrderSchema);

export default Order;