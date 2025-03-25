/**
 * Express server with Supabase integration for activity and refresh token management.
 * @module index
 * @requires express
 * @requires @supabase/supabase-js
 * @requires dotenv
 * @requires cors
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Supabase client instance
 * @constant {Object}
 */
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

/**
 * @api {get} /activities Get all activities
 * @apiName GetActivities
 * @apiGroup Activities
 * @apiSuccess {Object[]} activities List of activities
 * @apiError {Object} error Error message
 */
app.get('/activities', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('activities')
            .select('*');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /activities/:id Get activity by ID
 * @apiName GetActivityById
 * @apiGroup Activities
 * @apiParam {String} id Activity ID
 * @apiSuccess {Object} activity Activity details
 * @apiError {Object} error Error message
 * @apiError (404) {Object} error Activity not found
 */
app.get('/activities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /activities Create new activity
 * @apiName CreateActivity
 * @apiGroup Activities
 * @apiBody {Object} activity Activity data
 * @apiSuccess {Object} activity Created activity
 * @apiError {Object} error Error message
 */
app.post('/activities', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('activities')
            .insert([req.body])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /refresh-tokens Upsert refresh token
 * @apiName UpsertRefreshToken
 * @apiGroup RefreshTokens
 * @apiDescription Updates an existing refresh token or creates a new one if it doesn't exist
 * 
 * @apiBody {String} user_id User's unique identifier
 * @apiBody {String} refresh_token OAuth refresh token
 * 
 * @apiSuccess {Object} data Upserted refresh token record
 * @apiSuccess {String} data.user_id User ID
 * @apiSuccess {String} data.refresh_token Refresh token
 * @apiSuccess {String} data.updated_at Last update timestamp
 * 
 * @apiError (400) {Object} error Missing required fields
 * @apiError (500) {Object} error Server error
 * 
 * @example
 * POST /refresh-tokens
 * {
 *   "user_id": "user123",
 *   "refresh_token": "abc123xyz"
 * }
 */
app.post('/refresh-tokens', async (req, res) => {
    try {
        const { user_id, refresh_token } = req.body;

        if (!user_id || !refresh_token) {
            return res.status(400).json({
                error: 'user_id and refresh_token are required'
            });
        }

        console.log(user_id);
        console.log(refresh_token);

        const { data, error } = await supabase
            .from('refresh_tokens')
            .update({
                refresh_token,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id)
            .select();

        if (error) throw error;

        res.status(200).json(data[0]);
    } catch (error) {
        console.error('Error upserting refresh token:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /refresh-tokens/:user_id Get refresh token
 * @apiName GetRefreshToken
 * @apiGroup RefreshTokens
 * @apiDescription Retrieves a refresh token for a specific user
 * 
 * @apiParam {String} user_id User's unique identifier
 * 
 * @apiSuccess {Object} data Refresh token record
 * @apiSuccess {String} data.refresh_token Refresh token
 * @apiSuccess {String} data.updated_at Last update timestamp
 * 
 * @apiError (400) {Object} error Missing user_id
 * @apiError (404) {Object} error Refresh token not found
 * @apiError (500) {Object} error Server error
 * 
 * @example
 * GET /refresh-tokens/user123
 */
app.get('/refresh-tokens/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({
                error: 'user_id is required'
            });
        }

        const { data, error } = await supabase
            .from('refresh_tokens')
            .select('refresh_token, updated_at')
            .eq('user_id', user_id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    error: 'Refresh token not found'
                });
            }
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching refresh token:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /athletes/:id Update athlete
 * @apiName UpdateAthlete
 * @apiGroup Athletes
 * @apiDescription Updates an athlete's information by ID
 * 
 * @apiParam {String} id Athlete's unique identifier
 * @apiBody {Object} athlete Athlete data
 * 
 * @apiSuccess {Object} data Updated athlete record
 * @apiError (400) {Object} error Missing required fields
 * @apiError (404) {Object} error Athlete not found
 * @apiError (500) {Object} error Server error
 */
app.post('/athletes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const athleteData = req.body;

        if (!id || !athleteData) {
            return res.status(400).json({
                error: 'Athlete ID and update data are required'
            });
        }

        // Remove any id from the body to prevent overwriting
        delete athleteData.id;

        console.log(id);
        console.log(athleteData);

        const { data, error } = await supabase
            .from('athletes')
            .update({
                ...athleteData,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', id)
            .select();

        if (error) {
            if (error) {
                return res.status(200).json({
                    message: error.message
                });
            }
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error updating athlete:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /athletes/:id/stats Update athlete stats
 * @apiName UpdateAthleteStats
 * @apiGroup Athletes
 * @apiDescription Updates an athlete's statistics by athlete ID
 * 
 * @apiParam {String} id Athlete's unique identifier
 * @apiBody {Object} stats Athlete statistics data
 * 
 * @apiSuccess {Object} data Updated athlete stats record
 * @apiError (400) {Object} error Missing required fields
 * @apiError (404) {Object} error Athlete stats not found
 * @apiError (500) {Object} error Server error
 */
app.post('/athletes/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const statsData = req.body;

        if (!id || !statsData) {
            return res.status(400).json({
                error: 'Athlete ID and stats data are required'
            });
        }

        // Remove any athlete_id from the body to prevent overwriting
        delete statsData.user_id;

        const { data, error } = await supabase
            .from('athlete_stats')
            .update({
                ...statsData,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', id)
            .select();

        if (error) {
            if (error) {
                return res.status(200).json({
                    message: error.message
                });
            }
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error updating athlete stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Database Schema
 * @typedef {Object} RefreshToken
 * @property {string} user_id - Primary key, user's unique identifier
 * @property {string} refresh_token - OAuth refresh token
 * @property {string} updated_at - Timestamp of last update
 */

/**
 * Start the server
 * @constant {number} PORT - Server port number
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
