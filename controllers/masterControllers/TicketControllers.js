const Ticket = require('../../models/masterModels/Ticket');

// @desc    Create a new ticket
// @route   POST /api/tickets/create
exports.createTicket = async (req, res) => {
  try {
    // UPDATED: Added 'assignedTo' to destructuring
    const { title, description, category, priority, dueDate, createdBy, assignedTo } = req.body;

    const newTicket = new Ticket({
      title,
      description,
      category,
      priority,
      dueDate,
      createdBy,
      assignedTo: assignedTo || null, // Assign if provided, otherwise null
    });

    await newTicket.save();
    res.status(201).json({ success: true, message: 'Ticket created successfully', ticket: newTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Assign a ticket to an employee
// @route   POST /api/tickets/assign
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId, employeeId } = req.body;

    if (!ticketId || !employeeId) {
      return res.status(400).json({ success: false, message: "Ticket ID and Employee ID are required." });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.assignedTo = employeeId;
    await ticket.save();

    // Populate the assignedTo field for the response
    const updatedTicket = await Ticket.findById(ticket._id).populate('assignedTo', 'name');

    res.status(200).json({ success: true, message: `Ticket assigned to ${updatedTicket.assignedTo.name}`, ticket: updatedTicket });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all tickets using POST for filtering
// @route   POST /api/tickets/list
exports.getAllTickets = async (req, res) => {
  try {
    const { search, status, priority } = req.body;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const tickets = await Ticket.find(query)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// This function is for the "Edit" dialog
exports.updateTicket = async (req, res) => {
    try {
        const { ticketId, ...updateData } = req.body;
        if (!ticketId) {
            return res.status(400).json({ success: false, message: "Ticket ID is required." });
        }
        const ticket = await Ticket.findByIdAndUpdate(ticketId, updateData, { new: true, runValidators: true });
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
        res.status(200).json({ success: true, message: 'Ticket updated successfully', ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// This new function is specifically for the "Change Status" dialog
exports.updateTicketStatus = async (req, res) => {
    try {
        const { ticketId, status } = req.body;
        if (!ticketId || !status) {
            return res.status(400).json({ success: false, message: "Ticket ID and status are required." });
        }
        const ticket = await Ticket.findByIdAndUpdate(ticketId, { status }, { new: true, runValidators: true });
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
        res.status(200).json({ success: true, message: `Ticket status updated to ${status}`, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get ticket statistics
// @route   POST /api/tickets/stats
exports.getTicketStats = async (req, res) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const openTickets = await Ticket.countDocuments({ status: 'Open' });
        const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });

        res.status(200).json({
            success: true,
            stats: { total: totalTickets, open: openTickets, inProgress: inProgressTickets, resolved: resolvedTickets }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get available status and priority options
// @route   POST /api/tickets/options
exports.getTicketOptions = async (req, res) => {
    try {
        const statuses = Ticket.schema.path('status').enumValues;
        const priorities = Ticket.schema.path('priority').enumValues;
        res.status(200).json({ success: true, statuses, priorities });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}