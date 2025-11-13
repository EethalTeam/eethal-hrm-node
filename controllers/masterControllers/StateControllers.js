const State = require('../../models/masterModels/State');

// Fields to extract for the response
// const fieldsToExtract = ['_id', 'StateCode', 'StateName', 'isActive'];

// Create a new State
exports.createState = async (req, res) => {
    try {
        const { StateCode, StateName, isActive } = req.body;

        // Check for duplicates (if needed)
        const existingState = await State.findOne({ 
            $or: [
                { StateCode }, 
                { StateName }
            ] 
        });
        if (existingState) {
            return res.status(400).json({ message: 'State with this code or name already exists' });
        }
        // Create and save the new State
        const state = new State({ StateCode, StateName , isActive });
        await state.save();

        res.status(200).json({ 
            message: 'State created successfully', 
            data: state._id 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all States
exports.getAllStates = async (req, res) => {
    try {
        //option 1 aggregate method
        const state= await State.aggregate([
        {
            $project:{
                _id:0,
                StateIDPK:'$_id',
                StateCode:1,
                StateName:1,
                isActive:1
            }
        }
    ])
        res.status(200).json(state);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single State by name
exports.getStateByName = async (req, res) => {
    try {
        const state = await State.findOne({ StateName: req.params.name })
    
        if (!state) {
            return res.status(400).json({ message: 'State not found' });
        }

        res.status(200).json(state);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a State
exports.updateState = async (req, res) => {
    try {
        const {StateIDPK,StateCode,StateName,isActive} = {...req.body};
        const state = await State.findByIdAndUpdate(
            StateIDPK,
            { $set:{StateCode,StateName,isActive}},
            { new: true, runValidators: true }
        );

        if (!state) {
            return res.status(400).json({ message: 'State not found' });
        }

        res.status(200).json({ message: 'State updated successfully', data: state });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a State
exports.deleteState = async (req, res) => {
    try {
        const { _id } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        
        const state = await State.findByIdAndDelete(_id);

        if (!state) {
            return res.status(400).json({ message: 'State not found' });
        }

        res.status(200).json({ message: 'State deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
