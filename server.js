const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();

// Lấy cổng từ biến môi trường của Render hoặc mặc định là 3000
const port = process.env.PORT || 3000;

// Đường dẫn tệp
const uidPath = './data/uids.json';
const logPath = './data/logs.json';

// Tạo thư mục và tệp nếu chưa tồn tại
if (!fs.existsSync('./data')) {
  console.log('Tạo thư mục ./data');
  fs.mkdirSync('./data', { recursive: true });
}
if (!fs.existsSync(uidPath)) {
  console.log('Tạo tệp uids.json');
  fs.writeFileSync(uidPath, '[]');
}
if (!fs.existsSync(logPath)) {
  console.log('Tạo tệp logs.json');
  fs.writeFileSync(logPath, '[]');
}

// Middlewares
app.use(cors({ origin: '*' })); // Cho phép tất cả nguồn cho ESP32 và web
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hàm phụ trợ
const readJSON = (path) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`Lỗi khi đọc ${path}:`, err);
    return [];
  }
};

const writeJSON = (path, data) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`Ghi thành công vào ${path}`);
  } catch (err) {
    console.error(`Lỗi khi ghi vào ${path}:`, err);
    throw err; // Ném lỗi để xử lý ở cấp route
  }
};

// Routes

// Lấy danh sách UID
app.get('/uids', (req, res) => {
  try {
    const uids = readJSON(uidPath);
    res.json(uids);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi đọc danh sách UID' });
  }
});

// Thêm UID mới
app.post('/uids', (req, res) => {
  try {
    const uids = readJSON(uidPath);
    let { uid, state } = req.body;

    if (!uid || !state) {
      return res.status(400).json({ error: 'UID và state là bắt buộc' });
    }

    uid = uid.toUpperCase();

    if (uids.find((u) => u.uid === uid)) {
      return res.status(409).json({ error: 'UID đã tồn tại' });
    }

    uids.push({ uid, state, time: new Date().toISOString() });
    writeJSON(uidPath, uids);
    res.status(201).json({ message: 'UID đã được thêm' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi thêm UID' });
  }
});

// Xóa UID
app.delete('/uids/:uid', (req, res) => {
  try {
    const uid = req.params.uid.toUpperCase();
    const uids = readJSON(uidPath);
    const updated = uids.filter((u) => u.uid !== uid);
    if (uids.length === updated.length) {
      return res.status(404).json({ error: 'UID không tồn tại' });
    }
    writeJSON(uidPath, updated);
    res.status(200).json({ message: 'UID đã được xóa' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi xóa UID' });
  }
});

// Lấy danh sách log
app.get('/logs', (req, res) => {
  try {
    const logs = readJSON(logPath);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi đọc danh sách log' });
  }
});

// Thêm log từ ESP32 hoặc Web
app.post('/logs', (req, res) => {
  try {
    let logs = readJSON(logPath);
    const logData = req.body;

    console.log('Nhận dữ liệu log:', logData); // Debug payload nhận được

    if (!logData.uid || !logData.status) {
      return res.status(400).json({ error: 'UID và status là bắt buộc' });
    }

    // Lưu toàn bộ payload và thêm các trường time, day nếu cần
    const log = {
      ...logData,
      time: logData.time || new Date().toISOString(),
      day: logData.day || new Date().toISOString().slice(0, 10),
    };

    logs.push(log);
    writeJSON(logPath, logs);
    res.status(201).json({ message: 'Log đã được thêm' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi thêm log' });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`✅ Server đang chạy trên cổng ${port}`);
  console.log(`Truy cập tại: https://parking-manager.onrender.com/ (thay bằng URL Render thực tế)`);
});
