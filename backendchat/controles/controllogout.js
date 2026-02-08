
const controllogout= async (req,res)=>{
try{
    res.cookie("jwt","",{
        maxAge:0
    });

    res.status(201).send({massage :"user logout"})
}
catch (error) {
    console.error(error);  
    return res.status(500).json({ message: "Server error" });
  }


}
module.exports = controllogout ;