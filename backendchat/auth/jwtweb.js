const jwt = require("jsonwebtoken");

const jwtToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });

    res.cookie("jwt", token, { 
        maxAge: 15 * 24 * 60 * 60 * 1000, 
        httpOnly: true, 
        sameSite: "none",    
        secure: true,    
    });
    return token ;
};
 

module.exports = jwtToken;
