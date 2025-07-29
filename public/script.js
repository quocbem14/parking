const baseURL = 'https://your-app-name.onrender.com'; // Thay bằng URL Render thực tế

let uidList = [];
let logs = [];

async function loadUIDs() {
  try {
    const res = await fetch(`${baseURL}/uids`);
    if (!res.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
    uidList = await res.json();
    renderUIDs();
  } catch (err) {
    console.error('Lỗi khi tải danh sách UID:', err);
    alert('Không thể tải danh sách UID. Vui lòng kiểm tra kết nối hoặc server.');
  }
}

async function loadLogs() {
  try {
    const res = await fetch(`${baseURL}/logs`);
    if (!res.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
    logs = await res.json();
    console.log('Đã tải logs:', logs); // Debug
    renderLogs();
    updateSlotStatus();
  } catch (err) {
    console.error('Lỗi khi tải logs:', err);
    alert('Không thể tải logs. Vui lòng kiểm tra kết nối hoặc server.');
  }
}

async function addUID() {
  const uid = document.getElementById('uidInput').value.trim();
  const state = document.getElementById('stateSelect').value;
  if (!uid) return alert('Vui lòng nhập UID');

  try {
    const res = await fetch(`${baseURL}/uids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, state })
    });

    if (res.status === 409) {
      alert('UID đã tồn tại!');
    } else if (res.ok) {
      document.getElementById('uidInput').value = '';
      await loadUIDs();
      alert('UID đã được thêm thành công');
    } else {
      const error = await res.json();
      alert(`Lỗi khi thêm UID: ${error.error || 'Không xác định'}`);
    }
  } catch (err) {
    console.error('Lỗi server:', err);
    alert('Lỗi server khi thêm UID!');
  }
}

async function deleteUID(uid) {
  try {
    const res = await fetch(`${baseURL}/uids/${uid}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      await loadUIDs();
      alert(`UID ${uid} đã được xóa`);
    } else {
      const error = await res.json();
      alert(`Lỗi khi xóa UID: ${error.error || 'Không xác định'}`);
    }
  } catch (err) {
    console.error('Lỗi server:', err);
    alert('Lỗi server khi xóa UID!');
  }
}

function searchLogs() {
  const search = document.getElementById('logSearchInput').value.toLowerCase();
  renderLogs(search);
}

function clearLogSearch() {
  document.getElementById('logSearchInput').value = '';
  renderLogs();
}

function renderUIDs() {
  const listEl = document.getElementById('uidList');
  if (!listEl) {
    console.error('Không tìm thấy phần tử uidList!');
    return;
  }
  listEl.innerHTML = '';
  uidList.forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.uid} - ${u.state} (${new Date(u.time).toLocaleString()})`;
    const btn = document.createElement('button');
    btn.textContent = '🗑️';
    btn.onclick = () => deleteUID(u.uid);
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

function renderLogs(search = '') {
  const table = document.getElementById('logTable');
  if (!table) {
    console.error('Không tìm thấy phần tử logTable!');
    return;
  }
  table.innerHTML = `
    <thead>
      <tr>
        <th>Ngày</th>
        <th>UID</th>
        <th>Vào/Ra</th>
        <th>Thời gian</th>
        <th>Slot Trống</th>
        <th>Trạng thái</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  if (!logs || logs.length === 0) {
    table.querySelector('tbody').innerHTML = '<tr><td colspan="6">Không có log nào</td></tr>';
    return;
  }

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const day = log.time ? new Date(log.time).toLocaleDateString().toLowerCase() : '';
    const time = log.time ? new Date(log.time).toLocaleTimeString().toLowerCase() : '';
    const uid = log.uid ? log.uid.toLowerCase() : '';
    const status = log.status ? log.status.toLowerCase() : '';
    const inOut = log.inOut ? log.inOut.toLowerCase() : '';
    const slotTrong = typeof log.slotTrong === 'number' ? log.slotTrong.toString() : '';
    return (
      day.includes(search) ||
      time.includes(search) ||
      uid.includes(search) ||
      status.includes(search) ||
      inOut.includes(search) ||
      slotTrong.includes(search)
    );
  });

  filteredLogs.slice().reverse().forEach(log => {
    const row = document.createElement('tr');
    let day = 'N/A';
    let time = 'N/A';
    if (log.time) {
      const date = new Date(log.time);
      day = !isNaN(date) ? date.toLocaleDateString() : 'N/A';
      time = !isNaN(date) ? date.toLocaleTimeString() : 'N/A';
    }
    row.innerHTML = `
      <td>${day}</td>
      <td>${log.uid || 'N/A'}</td>
      <td>${log.inOut || 'N/A'}</td>
      <td>${time}</td>
      <td>${typeof log.slotTrong === 'number' ? log.slotTrong : 'N/A'}</td>
      <td>${log.status || 'N/A'}</td>
    `;
    table.querySelector('tbody').appendChild(row);
  });
}

function updateSlotStatus() {
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const slots = latestLog?.slots || { S1: false, S2: false, S3: false, S4: false };

  ['slot0', 'slot1', 'slot2', 'slot3'].forEach((id, index) => {
    const slot = document.getElementById(id);
    if (slot) {
      slot.textContent = `Slot ${index + 1}: ${slots[`S${index + 1}`] ? 'Đã chiếm' : 'Trống'}`;
      slot.classList.remove('available', 'occupied');
      slot.classList.add(slots[`S${index + 1}`] ? 'occupied' : 'available');
    }
  });
}

loadUIDs();
loadLogs();
setInterval(loadLogs, 5000);

document.getElementById('logSearchInput')?.addEventListener('input', searchLogs);
