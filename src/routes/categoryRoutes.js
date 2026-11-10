const express = require('express');
const CategoryController = require('../controllers/CategoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', CategoryController.search);
router.get('/:id', CategoryController.getById);
router.post('/', authMiddleware, CategoryController.create);
router.put('/:id', authMiddleware, CategoryController.update);
router.delete('/:id', authMiddleware, CategoryController.delete);

module.exports = router;
