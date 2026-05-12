const moduleconv = require("../modules/moduleconv");
const moduleconvtwo = require("../modules/moduleconctwo");
const { getReciverSocketId, io } = require("../Socket/socket.js");

const controlmessage = async (req, res) => {
    try {
        const { messages } = req.body;
        const { id: receverId } = req.params;
        const senderId = req.user._id;

        if (!messages && !req.file) {
            return res.status(400).json({ message: "Please send a text message or video file." });
        }

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
            messages: messages || undefined,
            conversationId: chats._id,
            video: req.file ? {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                filename: req.file.originalname,
                size: req.file.size
            } : undefined
        });

        if (newmessages) {
            chats.messages.push(newmessages._id);
        }

        // الحفظ في الداتابيز
        await Promise.all([chats.save(), newmessages.save()]);

        // Emit message to the conversation room so all participants get it in real-time
        try {
            if (io && chats && chats._id) {
                io.to(String(chats._id)).emit("newmessages", newmessages);
                // also try SSE notify receiver directly (fallback when socket not connected)
                try {
                    const { sendSSE } = require('../Socket/sseHelper');
                    sendSSE(String(receverId), 'newmessages', newmessages);
                } catch (e) {}
            } else {
                // fallback: try per-user socket id
                const reciverSocketId = typeof getReciverSocketId === "function" ? getReciverSocketId(receverId) : null;
                if (reciverSocketId && io) {
                    io.to(reciverSocketId).emit("newmessages", newmessages);
                }
            }
        } catch (socketErr) {
            console.error("Socket.io Error (Ignored):", socketErr.message);
        }

        // نهيئ نسخة من المستند للرد بدون بافر الفيديو الثقيل
        const responseObj = newmessages.toObject ? newmessages.toObject() : JSON.parse(JSON.stringify(newmessages));
        if (responseObj.video) {
            responseObj.video = {
                filename: responseObj.video.filename,
                contentType: responseObj.video.contentType,
                size: responseObj.video.size,
                url: `/api/message/video/${newmessages._id}`
            };
        }

        return res.status(201).json(responseObj);

    } catch (error) {
        console.error("🔥 Final Backend Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = controlmessage;  
