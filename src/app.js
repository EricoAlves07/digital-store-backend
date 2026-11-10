require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use('/media', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api-docs.json', (req, res) => {
  return res.status(200).json(swaggerDocument);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/v1/user', userRoutes);
app.use('/v1/category', categoryRoutes);
app.use('/v1/product', productRoutes);

app.use(errorMiddleware);

module.exports = app;
