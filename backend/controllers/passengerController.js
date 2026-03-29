const Passenger = require('../models/Passenger');

exports.registerPassenger = async (req, res) => {
    try {
        const { fullName, address, cellphone, email } = req.body;

        // Basic validation
        if (!fullName || !address || !cellphone || !email) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newPassenger = await Passenger.create({
            fullName,
            address,
            cellphone,
            email
        });

        res.status(201).json({
            message: 'Passenger registered successfully',
            passenger: newPassenger
        });
    } catch (error) {
        console.error('Error registering passenger:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
