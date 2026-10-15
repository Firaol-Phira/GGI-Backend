const pool = require("../db"); // Your MAMP MySQL pool connection

// 1. Get all announcements (Filtered by user role)
exports.getAnnouncements = async (req, res) => {
  try {
    const query = `SELECT * FROM news_announcements ORDER BY is_pinned DESC, created_at DESC`;
    const [rows] = await pool.query(query);

    return res.status(200).json({
      status: "success",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
// 2. Create a new announcement (Admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, meet_link, category, target_role, is_pinned } =
      req.body;
    const author_id = req.user.id;

    if (!title || !content) {
      return res.status(400).json({
        status: "error",
        message: "Title and content are required fields.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO news_announcements 
        (title, content, author_id, meet_link, category, target_role, is_pinned) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        author_id,
        meet_link || null,
        category || "general",
        target_role || "all",
        is_pinned ? 1 : 0,
      ],
    );

    return res.status(201).json({
      status: "success",
      message: "Announcement posted successfully!",
      announcementId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 3. Update an existing announcement (Admin only)
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, meet_link, category, target_role, is_pinned } =
      req.body;

    const [result] = await pool.query(
      `UPDATE news_announcements 
       SET title = ?, content = ?, meet_link = ?, category = ?, target_role = ?, is_pinned = ? 
       WHERE id = ?`,
      [
        title,
        content,
        meet_link || null,
        category || "general",
        target_role || "all",
        is_pinned ? 1 : 0,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Announcement not found." });
    }

    return res.status(200).json({
      status: "success",
      message: "Announcement updated successfully!",
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 4. Delete an announcement (Admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM news_announcements WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Announcement not found." });
    }

    return res.status(200).json({
      status: "success",
      message: "Announcement deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
