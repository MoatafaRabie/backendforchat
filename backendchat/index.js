const express = require("express");
const multer = require("multer");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const twilio = require("twilio");

dotenv.config();

const connectoDP = require("./ConnectDP/ConnecttoDP");
const { app, server } = require("./Socket/socket");

const {
  registerClient,
  unregisterClient,
  sendSSE,
} = require("./Socket/sseHelper");

// ===============================
// Controllers
// ===============================
const sigin = require("./controles/controlsigup");
const controllogin = require("./controles/controllogin");
const controllogout = require("./controles/controllogout");

const controlmessage = require("./controles/controlmessage");
const controlgetmessages = require("./controles/controlgetmessages");
const controlgetvideo = require("./controles/controlgetvideo");

const getuseresarch = require("./controles/controlgetuseresarch");
const getcurrentchatters = require("./controles/controlgetcurrentchatter");

const isLogin = require("./middleware/isLogin");

// ===============================
// Multer
// ===============================
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 100 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed"));
    }

    cb(null, true);
  },
});

// ===============================
// CORS
// ===============================
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  "https://frontendchat1.vercel.app";

const allowedOrigins = FRONTEND_ORIGIN.split(",").map((s) =>
  s.trim()
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked Origin:", origin);

      return callback(
        new Error("CORS policy: origin not allowed"),
        false
      );
    },

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

    credentials: true,

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(cookieParser());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ===============================
// SSE EVENTS
// ===============================
app.get("/events", (req, res) => {
  const userId =
    req.query.userId || req.headers["x-user-id"];

  if (!userId) {
    return res.status(400).send("missing userId");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",

    "Cache-Control": "no-cache",

    Connection: "keep-alive",
  });

  res.write("\n");

  registerClient(userId, res);

  req.on("close", () => {
    unregisterClient(userId);
  });
});

// ===============================
// SIGNALING
// ===============================
app.post("/api/signal/call", (req, res) => {
  const { to, from, room } = req.body;

  const ok = sendSSE(to, "incoming-call", {
    from,
    room,
  });

  res.json({ ok });
});

app.post("/api/signal/answer", (req, res) => {
  const { to, from, answer } = req.body;

  const ok = sendSSE(to, "call-answered", {
    from,
    answer,
  });

  res.json({ ok });
});

app.post("/api/signal/ice", (req, res) => {
  const { to, from, candidate } = req.body;

  const ok = sendSSE(to, "ice-candidate", {
    from,
    candidate,
  });

  res.json({ ok });
});

app.post("/api/signal/end", (req, res) => {
  const { to, from } = req.body;

  const ok = sendSSE(to, "call-ended", {
    from,
  });

  res.json({ ok });
});

// ===============================
// TWILIO VIDEO TOKEN
// ===============================
app.post("/api/twilio/token", async (req, res) => {
  try {

    console.log("========== TWILIO TOKEN ==========");

    console.log("BODY:", req.body);

    const { identity, room } = req.body || {};

    console.log("IDENTITY:", identity);

    console.log("ROOM:", room);

    // ===========================
    // ENV VARIABLES
    // ===========================
    const accountSid =
      process.env.TWILIO_ACCOUNT_SID;

    const apiKeySid =
      process.env.TWILIO_API_KEY_SID;

    const apiKeySecret =
      process.env.TWILIO_API_KEY_SECRET;

    console.log(
      "ACCOUNT SID:",
      accountSid || "MISSING"
    );

    console.log(
      "API KEY SID:",
      apiKeySid || "MISSING"
    );

    console.log(
      "API SECRET:",
      apiKeySecret ? "EXISTS" : "MISSING"
    );

    if (!accountSid) {
      return res.status(500).json({
        error: "TWILIO_ACCOUNT_SID missing",
      });
    }

    if (!apiKeySid) {
      return res.status(500).json({
        error: "TWILIO_API_KEY_SID missing",
      });
    }

    if (!apiKeySecret) {
      return res.status(500).json({
        error: "TWILIO_API_KEY_SECRET missing",
      });
    }

    // ===========================
    // TWILIO ACCESS TOKEN
    // ===========================
    const AccessToken =
      twilio.jwt.AccessToken;

    console.log(
      "AccessToken:",
      AccessToken ? "OK" : "FAILED"
    );

    const VideoGrant =
      AccessToken.VideoGrant;

    console.log(
      "VideoGrant:",
      VideoGrant ? "OK" : "FAILED"
    );

    if (!AccessToken) {
      return res.status(500).json({
        error: "AccessToken failed",
      });
    }

    if (!VideoGrant) {
      return res.status(500).json({
        error: "VideoGrant failed",
      });
    }

    // ===========================
    // CREATE TOKEN
    // ===========================
    const token = new AccessToken(
      accountSid,
      apiKeySid,
      apiKeySecret,
      {
        identity: identity || "guest",

        ttl: 3600,
      }
    );

    console.log("TOKEN CREATED");

    // ===========================
    // VIDEO GRANT
    // ===========================
    const videoGrant = new VideoGrant({
      room: room || "default-room",
    });

    token.addGrant(videoGrant);

    console.log("VIDEO GRANT ADDED");

    // ===========================
    // JWT
    // ===========================
    const jwt = token.toJwt();

    console.log(
      "JWT:",
      jwt ? "GENERATED" : "FAILED"
    );

    console.log("========== SUCCESS ==========");

    return res.json({
      token: jwt,
    });

  } catch (err) {

    console.error(
      "========== TWILIO ERROR =========="
    );

    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

// ===============================
// AUTH
// ===============================
app.post("/api/signup", sigin);

app.post("/api/login", controllogin);

app.post("/api/logout", controllogout);

// ===============================
// MESSAGES
// ===============================
app.post(
  "/api/message/send/:id",
  isLogin,
  upload.single("video"),
  controlmessage
);

app.get(
  "/api/message/:id",
  isLogin,
  controlgetmessages
);

app.get(
  "/api/message/video/:messageId",
  isLogin,
  controlgetvideo
);

// ===============================
// USERS
// ===============================
app.get(
  "/api/login/search",
  isLogin,
  getuseresarch
);

app.get(
  "/api/user/currentchatters",
  isLogin,
  getcurrentchatters
);

// ===============================
// START SERVER
// ===============================
const startServer = async () => {
  try {

    await connectoDP();

    const PORT =
      process.env.PORT || 8000;

    server.listen(PORT, () => {

      console.log(
        `Server running on port ${PORT}`
      );

      console.log(
        "Socket.io Ready"
      );
    });

  } catch (error) {

    console.log(
      "Database connection failed",
      error
    );
  }
};

startServer();
