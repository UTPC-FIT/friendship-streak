const express = require('express');
const { body, param } = require('express-validator');
const friendshipController = require('../controllers/FriendshipController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Friendships
 *   description: Módulo de Amistades
 */

/**
 * @swagger
 * /api/streak/friendships:
 *   post:
 *     summary: Create a new friendship
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId1
 *               - userId2
 *             properties:
 *               userId1:
 *                 type: string
 *               userId2:
 *                 type: string
 */
router.post('/', [
    body('userId1').isString().notEmpty().withMessage('userId1 is required'),
    body('userId2').isString().notEmpty().withMessage('userId2 is required')
], friendshipController.createFriendship);

/**
 * @swagger
 * /api/streak/friendships/{userId}:
 *   get:
 *     summary: Get user friendships
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:userId', [
    param('userId').isString().notEmpty().withMessage('userId is required')
], friendshipController.getFriendships);

/**
 * @swagger
 * /api/streak/friendships/{userId1}/{userId2}/status:
 *   put:
 *     summary: Update friendship status
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId1
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId2
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, blocked]
 */
router.put('/:userId1/:userId2/status', [
    param('userId1').isString().notEmpty(),
    param('userId2').isString().notEmpty(),
    body('status').isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status')
], friendshipController.updateFriendshipStatus);

module.exports = router;