const moduleconv = require("../modules/moduleconv");
const moduleconvtwo = require("../modules/moduleconctwo");

const controlgetmessages = async(req, res) => {
    try {
        const { id: receverId } = req.params;
        const senderId = req.user._id;

        const chats = await moduleconv.findOne({
            participants: { $all: [senderId, receverId] }
        }).populate("messages"); // سيعمل الآن بعد تصحيح الـ ref

        if (!chats) return res.status(200).json([]);

        res.status(200).json(chats.messages);
    } catch (error) {
        console.error("🔥 Error in getMessages Controller:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
module.exports =controlgetmessages;