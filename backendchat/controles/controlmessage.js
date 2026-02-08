const moduleconv = require("../modules/moduleconv");
const moduleconvtwo = require("../modules/moduleconctwo");
const { getReciverSocketId, io } = require("../Socket/socket.js");

const controlmessage = async (req, res) => {
    try {
        const { messages } = req.body;
        const { id: receverId } = req.params;
        const senderId = req.user._id;

        let chats = await moduleconv.findOne({
            participants: { $all: [senderId, receverId] }
        });

        if (!chats) {
            chats = await moduleconv.create({
                participants: [senderId, receverId],
            });
        }

        const newmessages = new moduleconvtwo({
            senderId,
            receverId,
            messages: messages,
            conversationId: chats._id,
            
        });

        if (newmessages) {
            chats.messages.push(newmessages._id);
        }

        // الحفظ في الداتابيز
        await Promise.all([chats.save(), newmessages.save()]);

        // --- تعديل منطقة الخطر (Socket.io) ---
        try {
            if (typeof getReciverSocketId === "function") {
                const reciverSocketId = getReciverSocketId(receverId);
                if (reciverSocketId && io) {
                    io.to(reciverSocketId).emit("newmessages", newmessages);
                }
            }
        } catch (socketErr) {
            console.error("Socket.io Error (Ignored):", socketErr.message);
            // بنعمل catch للسوكيت لوحده عشان الـ Response يرجع حتى لو السوكيت فيه مشكلة
        }

        // الرد لازم يرجع JSON سليم
        return res.status(201).json(newmessages);

    } catch (error) {
        console.error("🔥 Final Backend Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = controlmessage;  