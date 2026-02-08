const mongoose= require("mongoose");
const { default: _default } = require("validator");

const moduleuser = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email : { type: String, required: true , unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["normal", "blind"] } ,
},{timestamps:true});

module.exports =mongoose.model("moduleuser",moduleuser);

