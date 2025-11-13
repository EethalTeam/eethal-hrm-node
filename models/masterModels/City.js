const mongoose = require('mongoose');

// Define the City Schema
const CitySchema = new mongoose.Schema(
  {
    CityCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    CityName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    StateID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State', 
        required: true
      },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }, { timestamps: true }
);

// Create the City Model
const City = mongoose.model('City', CitySchema);

module.exports = City;
