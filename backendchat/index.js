const express = require("express");
const multer = require("multer");
const connectoDP = require("./ConnectDP/ConnecttoDP");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require('dotenv');
const twilio = require("twilio");

const { app, server } = require("./Socket/socket"); 

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // حد 100 ميجابايت
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("video/")) {
            return cb(new Error("Only video files are allowed"));
        }
        cb(null, true);
    }
});

const sigin = require("./controles/controlsigup");
const controllogin = require("./controles/controllogin");
const controllogout = require("./controles/controllogout");
const controlmessage = require("./controles/controlmessage");
const isLogin = require("./middleware/isLogin");
const controlgetmessages = require("./controles/controlgetmessages");
const controlgetvideo = require("./controles/controlgetvideo");
const getuseresarch = require("./controles/controlgetuseresarch");
const getcurrentchatters = require("./controles/controlgetcurrentchatter");

dotenv.config();

// Allow configuring allowed frontend origin(s) via env var FRONTEND_ORIGIN.
// Accept a single origin or a comma-separated list.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://frontendchat1.vercel.app';
const allowedOrigins = FRONTEND_ORIGIN.split(',').map(s => s.trim());

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        console.warn(`CORS blocked origin ${origin}. Allowed: ${allowedOrigins.join(',')}`);
        return callback(new Error('CORS policy: origin not allowed'), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { registerClient, unregisterClient, sendSSE } = require('./Socket/sseHelper');

app.get('/events', (req, res) => {
    const userId = req.query.userId || req.headers['x-user-id'];
    if (!userId) return res.status(400).send('missing userId');

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.write('\n');

    registerClient(userId, res);

    req.on('close', () => {
        unregisterClient(userId);
    });
});

app.post('/api/signal/call', (req, res) => {
    const { to, from, offer } = req.body;
    const ok = sendSSE(to, 'incoming-call', { from, offer });
    return res.json({ ok });
});

app.post('/api/signal/answer', (req, res) => {
    const { to, from, answer } = req.body;
    const ok = sendSSE(to, 'call-answered', { from, answer });
    return res.json({ ok });
});

app.post('/api/signal/ice', (req, res) => {
    const { to, from, candidate } = req.body;
    const ok = sendSSE(to, 'ice-candidate', { from, candidate });
    return res.json({ ok });
});

app.post('/api/signal/end', (req, res) => {
    const { to, from } = req.body;
    const ok = sendSSE(to, 'call-ended', { from });
    return res.json({ ok });
});

// --- Twilio: generate Access Token for Programmable Video ------------------
// Requires these env vars to be set on the server (do NOT commit secrets):
// TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

app.post('/api/twilio/token', (req, res) => {

    console.log("BODY:", req.body);

    const { identity, room } = req.body || {};

    console.log("IDENTITY:", identity);
    console.log("ROOM:", room);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    console.log("ACCOUNT SID:", accountSid);
    console.log("API KEY SID:", apiKeySid);
    console.log("API SECRET:", apiKeySecret ? "EXISTS" : "MISSING");

    try {

        const twilio = require("twilio");

        console.log("TWILIO LOADED");

        const AccessToken = twilio.jwt.AccessToken;

        console.log("ACCESS TOKEN:", AccessToken ? "OK" : "FAILED");

        const VideoGrant = AccessToken.VideoGrant;

        console.log("VIDEO GRANT:", VideoGrant ? "OK" : "FAILED");

        const token = new AccessToken(
            accountSid,
            apiKeySid,
            apiKeySecret,
            {
                identity: identity || "guest",
                ttl: 3600
            }
        );

        console.log("TOKEN CREATED");

        const videoGrant = new VideoGrant({
            room: room || "default-room"
        });

        token.addGrant(videoGrant);

        console.log("GRANT ADDED");

        const jwt = token.toJwt();

        console.log("JWT:", jwt ? "GENERATED" : "FAILED");

        return res.json({
            token: jwt
        });

    } catch (err) {

        console.error("TWILIO TOKEN ERROR:");
        console.error(err);

        return res.status(500).json({
            error: err.message
        });
    }
});
    if (!AccessToken || !VideoGrant) return res.status(500).json({ error: 'twilio library not available on server' });

    try {
        const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, { ttl: 3600, identity });
        const grant = new VideoGrant({ room });
        token.addGrant(grant);
        res.json({ token: token.toJwt() });
    } catch (err) {
        console.error('Failed to create Twilio token', err);
        res.status(500).json({ error: err && err.message ? `failed to create token: ${err.message}` : 'failed to create token' });
    }
});

app.post("/api/signup", sigin);
app.post("/api/login", controllogin);
app.post("/api/logout", controllogout);

app.post("/api/message/send/:id", isLogin, upload.single("video"), controlmessage);
app.get("/api/message/:id", isLogin, controlgetmessages); 
app.get("/api/message/video/:messageId", isLogin, controlgetvideo);

app.get("/api/login/search", isLogin, getuseresarch);
app.get("/api/user/currentchatters", isLogin, getcurrentchatters);

const startServer = async () => {
    try {
        await connectoDP();
        const PORT = process.env.PORT || 8000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} and Socket.io is ready!`);
        });
    } catch (error) { 
        console.log("Database connection failed", error);
    }
}

startServer();
