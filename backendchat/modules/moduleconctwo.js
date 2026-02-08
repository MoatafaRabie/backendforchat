const mongoose = require("mongoose");

const moduleconvtwoSchema = new mongoose.Schema({
    // شيلنا الأقواس المربعة لأنهم شخص واحد مش مصفوفة
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // تأكد إن موديل المستخدم اسمه "User"
        required: true
    },
    receverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // الرسالة نفسها نص، مش محتاجة ref
    messages: {
        type: String,
        required: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId, // غيرنا النوع لـ ObjectId
        ref: "moduleconv", // بيشير للمحادثة
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("moduleconvtwo", moduleconvtwoSchema);