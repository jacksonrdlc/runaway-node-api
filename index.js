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
    console.log('Fetching all activities');
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
    console.log('Fetching activity by ID:', req.params.id);
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
    console.log('Creating new activity:', req.body);
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
 * @api {post} /tokens Upsert refresh token
 * @apiName UpsertRefreshToken
 * @apiGroup RefreshTokens
 * @apiDescription Updates an existing refresh token or creates a new one if it doesn't exist
 * 
 * @apiBody {String} user_id User's unique identifier
 * @apiBody {String} refresh_token OAuth refresh token
 * @apiBody {String} access_token OAuth access token
 * @apiBody {Number} expires_at Token expiration timestamp
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
 * POST /tokens
 * {
 *   "user_id": "user123",
 *   "refresh_token": "abc123xyz",
 *   "access_token": "def456uvw",
 *   "expires_at": 1640995200
 * }
 */
app.post('/tokens', async (req, res) => {
    console.log('Upserting refresh token for user:', req.body.user_id);
    try {
        const { user_id, refresh_token, access_token, expires_at } = req.body;

        if (!user_id || !refresh_token || !access_token || !expires_at) {
            return res.status(400).json({
                error: 'user_id, refresh_token, access_token, and expires_at are required'
            });
        }

        const { data, error } = await supabase
            .from('tokens')
            .upsert({
                user_id,
                refresh_token,
                access_token,
                expires_at: new Date(expires_at * 1000),
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error('Database error upserting token:', error);
            if (error.code === '23505') {
                return res.status(409).json({
                    error: 'Token conflict occurred'
                });
            }
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(500).json({
                error: 'Failed to upsert token'
            });
        }

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
    console.log('Fetching refresh token for user:', req.params.user_id);
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({
                error: 'user_id is required'
            });
        }

        const { data, error } = await supabase
            .from('tokens')
            .select('refresh_token, expires_at')
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
 * @api {get} /tokens/:user_id Get access token
 * @apiName GetAccessToken
 * @apiGroup Tokens
 * @apiDescription Retrieves an access token for a specific user
 * 
 * @apiParam {String} user_id User's unique identifier
 * 
 * @apiSuccess {Object} data Access token record
 * @apiSuccess {String} data.access_token Access token
 * @apiSuccess {String} data.updated_at Last update timestamp
 * 
 * @apiError (400) {Object} error Missing user_id
 * @apiError (404) {Object} error Access token not found
 * @apiError (500) {Object} error Server error
 * 
 * @example
 * GET /tokens/user123
 */
app.get('/tokens/:user_id', async (req, res) => {
    console.log('Fetching access token for user:', req.params.user_id);
    try {
        const { user_id } = req.params;

        if (!user_id || user_id.trim() === '') {
            return res.status(400).json({
                error: 'user_id is required'
            });
        }

        const { data, error } = await supabase
            .from('tokens')
            .select('access_token, expires_at')
            .eq('user_id', user_id)
            .maybeSingle();

        if (error) {
            console.error('Database error fetching access token:', error);
            return res.status(500).json({
                error: 'Database error occurred'
            });
        }

        if (!data) {
            return res.status(404).json({
                error: 'Access token not found'
            });
        }

        if (!data.access_token) {
            return res.status(404).json({
                error: 'Access token not found for this user'
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching access token:', error);
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
    console.log('Updating athlete:', req.params.id);
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


        const { data, error } = await supabase
            .from('athletes')
            .update({
                ...athleteData,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', id)
            .select();

        if (error) throw error;

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
    console.log('Updating athlete stats:', req.params.id);
    try {
        const { id } = req.params;
        const statsData = req.body;

        if (!id || !statsData) {
            return res.status(400).json({
                error: 'Athlete ID and stats data are required'
            });
        }


        const { data, error } = await supabase
            .from('athlete_stats')
            .update({
                ...statsData,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', id)
            .select();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Error updating athlete stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /map Create new map entry
 * @apiName CreateMapEntry
 * @apiGroup Map
 * @apiDescription Creates a new entry in the map table
 * 
 * @apiBody {Object} mapData Map entry data
 * 
 * @apiSuccess {Object} data Created map entry
 * @apiError (400) {Object} error Missing required fields
 * @apiError (500) {Object} error Server error
 * 
 * @example
 * POST /map
 * {
 *   "map_id": "user123",
 *   "summary_polyline": 37.7749
 * }
 */
app.post('/maps', async (req, res) => {
    console.log('Creating new map entry:', req.body);
    try {
        const mapData = req.body;

        if (!mapData) {
            return res.status(400).json({
                error: 'Map data is required'
            });
        }

        const { data, error } = await supabase
            .from('maps')
            .insert([{
                ...mapData,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creating map entry:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /sessions Create new session mapping
 * @apiName CreateSession
 * @apiGroup Sessions
 * @apiDescription Creates a new session mapping between sessionId and userId
 * 
 * @apiBody {String} sessionId Unique session identifier
 * @apiBody {String} userId User identifier to map to the session
 * 
 * @apiSuccess {Object} data Created session mapping
 * @apiError (400) {Object} error Missing required fields
 * @apiError (500) {Object} error Server error
 * 
 * @example
 * POST /sessions
 * {
 *   "sessionId": "sess_abc123",
 *   "userId": "user_456"
 * }
 */
app.post('/sessions', async (req, res) => {
    console.log('Creating new session mapping:', req.body);
    try {
        const { session_id, user_id, auth_id } = req.body;

        if (!session_id || !user_id || !auth_id) {
            return res.status(400).json({
                error: 'session_id and user_id are required'
            });
        }

        console.log(session_id, user_id);

        const { data, error } = await supabase
            .from('sessions')
            .insert([{
                session_id: session_id,
                user_id: user_id,
                auth_id: auth_id,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creating session mapping:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /sessions/:sessionId Get userId for session
 * @apiName GetSessionUser
 * @apiGroup Sessions
 * @apiDescription Retrieves the userId associated with a sessionId
 * 
 * @apiParam {String} sessionId Session identifier
 * 
 * @apiSuccess {Object} data Session mapping data
 * @apiSuccess {String} data.user_id User ID associated with the session
 * @apiSuccess {String} data.created_at Session creation timestamp
 * 
 * @apiError (400) {Object} error Missing sessionId
 * @apiError (404) {Object} error Session not found
 * @apiError (500) {Object} error Server error
 * 
 * @example
 * GET /sessions/sess_abc123
 */
app.get('/sessions/:sessionId', async (req, res) => {
    console.log('Fetching userId for session:', req.params.sessionId);
    try {
        const { session_id } = req.params;

        if (!session_id) {
            return res.status(400).json({
                error: 'session_id is required'
            });
        }

        const { data, error } = await supabase
            .from('sessions')
            .select('user_id, created_at')
            .eq('session_id', session_id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    error: 'Session not found'
                });
            }
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /auth/:userId Get auth ID by user ID
 * @apiName GetAuthIdByUserId
 * @apiGroup Auth
 * @apiDescription Retrieves the auth ID associated with a user ID
 * 
 * @apiParam {String} userId User identifier
 * 
 * @apiSuccess {Object} data Auth mapping data
 * @apiSuccess {String} data.auth_id Auth ID associated with the user
 * @apiSuccess {String} data.created_at Auth mapping creation timestamp
 * 
 * @apiError (400) {Object} error Missing userId
 * @apiError (404) {Object} error Auth mapping not found
 * @apiError (500) {Object} error Server error
 * 
 * @example
 * GET /auth/user_456
 */
app.get('/auth/:userId', async (req, res) => {
    console.log('Fetching auth ID for user:', req.params.userId);
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }
        console.log(userId);
        const { data, error } = await supabase
            .from('profiles')
            .select('auth_id, created_at')
            .eq('user_id', userId)
            .single();
        console.log(data);
        console.log(error);

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    error: 'Auth mapping not found'
                });
            }
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching auth ID:', error);
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
