const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  getOrders,
  getGymOrders,
  getMyOrders,
  updateOrderStatus,
  getStoreMetrics,
} = require('../controllers/productController');

// All store routes require authentication
router.use(protect);

// Store Metrics (Admin)
router.get('/metrics', authorize('admin', 'superadmin', 'staff'), getStoreMetrics);

// Product Catalog
router.get('/products', getProducts);
router.post('/products', authorize('admin', 'superadmin', 'staff'), createProduct);
router.put('/products/:id', authorize('admin', 'superadmin', 'staff'), updateProduct);
router.delete('/products/:id', authorize('admin', 'superadmin'), deleteProduct);

// Orders & Checkout
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.get('/orders/my', getMyOrders);
router.get('/orders/gym', authorize('admin', 'superadmin', 'staff'), getGymOrders);
router.put('/orders/:id/status', authorize('admin', 'superadmin', 'staff'), updateOrderStatus);
router.patch('/orders/:id/status', authorize('admin', 'superadmin', 'staff'), updateOrderStatus);

module.exports = router;
