const moduleconvtwo = require("../modules/moduleconctwo");

const controlgetvideo = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await moduleconvtwo.findById(messageId).select("video");
        if (!message || !message.video || !message.video.data) {
            return res.status(404).json({ message: "Video not found" });
        }

        const vid = message.video;
        // ensure we have a Buffer
        const dataBuffer = Buffer.isBuffer(vid.data) ? vid.data : Buffer.from(vid.data);
        const total = vid.size || dataBuffer.length;

        // support Range requests for seeking/streaming
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
            if (isNaN(start) || isNaN(end) || start >= total) {
                res.status(416).set({ 'Content-Range': `bytes */${total}` }).end();
                return;
            }

            const chunkEnd = Math.min(end, total - 1);
            const chunk = dataBuffer.slice(start, chunkEnd + 1);

            res.status(206).set({
                'Content-Range': `bytes ${start}-${chunkEnd}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunk.length,
                'Content-Type': vid.contentType || 'application/octet-stream'
            });
            return res.send(chunk);
        }

        // fallback: send whole file
        res.set({
            'Content-Type': vid.contentType || 'application/octet-stream',
            'Content-Length': total,
            'Accept-Ranges': 'bytes'
        });
        return res.send(dataBuffer);
    } catch (error) {
        console.error("Error streaming video:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = controlgetvideo;
