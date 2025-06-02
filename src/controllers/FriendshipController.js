const friendshipService = require('../services/FriendshipService');
const { validationResult } = require('express-validator');

class FriendshipController {
    
    async createFriendship(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { userId1, userId2 } = req.body;
            
            if (userId1 === userId2) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot create friendship with yourself'
                });
            }
            
            const friendship = await friendshipService.createFriendship(userId1, userId2);
            
            res.status(201).json({
                success: true,
                message: 'Friendship created successfully',
                data: friendship
            });
        } catch (error) {
            next(error);
        }
    }
    
    async getFriendships(req, res, next) {
        try {
            const { userId } = req.params;
            const friendships = await friendshipService.getFriendships(userId);
            
            res.status(200).json({
                success: true,
                data: friendships,
                count: friendships.length
            });
        } catch (error) {
            next(error);
        }
    }
    
    async updateFriendshipStatus(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { userId1, userId2 } = req.params;
            const { status } = req.body;
            
            const result = await friendshipService.updateFriendshipStatus(userId1, userId2, status);
            
            res.status(200).json({
                success: true,
                message: 'Friendship status updated successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FriendshipController();