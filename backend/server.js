const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// FIX BUG #1: Đồng bộ thông tin kết nối với docker-compose.yml
// Tên database phải là 'tododb' để khớp với file init.sql
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "tododb",
  password: process.env.DB_PASSWORD || "123456",
  port: process.env.DB_PORT || 5432,
});

// Endpoint kiểm tra sức khỏe hệ thống
app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: "1.0.0" });
});

// Lấy danh sách công việc
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIX BUG #2: Thêm Validation để từ chối tiêu đề trống
app.post("/api/todos", async (req, res) => {
  try {
    const { title, completed = false } = req.body;

    // Kiểm tra nếu title trống hoặc chỉ có khoảng trắng
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await pool.query(
      "INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *",
      [title, completed],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIX BUG #3: Triển khai endpoint DELETE để xóa công việc
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIX BUG #4: Triển khai endpoint PUT để cập nhật công việc
app.put("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    const result = await pool.query(
      "UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *",
      [title, completed, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 8080;

// FIX BUG #5: CHẶN server tự động listen khi đang chạy Test
// Điều này giúp GitHub Actions không bị treo (vòng xoay màu vàng)
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
}

// FIX BUG #6: Export app để thư viện Supertest có thể nhận diện và chạy kiểm thử
// Thiếu dòng này sẽ gây lỗi "app.address is not a function"
module.exports = app;
