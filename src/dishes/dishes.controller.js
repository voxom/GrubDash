const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// checks if name is truthy
function hasName (req, res, next) {
    const { data: { name } = {}} = req.body
    if (name) return next()
    next({
        status: 400,
        message: 'Dish must include a name'
    })
}

// checks if description is truthy
function hasDescription (req, res, next) {
    const { data: { description } = {}} = req.body
    if (description) return next()
    next({
        status: 400,
        message: 'Dish must include a description'
    })
}

// checks if price is greater than 0 || includes a price
function hasPrice (req, res, next) {
    const { data: { price } = {}} = req.body
    if (!price) return next({
        status: 400,
        message: 'Dish must include a price'
    })
    if (price <= 0 || typeof price !== 'number') return next({
        status: 400,
        message: 'Dish must have a price that is an integer greater than 0'
    })
    next()
}

// checks if image_url is truthy
function hasImageUrl (req, res, next) {
    const { data: { image_url } = {}} = req.body
    if (image_url) return next()
    next({
        status: 400,
        message: 'Dish must include a image_url'
    })
}

// Finds the order
function isValid (req, res, next) {
    const dishId = req.params.dishId
    const foundDish = dishes.find(dish => dish.id === dishId)

    if (foundDish) {
        res.locals.dish = foundDish
        return next()
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

// Checks if the id's match || if id is falsey
function hasValidId (req, res, next) {
    const { data: { id }} = req.body
    const { dishId } = req.params

    if (id === dishId) return next()
    if (!id) return next()
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    })
}

// route GET /dishes
function list (req, res, next) {
    res.json({ data: dishes })
}

// route POST /dishes
function create (req, res, next) {
    const { 
        data: { name, description, price, image_url } = {}
    } = req.body
    const newDishes = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDishes)
    res.status(201).json({ data: newDishes })
}

// GET /dishes/:dishId
function read (req, res, next) {
    res.json({
        data: res.locals.dish
    })
}

// PUT /dishes/:dishId
function update (req, res, next) {
    const {
        data: { id, name, description, price, image_url }
    } = req.body
    const { dishId } = req.params

    // if id matches params, set res.locals.dish.id to be
    if (!id) {
        res.locals.dish.id = res.locals.dish.id;
    } else {
        res.locals.dish.id = id;
    }
    res.locals.dish.name = name
    res.locals.dish.description = description
    res.locals.dish.price = price
    res.locals.dish.image_url = image_url
    res.status(200).json({ data: res.locals.dish })
}

module.exports = {
    create: [hasName, hasDescription, hasPrice, hasImageUrl, create],
    read: [isValid, read],
    update:[isValid, hasName, hasDescription, hasPrice, hasImageUrl, hasValidId, update],
    list,
}