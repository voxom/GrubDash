const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Finds the order
const isValidOrder = (req, res, next) => {
    const { orderId } = req.params
    const foundOrder = orders.find(order => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder
        return next()
    }
    next({
        status: 404,
        message: `Order id not found ${orderId}`
    })
}

// Checks if deliverTo is truthy
const hasDeliverTo = (req, res, next) => {
    const { data: { deliverTo }} = req.body
    if (deliverTo) return next()
    next({
        status: 400,
        message: 'Order must include a deliverTo'
    })
}

// Checks if MobileNumber is truthy
const hasMobileNumber = (req, res, next) => {
    const { data: { mobileNumber }} = req.body
    if (mobileNumber) return next()
    next({
        status: 400,
        message: 'Order must include a mobileNumber'
    })
}

// Checks if the dishes is falsey
const hasDishes = (req, res, next) => {
    const { data: { dishes }} = req.body
    if (!dishes) return next({
        status: 400,
        message: 'Order must include a dish'
    })
    else if (!Array.isArray(dishes) || dishes.length === 0)
      return next({
        status: 400,
        message: "Order must include at least one dish",
      });
    next()
}

// Checks if the dishes quantity is greater than 0
const hasDishQuantity = (req, res, next) => {
    const { data: { dishes }} = req.body
    dishes.forEach((dish, index) => {
        if (!dish.quantity || typeof dish.quantity !== 'number' || dish.quantity <= 0) return next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        })
    })
    next()
}

// Checks to see if the id's match || or if id is falsey
const hasValidId = (req, res, next ) => {
    const { data: { id }} = req.body
    const { orderId } = req.params

    if (id === orderId) return next()
    if (!id) return next()
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    })
}

// checks if status has a valid result
const hasStatus = (req, res, next) => {
    const { data: { status }} = req.body
    const validResult = ['pending', 'preparing', 'out-for-delivery', 'delivered']
    if (validResult.includes(status)) return next()
    if (status === 'delivered') return next({
        message: 'A delivered order cannot be changed'
    })
    next({
        status: 400,
        message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'
    })
}

// route GET /orders
const list = (req, res) => {
    res.json({ data: orders })
}

// route POST /orders
const create = (req, res, next) => {
    const {
        data: { deliverTo, mobileNumber, status, dishes}
    } = req.body

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }

    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
}

// GET /orders/:orderId
const read = (req, res) => {
    res.json({
        data: res.locals.order
    })
}

// PUT /orders/:orderId
const update = (req, res, next) => {
    const {
        data: { id, deliverTo, mobileNumber, status, dishes }
    } = req.body
    const { orderId } = req.params

    if (id === orderId) {
        res.locals.order.id = orderId
    }
    res.locals.order.deliverTo = deliverTo
    res.locals.order.mobileNumber = mobileNumber
    res.locals.order.status = status
    res.locals.order.dishes = dishes
    res.status(200).json({ data: res.locals.order })
}

// DELETE /orders/:orderId
const destroy = (req, res, next) => {
    const { order: { status }} = res.locals
    if (status !== 'pending') return next({
      status: 400,
      message: 'An order cannot be deleted unless it is pending'
    })
    const { orderId } = req.params
    const index = orders.findIndex(order => order.id === orderId)
    if (index > -1) orders.splice(index, 1)
    res.sendStatus(204)
}


module.exports = {
    list,
    read: [isValidOrder, read],
    create: [hasDeliverTo, hasMobileNumber, hasDishes, hasDishQuantity, create],
    update: [isValidOrder, hasDeliverTo, hasMobileNumber, hasDishes, hasStatus, hasDishQuantity, hasValidId, update],
    delete: [isValidOrder, destroy]
}
