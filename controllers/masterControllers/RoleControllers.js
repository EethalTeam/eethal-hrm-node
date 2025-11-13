const Role = require('../../models/masterModels/Role');

// Fields to extract for the response
// const fieldsToExtract = ['_id', 'RoleCode', 'RoleName', 'isActive'];

// Create a new Role
exports.createRole = async (req, res) => {
    try {
        const { RoleName, isActive } = req.body;

        // Check for duplicates (if needed)
        const existingRole = await Role.findOne({ 
            $or: [
                { RoleName }
            ] 
        });
        if (existingRole) {
            return res.status(400).json({ message: 'Role with this code or name already exists' });
        }
        // Create and save the new Role
        const role = new Role({RoleName , isActive });
        await role.save();

        res.status(200).json({ 
            message: 'Role created successfully', 
            data: role._id 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all Roles
exports.getAllRoles = async (req, res) => {
    try {
        //option 1 aggregate method
        const role= await Role.aggregate([
        {
            $project:{
                _id:0,
                RoleIDPK:'$_id',
                RoleCode:1,
                RoleName:1,
                isActive:1
            }
        }
    ])
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single Role by name
exports.getRoleByName = async (req, res) => {
    try {
        const role = await Role.findOne({ RoleName: req.body.name })
    
        if (!role) {
            return res.status(400).json({ message: 'Role not found' });
        }

        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a Role
exports.updateRole = async (req, res) => {
    try {
        const {RoleIDPK,RoleCode,RoleName,isActive} = {...req.body};
        const role = await Role.findByIdAndUpdate(
            RoleIDPK,
            { $set:{RoleCode,RoleName,isActive}},
            { new: true, runValidators: true }
        );

        if (!role) {
            return res.status(400).json({ message: 'Role not found' });
        }

        res.status(200).json({ message: 'Role updated successfully', data: role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a Role
exports.deleteRole = async (req, res) => {
    try {
        const { _id } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        
        const role = await Role.findByIdAndDelete(_id);

        if (!role) {
            return res.status(400).json({ message: 'Role not found' });
        }

        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
