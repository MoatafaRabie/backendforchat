const moduleconv = require("../modules/moduleconv");
const moduleconvtwo = require("../modules/moduleconctwo");

const controlgetmessages = async(req, res) => {
    try {
        const { id: receverId } = req.params;
        const senderId = req.user._id;

        const chats = await moduleconv.findOne({
            participants: { $all: [senderId, receverId] }
        }).populate("messages"); 

        if (!chats) return res.status(200).json([]);

        const mapped = chats.messages.map(msg => {
            const m = msg.toObject ? msg.toObject() : JSON.parse(JSON.stringify(msg));
            if (m.video && m.video.filename) {
                m.video = {
                    filename: m.video.filename,
                    contentType: m.video.contentType,
                    size: m.video.size,
                    url: `/api/message/video/${m._id}`
                };
            }
            return m;
        });

        res.status(200).json(mapped);
    } catch (error) {
        console.error("🔥 Error in getMessages Controller:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
module.exports =controlgetmessages;
