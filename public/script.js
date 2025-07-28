let uidList = [];
let logs = [];

async function loadUIDs() {
  const res = await fetch('/uids');
  uidList = await res.json();
  renderUIDs();
}

async function loadLogs() {
  try {
    const res = await fetch('/logs');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    logs = await res.json();
    console.log('Loaded logs:', logs); // Debug
    renderLogs();
    updateSlotStatus();
  } catch (err) {
    console.error('Error loading logs:', err);
  }
}

async function addUID() {
  const uid = document.getElementById('uidInput').value.trim();
  const state = document.getElementById('stateSelect').value;
  if (!uid) return alert('Enter UID');

  try {
    const res = await fetch('/uids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, state })
    });

    if (res.status === 409) {
      alert('UID already exists!');
    } else if (res.ok) {
      document.getElementById('uidInput').value = '';
      await loadUIDs();
    } else {
      alert('Error adding UID');
    }
  } catch (err) {
    alert('Server error!');
  }
}

async function deleteUID(uid) {
  await fetch(`/uids/${uid}`, { method: 'DELETE' });
  await loadUIDs();
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
    console.error('Table element not found!');
    return;
  }
  table.innerHTML = `
    <thead>
      <tr>
        <th>Day</th>
        <th>UID</th>
        <th>In/Out</th>
        <th>Time</th>
        <th>Slot Trống</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  if (!logs || logs.length === 0) {
    table.querySelector('tbody').innerHTML = '<tr><td colspan="6">No logs available</td></tr>';
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

  document.getElementById('slot0').textContent = `Slot 1: ${slots.S1 ? 'Occupied' : 'Available'}`;
  document.getElementById('slot1').textContent = `Slot 2: ${slots.S2 ? 'Occupied' : 'Available'}`;
  document.getElementById('slot2').textContent = `Slot 3: ${slots.S3 ? 'Occupied' : 'Available'}`;
  document.getElementById('slot3').textContent = `Slot 4: ${slots.S4 ? 'Occupied' : 'Available'}`;

  ['slot0', 'slot1', 'slot2', 'slot3'].forEach((id, index) => {
    const slot = document.getElementById(id);
    slot.classList.remove('available', 'occupied');
    slot.classList.add(slots[`S${index + 1}`] ? 'occupied' : 'available');
  });
}

loadUIDs();
loadLogs();
setInterval(loadLogs, 5000);

document.getElementById('logSearchInput').addEventListener('input', searchLogs);
