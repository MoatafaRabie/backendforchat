const express = require("express");
const multer = require("multer");
const connectoDP = require("./ConnectDP/ConnecttoDP");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require('dotenv');

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

app.use(cors({
    origin: "https://frontendchat1.vercel.app",
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
        server.listen(8000, () => {
            console.log("Server is running on port 3001 and Socket.io is ready!");
        });
    } catch (error) { 
        console.log("Database connection failed", error);
    }
}

startServer();
