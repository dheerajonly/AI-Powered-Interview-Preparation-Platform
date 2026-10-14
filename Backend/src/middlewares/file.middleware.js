const multer = require("multer")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")
        if (!isPdf) {
            const error = new Error("Please upload a PDF resume. DOCX uploads are not supported by the current resume parser.")
            error.statusCode = 400
            return callback(error)
        }
        callback(null, true)
    }
})

module.exports = upload
