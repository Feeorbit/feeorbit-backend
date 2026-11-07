const Product = require('../models/Product');
const Order = require('../models/Order');
const Member = require('../models/Member');

// Helper to resolve user gym ID safely
function getUserGymId(user) {
  if (!user) return null;
  if (user.gym?._id) return user.gym._id.toString();
  if (user.gym) return user.gym.toString();
  return null;
}

// Starter sample products seeded if a gym has no products yet
const DEFAULT_STARTER_PRODUCTS = [
  {
    name: '100% Whey Gold Isolate Protein (2kg)',
    category: 'supplements',
    brand: 'Optimum Nutrition',
    price: 4999,
    memberPrice: 4299,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80',
    description: '24g Pure Whey Protein per scoop with 5.5g BCAAs for fast lean muscle recovery.',
    isFeatured: true,
  },
  {
    name: 'Micronized Creatine Monohydrate (250g)',
    category: 'supplements',
    brand: 'MuscleBlaze',
    price: 1199,
    memberPrice: 949,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80',
    description: '100% Pure Creatine for maximum power output, explosive strength and muscle fullness.',
    isFeatured: true,
  },
  {
    name: 'High-Explosive Pre-Workout Formula (300g)',
    category: 'supplements',
    brand: 'Cellucor C4',
    price: 1899,
    memberPrice: 1599,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=600&q=80',
    description: 'Enhanced focus, skin-splitting muscle pumps and long-lasting workout energy.',
    isFeatured: true,
  },
  {
    name: 'Stainless Steel Insulated Shaker (750ml)',
    category: 'gear',
    brand: 'GymPulse Pro',
    price: 699,
    memberPrice: 499,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    description: 'Double-wall leak-proof shaker bottle with built-in blending whisk ball.',
    isFeatured: false,
  },
  {
    name: 'Padded Heavy-Duty Lifting Wrist Straps',
    category: 'gear',
    brand: 'IronGrip',
    price: 499,
    memberPrice: 349,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    description: 'Neoprene padded heavy cotton straps for deadlifts, shrugs and heavy back pulls.',
    isFeatured: false,
  },
  {
    name: 'GymPulse Classic Athlete T-Shirt',
    category: 'apparel',
    brand: 'GymPulse Club',
    price: 899,
    memberPrice: 699,
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    description: 'Breathable dry-fit polyester performance tee with gym crest print.',
    isFeatured: true,
  },
  {
    name: 'High-Protein Almond Crunch Bars (Pack of 6)',
    category: 'snacks',
    brand: 'RiteBite Max',
    price: 480,
    memberPrice: 399,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1622484216800-4b2a8d3885d5?auto=format&fit=crop&w=600&q=80',
    description: '20g Protein per bar with real California almonds and zero added sugar.',
    isFeatured: false,
  },
];

