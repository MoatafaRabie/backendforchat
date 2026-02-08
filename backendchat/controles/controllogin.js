const bcrypt = require("bcrypt");
const moduleuser = require("../modules/moduleuser");
const jwtToken = require("../auth/jwtweb");

const controllogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: "All fields are required" });

        const user = await moduleuser.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "email not found " });

        const passcompare = await bcrypt.compare(password, user.password);
        if (!passcompare)
            return res.status(401).json({ message: "the Password is incorrect" });

        // التعديل هنا: خزن التوكن اللي راجع من الدالة في متغير اسمه token
        // ملاحظة: تأكد إن ملف jwtweb بيرجع (return) التوكن فعلاً
        const token = jwtToken(user._id, res); 

        return res.status(201).send({ 
            message: "Login successful",
            user: { 
                _id: user._id, 
                username: user.username, 
                email: user.email, 
                token: token // دلوقتي الـ token بقى معرف ومش هيطلع Error
            }  
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}
module.exports = controllogin;
