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
        fileSize: 500 * 1024 * 1024 // 500MB limit
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
        console.log('>>> [LIST LOOP VIDEOS] Fetching from DB...');
        const videos = await LoopVideo.findAll({
            order: [['createdAt', 'DESC']]
        });

        const videoList = videos.map(v => ({
            filename: v.filename,
            sourceType: v.sourceType,
            streamUrl: v.streamUrl,
            url: v.sourceType === 'file' ? `/public/videoloop/${v.filename}` : v.streamUrl,
            businessName: v.businessName,
            targetUrl: v.targetUrl,
            phoneNumber: v.phoneNumber,
            description: v.description,
            logoUrl: v.logoUrl,
            status: v.status,
            lat: v.lat,
            lng: v.lng,
            address: v.address,
            email: v.email,
            createdAt: v.createdAt
        }));

        res.json(videoList);
    } catch (error) {
        console.error('CRITICAL ERROR in listLoopVideos:', error);
        res.status(500).json({ error: `Failed to list videos: ${error.message}` });
    }
};

exports.uploadLoopVideo = [
    upload.fields([{ name: 'video', maxCount: 1 }, { name: 'logo', maxCount: 1 }]),
    async (req, res) => {
        try {
            console.log('>>> [UPLOAD LOOP VIDEO] Request received', {
                body: req.body,
                files: req.files ? Object.keys(req.files) : 'none'
            });

            const videoFile = req.files && req.files.video ? req.files.video[0] : null;
            const logoFile = req.files && req.files.logo ? req.files.logo[0] : null;
            const { businessName, targetUrl, phoneNumber, description, lat, lng, address, email, sourceType, streamUrl } = req.body;

            if (sourceType === 'file' && !videoFile) {
                return res.status(400).json({ error: 'No video file provided for file source' });
            }

            if (sourceType !== 'file' && !streamUrl) {
                return res.status(400).json({ error: 'Stream URL is required for non-file sources' });
            }

            const filename = videoFile ? videoFile.filename : `stream_${Date.now()}.url`;

            console.log('>>> [UPLOAD LOOP VIDEO] Saving to DB...', { filename });

            // Save metadata to DB
            const metadata = await LoopVideo.create({
                filename,
                sourceType: sourceType || 'file',
                streamUrl: streamUrl || '',
                businessName: businessName || '',
                targetUrl: targetUrl || '',
                phoneNumber: phoneNumber || '',
                description: description || '',
                logoUrl: logoFile ? `/public/logos/${logoFile.filename}` : '',
                status: 'active',
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
                address: address || '',
                email: email || ''
            });

            console.log('>>> [UPLOAD LOOP VIDEO] Success');

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
            console.error('>>> [UPLOAD LOOP VIDEO] CRITICAL ERROR:', error);
            res.status(500).json({
                error: 'Failed to upload video',
                details: error.message,
                stack: error.stack
            });
        }
    }
];

exports.updateLoopVideoMetadata = [
    upload.fields([{ name: 'logo', maxCount: 1 }]),
    async (req, res) => {
        try {
            const filename = req.query.filename || req.params.filename;
            const { businessName, targetUrl, phoneNumber, description, status, lat, lng, address, email } = req.body;
            const logoFile = req.files && req.files.logo ? req.files.logo[0] : null;

            console.log(`Update Metadata request for filename: ${filename}`, { businessName, targetUrl, phoneNumber, description, status, lat, lng, address, email });

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
                    lng: lng ? parseFloat(lng) : null,
                    address: '',
                    email: '',
                    sourceType: req.body.sourceType || 'file',
                    streamUrl: req.body.streamUrl || '',
                    duration: req.body.duration || 0
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
                if (address !== undefined) metadata.address = address;
                if (email !== undefined) metadata.email = email;
                if (req.body.sourceType !== undefined) metadata.sourceType = req.body.sourceType;
                if (req.body.streamUrl !== undefined) metadata.streamUrl = req.body.streamUrl;
                if (req.body.duration !== undefined) metadata.duration = parseInt(req.body.duration);
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
