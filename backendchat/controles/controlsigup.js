const moduleuser = require("../modules/moduleuser");
const bcrypt = require("bcrypt");
const jwtToken = require("../auth/jwtweb")
const siginn =async(req,res)=>{
    try{
    const {username , email ,password ,role } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ message: "All fields are required" });
    const emailexis = await moduleuser.findOne({email});
    const userexis = await moduleuser.findOne({username});
    if (!role) {
    return res.status(400).json({ message: "Role is required" });
}
    if (emailexis)
        return res.status(400).json({ message: "Email is already used" });
    if (userexis)
        return res.status(400).json({ message: "Username is already used" });
    const passbash = await bcrypt.hash(password,10);
    const newsuser= await moduleuser.create({
        username , email  ,password :passbash ,role

    })
    if(newsuser){
        await newsuser.save();
        jwtToken(newsuser._id,res)
    }else {
            res.status(500).send({ success: false, message: "Inavlid User Data" })
        }
res.status(201).json({message: "User created successfully",user: newsuser}); 


   } catch (error) {
    console.error(error);  
    return res.status(500).json({ message: "Server error" });
  }
};
module.exports = siginn;