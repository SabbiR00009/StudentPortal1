const pool = require('../../db');

const getFaculty = async (req, res) => {
  try {
    const [faculty] = await pool.query("SELECT * FROM faculty ORDER BY name");
    res.json(faculty);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, department, designation } = req.body;

    let faculty_id;
    let isUnique = false;

    // Loop until we find an ID that doesn't exist
    while (!isUnique) {
      const randomNum = Math.floor(100 + Math.random() * 900); // 100 to 999
      faculty_id = `F-${department}-${randomNum}`;

      const [exists] = await pool.query("SELECT id FROM faculty WHERE faculty_id = ?", [faculty_id]);
      if (exists.length === 0) isUnique = true;
    }

    const email = `${faculty_id}@san.edu`;

    await pool.query(
      "INSERT INTO faculty (faculty_id, name, email, department, designation, password) VALUES (?, ?, ?, ?, ?, '123456')",
      [faculty_id, name, email, department, designation]
    );

    res.json({ success: true, message: `Faculty Added! ID: ${faculty_id}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    await pool.query("DELETE FROM faculty WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getFaculty,
  createFaculty,
  deleteFaculty
};
