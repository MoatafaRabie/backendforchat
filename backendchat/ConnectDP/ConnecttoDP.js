const Dp= require("mongoose");

const connectoDP =async () => {
    try{
        const connect= await Dp.connect("mongodb+srv://mostagakxkk34_db_user:01120551996m@cluster0.9h5jegr.mongodb.net/?appName=Cluster0");
        console.log("connected seccufully to DP");
    }
    catch(error){

        console.log(error);
        process.exit(1);

    };
    
    
}

module.exports = connectoDP;