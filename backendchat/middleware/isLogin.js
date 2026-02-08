const jwt = require("jsonwebtoken");
const moduleuser = require("../modules/moduleuser");

const isLogin = async (req, res, next) => { 
    try {
        const token = req.cookies.jwt;
        
        if (!token)
            return res.status(401).send({ success: false, message: "Unauthorized - No Token" }); // الـ status لازم 401 والـ success false

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decode)
            return res.status(401).send({ success: false, message: "Unauthorized - Invalid Token" });

        const user = await moduleuser.findById(decode.userId).select("-password");

        if (!user)
            return res.status(404).send({ success: false, message: "User not found" });

        req.user = user; 
        
        next();
    } catch (error) {
        console.log("Error in isLogin middleware: ", error.message);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}

module.exports = isLogin;