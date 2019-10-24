const express = require('express');
const jwt = require('jwt-simple');

const { Order, LineItem, Product } = require('../data/models');

const router = express.Router();
router.use(express.json());

router.get('/', (req, res, next) => {
  // Returns all line items in cart (active order)
  const { id } = jwt.decode(req.headers.token, process.env.SECRET);
  Order.findOne({ where: { userId: id, active: true } })
    .then(async (cart) => {
      if (!cart) {
        return next();
      }

      const items = await LineItem.findAll({ where: { orderId: cart.id } });
      // Add product name and price to line items for easy access in frontend
      // Figure out a better way of doing this
      const updatedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i].get();
        const { name, price } = await Product.findOne({
          where: { id: item.productId },
        });
        updatedItems.push({ ...item, name, price });
      }

      return res.send(updatedItems);
    })
    .catch(next);
});

router.post('/', (req, res, next) => {
  // Create new lineItem and place in cart (active order)
  const { id } = jwt.decode(req.headers.token, process.env.SECRET);
  Order.findOne({ where: { userId: id, active: true } })
    .then((order) => {
      LineItem.create({ ...req.body, orderId: order.id }).then((item) => res.send(item));
    })
    .catch(next);
});

router.put('/:id', async (req, res, next) => {
  // Remember to check token if loggedInUser.id === req.params.id
  LineItem.findOne({ where: { id: req.params.id } })
    .then((item) => {
      const { quantity } = req.body;
      item.update({ quantity });
    })
    .then((item) => res.send(item))
    .catch(next);
});

router.delete('/:id', (req, res, next) => {
  LineItem.findOne({ where: { id: req.params.id } })
    .then((item) => item.destroy())
    .then(() => res.sendStatus(204))
    .catch(next);
});

module.exports = router;