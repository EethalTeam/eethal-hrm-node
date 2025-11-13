// controllers/groupController.js
const mongoose = require('mongoose');
const Group = require('../../models/masterModels/Group');
const Message = require('../../models/masterModels/Message');

exports.createGroup = async (req, res) => {
  try {
    const { groupName, description, memberIds } = req.body;
    const createdBy = req.user._id; // Assumes auth middleware sets req.user

    // --- Validation ---
    if (!groupName || !memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ message: "Group name and an array of member IDs are required." });
    }

    // --- Logic ---
    // Ensure the creator is always included as a member
    const allMemberIds = new Set(memberIds.map(id => id.toString()));
    allMemberIds.add(createdBy.toString());

    const newGroup = new Group({
      groupName,
      description,
      createdBy,
      admins: [createdBy], // The creator is the first admin
      members: Array.from(allMemberIds),
    });

    await newGroup.save();

    // Populate details before sending the response
    const populatedGroup = await Group.findById(newGroup._id)
      .populate('members', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name');

    res.status(201).json({ message: "Group created successfully", group: populatedGroup });

  } catch (error) {
    // Handle duplicate group name error
    if (error.code === 11000) {
      return res.status(409).json({ message: "A group with this name already exists." });
    }
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Server error while creating group." });
  }
};

exports.addMembersToGroup = async (req, res) => {
  try {
    // MODIFIED: Get groupId from req.body instead of req.params
    const { groupId, memberIds } = req.body;
    const requesterId = req.user._id;

    // --- Validation ---
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "A valid Group ID is required in the request body." });
    }
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "An array of member IDs to add is required." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // --- Authorization Check ---
    if (!group.admins.some(adminId => adminId.equals(requesterId))) {
      return res.status(403).json({ message: "Unauthorized: Only group admins can add members." });
    }

    // --- Logic ---
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: { $each: memberIds } } },
      { new: true }
    )
    .populate('members', 'name avatar')
    .populate('admins', 'name avatar');
    
    res.status(200).json({ message: "Members added successfully", group: updatedGroup });

  } catch (error) {
    console.error("Error adding members:", error);
    res.status(500).json({ message: "Server error while adding members." });
  }
};

exports.getGroupMessages = async (req, res) => {
    try {
        const { groupId, page = 1, limit = 50 } = req.body;
        const requesterId = req.user._id; 
        // --- Validation ---
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: "A valid Group ID is required." });
        }

        // --- Authorization ---
        // First, check if the group exists and if the requester is a member.
        const group = await Group.findOne({ _id: groupId, members: requesterId });

        if (!group) {
            return res.status(403).json({ message: "Group not found or you are not a member of this group." });
        }
        
        // --- Database Query with Pagination ---
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Find messages for the group, sort by newest first, and apply pagination
        const messages = await Message.find({ groupId: groupId })
            .sort({ createdAt: -1 }) // Sort by newest messages first
            .skip(skip)
            .limit(limitNum)
            .populate('senderId', 'name avatar'); // Get sender's details

        // Get total count of messages for pagination metadata
        const totalMessages = await Message.countDocuments({ groupId: groupId });
        const totalPages = Math.ceil(totalMessages / limitNum);

        res.status(200).json({
            success: true,
            messages: messages.reverse(), // Reverse the array to show oldest-to-newest on the UI
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalMessages: totalMessages
            }
        });

    } catch (error) {
        console.error("Error fetching group messages:", error);
        res.status(500).json({ message: "Server error while fetching messages." });
    }
};

exports.getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id; // Assumes your auth middleware sets req.user

        if (!userId) {
            return res.status(400).json({ message: "User ID not found. Authentication error." });
        }

        const groups = await Group.find({ members: userId })
            // Sort by the last updated time, so the most recently active groups are first
            .sort({ updatedAt: -1 })
            // Populate member and admin details
            .populate('members', 'name avatar')
            .populate('admins', 'name avatar')
            // Populate the last message and the sender of that message
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'senderId',
                    select: 'name' // We only need the sender's name for the preview
                }
            });

        res.status(200).json({ success: true, groups: groups });

    } catch (error) {
        console.error("Error fetching user groups:", error);
        res.status(500).json({ message: "Server error while fetching groups." });
    }
};

exports.removeMemberFromGroup = async (req, res) => {
    try {
        const { groupId, memberIdToRemove } = req.body;
        const requesterId = req.user._id; // Assumes auth middleware

        // --- Validation ---
        if (!groupId || !memberIdToRemove || !mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberIdToRemove)) {
            return res.status(400).json({ message: "Valid Group ID and Member ID to remove are required." });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        // --- Authorization Check ---
        // 1. Verify that the person making the request is an admin.
        if (!group.admins.some(adminId => adminId.equals(requesterId))) {
            return res.status(403).json({ message: "Unauthorized: Only group admins can remove members." });
        }

        // 2. Safety Check: Prevent removing the last admin.
        const isRemovingAdmin = group.admins.some(adminId => adminId.equals(memberIdToRemove));
        if (isRemovingAdmin && group.admins.length === 1) {
            return res.status(400).json({ message: "Cannot remove the only admin from the group. Assign a new admin first." });
        }
        
        // --- Logic ---
        // Use $pull to remove the memberId from both the 'members' and 'admins' arrays.
        // This single operation is atomic and efficient.
        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            {
                $pull: {
                    members: memberIdToRemove,
                    admins: memberIdToRemove // Also removes them from admins if they are one
                }
            },
            { new: true } // Return the updated document
        )
        .populate('members', 'name avatar')
        .populate('admins', 'name avatar');

        res.status(200).json({ message: "Member removed successfully", group: updatedGroup });

    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ message: "Server error while removing member." });
    }
};

exports.makeMemberAdmin = async (req, res) => {
    try {
        const { groupId, memberIdToPromote } = req.body;
        const requesterId = req.user._id; // Assumes auth middleware

        if (!groupId || !memberIdToPromote || !mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberIdToPromote)) {
            return res.status(400).json({ message: "Valid Group ID and Member ID to promote are required." });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        // --- Authorization & Pre-condition Checks ---
        // 1. Verify that the person making the request is an admin.
        if (!group.admins.some(adminId => adminId.equals(requesterId))) {
            return res.status(403).json({ message: "Unauthorized: Only group admins can promote other members." });
        }

        // 2. Verify that the user to be promoted is actually a member of the group.
        if (!group.members.some(memberId => memberId.equals(memberIdToPromote))) {
            return res.status(400).json({ message: "This user is not a member of the group and cannot be made an admin." });
        }

        // 3. Check if the user is already an admin.
        if (group.admins.some(adminId => adminId.equals(memberIdToPromote))) {
             return res.status(200).json({ message: "This member is already an admin.", group });
        }

        // --- Logic ---
        // Use $addToSet to add the new admin. This prevents duplicates if they were somehow already an admin.
        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            {
                $addToSet: { admins: memberIdToPromote }
            },
            { new: true } // Return the updated document
        )
        .populate('members', 'name avatar')
        .populate('admins', 'name avatar');

        res.status(200).json({ message: "Member promoted to admin successfully", group: updatedGroup });

    } catch (error) {
        console.error("Error promoting member to admin:", error);
        res.status(500).json({ message: "Server error while promoting member." });
    }
};