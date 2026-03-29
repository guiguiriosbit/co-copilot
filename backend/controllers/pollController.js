const Poll = require('../models/Poll');
const PollResponse = require('../models/PollResponse');
const { Sequelize } = require('sequelize');

exports.createPoll = async (req, res) => {
    try {
        const { question, options, category, language } = req.body;
        const poll = await Poll.create({
            question,
            options,
            category: category || 'General',
            language: language || 'es'
        });
        res.status(201).json(poll);
    } catch (error) {
        res.status(500).json({ error: 'Error creating poll' });
    }
};

exports.getAllPolls = async (req, res) => {
    try {
        const polls = await Poll.findAll();
        res.json(polls);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching polls' });
    }
};

exports.getRandomPoll = async (req, res) => {
    try {
        const { lng } = req.query; // Idioma solicitado
        const where = { status: 'active' };
        if (lng) where.language = lng;

        const poll = await Poll.findOne({
            where,
            order: [Sequelize.fn('RANDOM')]
        });
        if (!poll) return res.status(404).json({ error: 'No active polls found' });
        res.json(poll);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching poll' });
    }
};

exports.submitVote = async (req, res) => {
    try {
        const { pollId, selectedOption, screenId, lat, lng } = req.body;
        const response = await PollResponse.create({ pollId, selectedOption, screenId, lat, lng });
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error: 'Error submitting vote' });
    }
};

exports.getPollResults = async (req, res) => {
    try {
        const { id } = req.params;
        const results = await PollResponse.findAll({
            where: { pollId: id },
            attributes: ['selectedOption', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            group: ['selectedOption']
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching results' });
    }
};

exports.deletePoll = async (req, res) => {
    try {
        const { id } = req.params;
        await Poll.destroy({ where: { id } });
        await PollResponse.destroy({ where: { pollId: id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting poll' });
    }
};
