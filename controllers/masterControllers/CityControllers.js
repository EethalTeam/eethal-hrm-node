const City = require('../../models/masterModels/City')
const State = require('../../models/masterModels/State');
const mongoose = require('mongoose');

// Fields to extract for the response
// const fieldsToExtract = ['_id', 'CityCode', 'CityName', 'isActive'];

// Create a new City
exports.createCity = async (req, res) => {
    try {
        const { CityCode, CityName,StateID, isActive } = req.body;

        // Check for duplicates (if needed)
        const existingCity = await City.findOne({ 
            $or: [
                { CityCode }, 
                { CityName }
            ] 
        });
        if (existingCity) {
            return res.status(400).json({ message: 'City with this code or name already exists' });
        }
       
const existingSTate = await State.findById(StateID);
if (!existingSTate) {
    return res.status(400).json({ message: 'Invalid StateID' });
}

        // Create and save the new City
        const city = new City({ CityCode, CityName,StateID , isActive });
        await city.save();

        res.status(200).json({ 
            message: 'City created successfully', 
            data: city._id 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all Citys
exports.getAllCitys = async (req, res) => {
    try {
        //option 1 aggregate method
        const {StateID} = req.body
        let filter={}
        if(StateID){
            filter.StateID=new mongoose.Types.ObjectId(StateID)
        }
        const city= await City.aggregate([
            {$match:filter},
            {
            $lookup:{
                from:'states',
                localField:'StateID',
                foreignField:'_id',
                as:'StateInfo'
            }
        },
        {
            $unwind:{
                path:"$StateInfo",
                preserveNullAndEmptyArrays:true
            }
        },
        {
            $project:{
                _id:0,
                CityIDPK:'$_id',
                CityCode:1,
                CityName:1,
                StateID:'$StateInfo._id',
                StateCode:'$StateInfo.StateCode',
                StateName:'$StateInfo.StateName',
                isActive:1
            }
        }
    ])
    // const city = City.find({filter})
        res.status(200).json(city);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single City by name
exports.getCityByName = async (req, res) => {
    try {
        const city = await City.findOne({ CityName: req.params.name })
        .populate('StateID', 'StateName StateCode');
    
        if (!city) {
            return res.status(400).json({ message: 'City not found' });
        }

        res.status(200).json(city);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a City
exports.updateCity = async (req, res) => {
    try {
        const {CityIDPK,CityCode,CityName,StateID,isActive} = {...req.body};
        const city = await City.findByIdAndUpdate(
            CityIDPK,
            { $set:{CityCode,CityName,StateID,isActive}},
            { new: true, runValidators: true }
        );

        if (!city) {
            return res.status(400).json({ message: 'City not found' });
        }

        res.status(200).json({ message: 'City updated successfully', data: city });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a City
exports.deleteCity = async (req, res) => {
    try {
        const { _id } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        
        const city = await City.findByIdAndDelete(_id);

        if (!city) {
            return res.status(400).json({ message: 'City not found' });
        }

        res.status(200).json({ message: 'City deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all states for dropdown
exports.getAllStates = async (req, res) => {
    try {
        const matchStage = {isActive:true}
       
        const states = await State.aggregate([
            { $match: matchStage }, // Apply filtering conditionally
            {
                $project: {
                    _id: 0,
                    StateIDPK: '$_id',
                    StateCode: '$StateCode',
                    StateName: '$StateName',
                }
            }
        ]);
        res.status(200).json({
            message: 'States fetched successfully',
            data: states
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};