// @desc    Get all products for gym (with auto-seed if first time)
// @route   GET /api/store/products
exports.getProducts = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user) || req.query.gymId;
    if (!gymId) {
      return res.status(400).json({ success: false, message: 'Gym workspace context is required' });
    }

    let productCount = await Product.countDocuments({ gym: gymId });
    if (productCount === 0) {
      // Auto seed initial starter catalog for this gym
      const seedData = DEFAULT_STARTER_PRODUCTS.map((p) => ({ ...p, gym: gymId }));
      await Product.insertMany(seedData);
    }

    const { category, search, availableOnly } = req.query;
    let query = { gym: gymId };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (availableOnly === 'true') {
      query.isAvailable = true;
      query.stock = { $gt: 0 };
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ isFeatured: -1, createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('getProducts Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new product (Gym Admin / Owner)
// @route   POST /api/store/products
exports.createProduct = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user) || req.body.gymId;
    const {
      name,
      category = 'supplements',
      price,
      memberPrice,
      stock = 10,
      imageUrl = '',
      description = '',
      brand = '',
      isFeatured = false,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Product name and price are required' });
    }

    const product = await Product.create({
      gym: gymId,
      name: name.trim(),
      category,
      price: Number(price),
      memberPrice: memberPrice ? Number(memberPrice) : Number(price),
      stock: Number(stock) || 0,
      imageUrl: imageUrl.trim(),
      description: description.trim(),
      brand: brand.trim(),
      isFeatured: !!isFeatured,
      isAvailable: Number(stock) > 0,
    });

    res.status(201).json({
      success: true,
      message: 'Product added to gym store successfully',
      data: product,
    });
  } catch (error) {
    console.error('createProduct Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product details / stock (Gym Admin)
// @route   PUT /api/store/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const product = await Product.findOne({ _id: req.params.id, gym: gymId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const fields = ['name', 'category', 'price', 'memberPrice', 'stock', 'imageUrl', 'description', 'brand', 'isAvailable', 'isFeatured'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (product.stock !== undefined) {
      product.isAvailable = Number(product.stock) > 0;
    }

    await product.save();

    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    console.error('updateProduct Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product (Gym Admin)
// @route   DELETE /api/store/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const product = await Product.findOneAndDelete({ _id: req.params.id, gym: gymId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product removed from store' });
  } catch (error) {
    console.error('deleteProduct Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Place a Store Order (Member / User checkout)
// @route   POST /api/store/orders
exports.createOrder = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user) || req.body.gymId;
    const { items = [], paymentMethod = 'FrontDesk', pickupNotes = '' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please add products.' });
    }

    // Verify products and calculate price
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const prod = await Product.findOne({ _id: item.productId, gym: gymId });
      if (!prod) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      if (prod.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prod.name}". Only ${prod.stock} available.`,
        });
      }

      // Member price discount if applicable
      const unitPrice = prod.memberPrice && prod.memberPrice < prod.price ? prod.memberPrice : prod.price;
      totalAmount += unitPrice * qty;

      orderItems.push({
        product: prod._id,
        name: prod.name,
        price: unitPrice,
        quantity: qty,
        imageUrl: prod.imageUrl || '',
      });

      // Auto-decrement inventory stock
      prod.stock = Math.max(0, prod.stock - qty);
      if (prod.stock === 0) prod.isAvailable = false;
      await prod.save();
    }

    // Resolve member details
    let memberDoc = null;
    if (req.user.memberRef) {
      memberDoc = await Member.findById(req.user.memberRef);
    } else if (req.user.email) {
      memberDoc = await Member.findOne({ gym: gymId, email: req.user.email.toLowerCase().trim() });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const order = await Order.create({
      orderNumber,
      gym: gymId,
      user: req.user._id,
      member: memberDoc?._id || null,
      memberName: req.user.name || memberDoc?.fullName || 'Gym Member',
      memberPhone: req.user.phone || memberDoc?.phone || '',
      memberEmail: req.user.email || memberDoc?.email || '',
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'Online' || paymentMethod === 'UPI' ? 'paid' : 'pending',
      status: 'pending',
      pickupNotes: pickupNotes.trim(),
    });

    res.status(201).json({
      success: true,
      message: `Order #${orderNumber} placed successfully! Please collect from the Gym Front Desk.`,
      data: order,
    });
  } catch (error) {
    console.error('createOrder Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Store Orders for Gym Admin
// @route   GET /api/store/orders/gym
exports.getGymOrders = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { status } = req.query;
    let query = { gym: gymId };

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    // Store Metrics
    const allOrders = await Order.find({ gym: gymId });
    const totalSales = allOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrdersCount = allOrders.filter((o) => o.status === 'pending').length;
    const readyCount = allOrders.filter((o) => o.status === 'ready_for_pickup').length;
    const completedCount = allOrders.filter((o) => o.status === 'completed').length;

    res.json({
      success: true,
      count: orders.length,
      metrics: {
        totalSales,
        totalOrdersCount: allOrders.length,
        pendingOrdersCount,
        readyCount,
        completedCount,
      },
      data: orders,
    });
  } catch (error) {
    console.error('getGymOrders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get member's own store orders
// @route   GET /api/store/orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const orders = await Order.find({
      gym: gymId,
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('getMyOrders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status / payment (Gym Admin)
// @route   PUT /api/store/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { status, paymentStatus } = req.body;

    const order = await Order.findOne({ _id: req.params.id, gym: gymId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) {
      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date();
        order.paymentStatus = 'paid';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    console.error('updateOrderStatus Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get store sales & stock metrics (Gym Admin)
// @route   GET /api/store/metrics
exports.getStoreMetrics = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const allOrders = await Order.find({ gym: gymId });
    const allProducts = await Product.find({ gym: gymId, isActive: true });

    const totalRevenue = allOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = allOrders.filter((o) => o.status === 'pending').length;
    const readyOrders = allOrders.filter((o) => o.status === 'ready_for_pickup').length;
    const completedOrders = allOrders.filter((o) => o.status === 'completed').length;
    const lowStockCount = allProducts.filter((p) => (p.stock || 0) <= 5).length;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: allOrders.length,
        pendingOrders,
        readyOrders,
        completedOrders,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error('getStoreMetrics Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dynamic orders router for both Admin and Member
// @route   GET /api/store/orders
exports.getOrders = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const isStaff = ['admin', 'superadmin', 'staff'].includes(req.user.role);

    if (isStaff) {
      const orders = await Order.find({ gym: gymId })
        .populate('user', 'name email phone role')
        .sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, data: orders });
    }

    const orders = await Order.find({ gym: gymId, user: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('getOrders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

