const express = require('express');
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', ProductController.search);
router.get('/:id', ProductController.getById);
router.post('/', authMiddleware, ProductController.create);
router.put('/:id', authMiddleware, ProductController.update);
router.delete('/:id', authMiddleware, ProductController.delete);

module.exports = router;
