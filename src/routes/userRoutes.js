const express = require('express');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/token', UserController.generateToken);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', authMiddleware, UserController.update);
router.delete('/:id', authMiddleware, UserController.delete);

module.exports = router;
