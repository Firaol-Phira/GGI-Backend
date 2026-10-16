const pool = require("../db");

// ========================================================
// ========================================================
// 1. SUBMIT CONTRIBUTION (Member)
// ========================================================
exports.submitContribution = async (req, res) => {
  const userId = req.user.id;
  const {
    amount,
    paymentType, // <--- Add paymentType here ('monthly' or 'yearly')
    paymentDate,
    paymentMethod,
    transactionReference,
    receiptUrl,
  } = req.body;

  try {
    if (!amount || !paymentDate || !transactionReference || !paymentType) {
      return res.status(400).json({
        message:
          "Amount, payment type, payment date, and transaction reference are required.",
      });
    }

    // Safe timezone parsing for 11th–16th window
    const dateStr = String(paymentDate).split("T")[0];
    const dayNumber = parseInt(dateStr.split("-")[2], 10);
    const isOnTime = dayNumber >= 11 && dayNumber <= 16 ? 1 : 0;

    const [existingTx] = await pool.query(
      "SELECT id FROM contributions WHERE transaction_reference = ?",
      [transactionReference],
    );

    if (existingTx.length > 0) {
      return res.status(400).json({
        message: "This transaction reference has already been submitted.",
      });
    }

    // Insert with payment_type
    const [result] = await pool.query(
      `INSERT INTO contributions 
       (user_id, amount, payment_type, payment_date, payment_method, transaction_reference, receipt_url, is_on_time, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        amount,
        paymentType, // <--- Saved here
        paymentDate,
        paymentMethod || "CBE (Commercial Bank of Ethiopia)",
        transactionReference,
        receiptUrl || null,
        isOnTime,
      ],
    );

    res.status(201).json({
      status: "success",
      message: "Contribution submitted successfully!",
      contributionId: result.insertId,
    });
  } catch (err) {
    console.error("Submit contribution error:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Server error while submitting contribution.",
      });
  }
};

// ========================================================
// 2. GET MEMBER CONTRIBUTIONS (Member History)
// ========================================================
exports.getMyContributions = async (req, res) => {
  const userId = req.user.id;

  try {
    const [contributions] = await pool.query(
      `SELECT id, amount, payment_date,payment_type, payment_method, transaction_reference, receipt_url, is_on_time, status, audit_notes, created_at 
       FROM contributions 
       WHERE user_id = ? 
       ORDER BY payment_date DESC`,
      [userId],
    );

    res.json({ status: "success", data: contributions });
  } catch (err) {
    console.error("Fetch contributions error:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Server error fetching contribution history.",
      });
  }
};

// ========================================================
// 3. GET ALL CONTRIBUTIONS FOR AUDIT QUEUE (Admin Only)
// ========================================================
exports.getAllContributions = async (req, res) => {
  try {
    const [contributions] = await pool.query(
      `SELECT c.id, c.amount, c.payment_date, c.payment_type,c.payment_method, c.transaction_reference, 
              c.receipt_url, c.is_on_time, c.status, c.audit_notes, c.created_at,
              u.full_name AS member_name, u.email AS member_email
       FROM contributions c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC`,
    );

    res.json({ status: "success", data: contributions });
  } catch (err) {
    console.error("Admin fetch contributions error:", err.message);
    res
      .status(500)
      .json({ status: "error", message: "Server error fetching audit queue." });
  }
};

// ========================================================
// 4. AUDIT / APPROVE / REJECT CONTRIBUTION (Admin Only)
// ========================================================
exports.auditContribution = async (req, res) => {
  const adminId = req.user.id;
  const { id } = req.params; // Contribution ID
  const { status, auditNotes } = req.body; // 'approved' or 'rejected'

  try {
    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Status must be either "approved" or "rejected".' });
    }

    // Update contribution status
    const [result] = await pool.query(
      `UPDATE contributions 
       SET status = ?, audited_by = ?, audit_notes = ? 
       WHERE id = ?`,
      [status, adminId, auditNotes || null, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Contribution record not found." });
    }

    // Write action into audit_logs table
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action_type, target_record_id, description) 
       VALUES (?, ?, ?, ?)`,
      [
        adminId,
        `AUDIT_CONTRIBUTION_${status.toUpperCase()}`,
        id,
        `Contribution ID ${id} was marked as ${status}. Notes: ${auditNotes || "None"}`,
      ],
    );

    res.json({
      status: "success",
      message: `Contribution has been successfully ${status}.`,
    });
  } catch (err) {
    console.error("Audit contribution error:", err.message);
    res
      .status(500)
      .json({
        status: "error",
        message: "Server error auditing contribution.",
      });
  }
};
