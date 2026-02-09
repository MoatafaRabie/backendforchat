const express = require("express");
const connectoDP = require("./ConnectDP/ConnecttoDP");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require('dotenv');

const { app, server } = require("./Socket/socket"); 

const sigin = require("./controles/controlsigup");
const controllogin = require("./controles/controllogin");
const controllogout = require("./controles/controllogout");
const controlmessage = require("./controles/controlmessage");
const isLogin = require("./middleware/isLogin");
const controlgetmessages = require("./controles/controlgetmessages");
const getuseresarch = require("./controles/controlgetuseresarch");
const getcurrentchatters = require("./controles/controlgetcurrentchatter");

dotenv.config();

app.use(cors({
    origin: "https://frontendchat1-avb3-lime.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/signup", sigin);
app.post("/api/login", controllogin);
app.post("/api/logout", controllogout);

app.post("/api/message/send/:id", isLogin, controlmessage);
app.get("/api/message/:id", isLogin, controlgetmessages); 

app.get("/api/login/search", isLogin, getuseresarch);
app.get("/api/user/currentchatters", isLogin, getcurrentchatters);

const startServer = async () => {
    try {
        await connectoDP();
        server.listen(8000, () => {
            console.log("Server is running on port 8000 and Socket.io is ready!");
        });
    } catch (error) {
        console.log("Database connection failed", error);
    }
}


startServer();


