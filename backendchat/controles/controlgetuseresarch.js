const moduleuser = require("../modules/moduleuser");

const getuseresarch = async (req, res) => {
    try {
        const search = req.query.search || "";
        // التعديل 1: الوصول للـ ID مباشرة
        const currentUserID = req.user._id; 

        const users = await moduleuser.find({
            $and: [
                {
                    $or: [
                        // التعديل 2: تصحيح $options وإزالة الـ concatenation الزيادة
                        { username: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]
                },
                {
                    _id: { $ne: currentUserID } // استبعاد المستخدم الحالي
                }
            ]
        }).select("-password");

        res.status(200).send(users);
    } catch (error) {
        // التعديل 3: طباعة الخطأ في الـ Terminal عشان نعرف لو فيه حاجة تانية
        console.error("Error in getuseresarch:", error.message);
        return res.status(500).json({ message: "Server error in search" });
    }
}

module.exports = getuseresarch;