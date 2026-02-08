const mongoose= require("mongoose");

const moduleconv = new mongoose.Schema({
    participants:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    messages: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "moduleconvtwo", // تأكد أن هذا هو الاسم المستخدم في mongoose.model
        default: []
    }
]
},{timestamps:true});

module.exports =mongoose.model("moduleconv",moduleconv);

