const Trivia = require('../models/Trivia');
const { Sequelize } = require('sequelize');

exports.createTrivia = async (req, res) => {
    try {
        const { question, answer, category, duration, language } = req.body;
        const trivia = await Trivia.create({
            question,
            answer,
            category: category || 'General',
            duration: duration || 15,
            language: language || 'es'
        });
        res.status(201).json(trivia);
    } catch (error) {
        res.status(500).json({ error: 'Error creating trivia' });
    }
};

exports.getTrivias = async (req, res) => {
    try {
        const trivias = await Trivia.findAll({ order: [['createdAt', 'DESC']] });
        res.json(trivias);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching trivias' });
    }
};

exports.getRandomTrivia = async (req, res) => {
    try {
        const { lng } = req.query; // Idioma solicitado
        const where = { status: 'active' };
        if (lng) where.language = lng;

        const trivia = await Trivia.findOne({
            where,
            order: [Sequelize.fn('RANDOM')]
        });
        if (!trivia) return res.status(404).json({ error: 'No active trivias found' });
        res.json(trivia);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching random trivia' });
    }
};

exports.updateTrivia = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer, category, duration, status, language } = req.body;
        const trivia = await Trivia.findByPk(id);
        if (!trivia) return res.status(404).json({ error: 'Trivia not found' });

        if (question) trivia.question = question;
        if (answer) trivia.answer = answer;
        if (category) trivia.category = category;
        if (duration) trivia.duration = duration;
        if (status) trivia.status = status;
        if (language) trivia.language = language;

        await trivia.save();
        res.json(trivia);
    } catch (error) {
        res.status(500).json({ error: 'Error updating trivia' });
    }
};

exports.deleteTrivia = async (req, res) => {
    try {
        const { id } = req.params;
        await Trivia.destroy({ where: { id } });
        res.json({ message: 'Trivia deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting trivia' });
    }
};
