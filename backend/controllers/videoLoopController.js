const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const VIDEOLOOP_DIR = path.join(__dirname, '../public/videoloop');

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await fs.mkdir(VIDEOLOOP_DIR, { recursive: true });
            cb(null, VIDEOLOOP_DIR);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Sanitize filename and add timestamp to prevent conflicts
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const timestamp = Date.now();
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        cb(null, `${name}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only video files
        const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed (mp4, webm, ogg, mov)'));
        }
    }
});

// List all loop videos
exports.listLoopVideos = async (req, res) => {
    try {
        await fs.mkdir(VIDEOLOOP_DIR, { recursive: true });
        const files = await fs.readdir(VIDEOLOOP_DIR);

        const videoFiles = [];
        for (const file of files) {
            const filePath = path.join(VIDEOLOOP_DIR, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                videoFiles.push({
                    filename: file,
                    size: stats.size,
                    url: `/public/videoloop/${file}`,
                    createdAt: stats.birthtime
                });
            }
        }

        // Sort by creation date (newest first)
        videoFiles.sort((a, b) => b.createdAt - a.createdAt);

        res.json(videoFiles);
    } catch (error) {
        console.error('Error listing loop videos:', error);
        res.status(500).json({ error: 'Failed to list videos' });
    }
};

// Upload loop video
exports.uploadLoopVideo = [
    upload.single('video'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No video file provided' });
            }

            res.status(201).json({
                message: 'Video uploaded successfully',
                file: {
                    filename: req.file.filename,
                    size: req.file.size,
                    url: `/public/videoloop/${req.file.filename}`
                }
            });
        } catch (error) {
            console.error('Error uploading video:', error);
            res.status(500).json({ error: 'Failed to upload video' });
        }
    }
];

// Delete loop video
exports.deleteLoopVideo = async (req, res) => {
    try {
        const { filename } = req.params;

        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(VIDEOLOOP_DIR, sanitizedFilename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Delete file
        await fs.unlink(filePath);

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
};
