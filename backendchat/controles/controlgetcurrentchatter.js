const moduleuser = require("../modules/moduleuser")
const moduleconv = require("../modules/moduleconv")
const getcurrentchatters = async (req, res) => {
    try {
        // التعديل هنا: شيلنا _condition
        const currentUserID = req.user._id; 
        
        const currentchatters = await moduleconv.find({
            participants: currentUserID
        }).sort({ updatedAt: -1 });

        if (!currentchatters || currentchatters.length === 0)
            return res.status(200).send([]);

        const participantsIDS = currentchatters.reduce((ids, conv) => {
            const otherparty = conv.participants.filter(id => id.toString() !== currentUserID.toString());
            return [...ids, ...otherparty];
        }, []);

        const user = await moduleuser.find({ _id: { $in: participantsIDS } }).select("-password -email");
        
        // تنظيف القائمة من أي null أو تكرار
        const users = participantsIDS.map(id => user.find(u => u._id.toString() === id.toString())).filter(u => u);

        res.status(200).send(users);
    } catch (error) {
        console.log(error); // عشان تشوف الخطأ في التيرمينال
        return res.status(500).json({ message: "Server error in getcurrentchatters" });
    }
}

module.exports =getcurrentchatters;
