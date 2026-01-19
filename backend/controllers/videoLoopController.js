const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const VIDEOLOOP_DIR = path.join(__dirname, '../public/videoloop');
const LOGO_DIR = path.join(__dirname, '../public/logos');

// Ensure directories exist
const ensureDirs = async () => {
    await fs.mkdir(VIDEOLOOP_DIR, { recursive: true });
    await fs.mkdir(LOGO_DIR, { recursive: true });
};
ensureDirs();

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'logo') {
            cb(null, LOGO_DIR);
        } else {
            cb(null, VIDEOLOOP_DIR);
        }
    },
    filename: (req, file, cb) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const timestamp = Date.now();
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        cb(null, `${file.fieldname}_${name}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'video') {
            const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed for the video field'));
            }
        } else if (file.fieldname === 'logo') {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for the logo field'));
            }
        } else {
            cb(null, true);
        }
    }
});

const LoopVideo = require('../models/LoopVideo');

// List all loop videos
exports.listLoopVideos = async (req, res) => {
    try {
        console.log('>>> [LIST LOOP VIDEOS] Fetching from dir and DB...');
        await fs.mkdir(VIDEOLOOP_DIR, { recursive: true });
        const files = await fs.readdir(VIDEOLOOP_DIR);

        const videoFiles = [];
        for (const file of files) {
            const filePath = path.join(VIDEOLOOP_DIR, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                // Find metadata in DB
                const metadata = await LoopVideo.findOne({ where: { filename: file } });

                videoFiles.push({
                    filename: file,
                    size: stats.size,
                    url: `/public/videoloop/${file}`,
                    createdAt: stats.birthtime,
                    businessName: metadata ? metadata.businessName : '',
                    targetUrl: metadata ? metadata.targetUrl : '',
                    phoneNumber: metadata ? metadata.phoneNumber : '',
                    description: metadata ? metadata.description : '',
                    logoUrl: metadata ? metadata.logoUrl : '',
                    status: metadata ? metadata.status : 'active',
                    lat: metadata ? metadata.lat : null,
                    lng: metadata ? metadata.lng : null
                });
            }
        }

        // Sort by creation date (newest first)
        videoFiles.sort((a, b) => b.createdAt - a.createdAt);

        res.json(videoFiles);
    } catch (error) {
        console.error('CRITICAL ERROR in listLoopVideos:', error);
        res.status(500).json({ error: `Failed to list videos: ${error.message}` });
    }
};

exports.uploadLoopVideo = [
    upload.fields([{ name: 'video', maxCount: 1 }, { name: 'logo', maxCount: 1 }]),
    async (req, res) => {
        try {
            if (!req.files || !req.files.video) {
                return res.status(400).json({ error: 'No video file provided' });
            }

            const videoFile = req.files.video[0];
            const logoFile = req.files.logo ? req.files.logo[0] : null;
            const { businessName, targetUrl, phoneNumber, description, lat, lng } = req.body;

            // Save metadata to DB
            const metadata = await LoopVideo.create({
                filename: videoFile.filename,
                businessName: businessName || '',
                targetUrl: targetUrl || '',
                phoneNumber: phoneNumber || '',
                description: description || '',
                logoUrl: logoFile ? `/public/logos/${logoFile.filename}` : '',
                status: 'active',
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null
            });

            res.status(201).json({
                message: 'Video uploaded successfully',
                file: {
                    filename: videoFile.filename,
                    size: videoFile.size,
                    url: `/public/videoloop/${videoFile.filename}`,
                    ...metadata.toJSON()
                }
            });
        } catch (error) {
            console.error('Error uploading video:', error);
            res.status(500).json({ error: 'Failed to upload video' });
        }
    }
];

exports.updateLoopVideoMetadata = [
    upload.fields([{ name: 'logo', maxCount: 1 }]),
    async (req, res) => {
        try {
            const filename = req.query.filename || req.params.filename;
            const { businessName, targetUrl, phoneNumber, description, status, lat, lng } = req.body;
            const logoFile = req.files && req.files.logo ? req.files.logo[0] : null;

            console.log(`Update Metadata request for filename: ${filename}`, { businessName, targetUrl, phoneNumber, description, status, lat, lng });

            if (!filename) {
                return res.status(400).json({ error: 'Filename is required' });
            }

            // Find or create metadata record
            let [metadata, created] = await LoopVideo.findOrCreate({
                where: { filename },
                defaults: {
                    businessName: businessName || '',
                    targetUrl: targetUrl || '',
                    phoneNumber: phoneNumber || '',
                    description: description || '',
                    logoUrl: logoFile ? `/public/logos/${logoFile.filename}` : '',
                    status: 'active',
                    lat: lat ? parseFloat(lat) : null,
                    lng: lng ? parseFloat(lng) : null
                }
            });

            if (!created) {
                if (businessName !== undefined) metadata.businessName = businessName;
                if (targetUrl !== undefined) metadata.targetUrl = targetUrl;
                if (phoneNumber !== undefined) metadata.phoneNumber = phoneNumber;
                if (description !== undefined) metadata.description = description;
                if (status !== undefined) metadata.status = status;
                if (lat !== undefined) metadata.lat = lat ? parseFloat(lat) : null;
                if (lng !== undefined) metadata.lng = lng ? parseFloat(lng) : null;
                if (logoFile) {
                    metadata.logoUrl = `/public/logos/${logoFile.filename}`;
                }
                await metadata.save();
            }

            res.json({
                message: 'Metadata updated successfully',
                metadata
            });
            console.log('Metadata update completed and responded.');
        } catch (error) {
            console.error('Error updating loop metadata:', error);
            res.status(500).json({ error: 'Failed to update metadata' });
        }
    }
];

// Delete loop video
exports.deleteLoopVideo = async (req, res) => {
    try {
        const filename = req.query.filename || req.params.filename;
        console.log(`Delete request for filename: ${filename}`);

        if (!filename) {
            console.warn('Delete failed: Filename is required.');
            return res.status(400).json({ error: 'Filename is required' });
        }

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

        // Delete metadata from DB
        await LoopVideo.destroy({ where: { filename: sanitizedFilename } });

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
};
