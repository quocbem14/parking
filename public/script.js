let uidList = [];
let logs = [];

async function loadUIDs() {
  const res = await fetch('/uids');
  uidList = await res.json();
  renderUIDs();
}

async function loadLogs() {
  const res = await fetch('/logs');
  logs = await res.json();
  renderLogs();
}

async function addUID() {
  const uid = document.getElementById('uidInput').value.trim();
  const state = document.getElementById('uidStatus').value;
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

function searchUID() {
  renderUIDs();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  renderUIDs();
}

function renderUIDs() {
  const listEl = document.getElementById('uidList');
  const search = document.getElementById('searchInput').value.toLowerCase();

  listEl.innerHTML = '';
  uidList
    .filter(u => u.uid.toLowerCase().includes(search))
    .forEach(u => {
      const li = document.createElement('li');
      li.textContent = `${u.uid} - ${u.state} (${new Date(u.time).toLocaleString()})`;
      const btn = document.createElement('button');
      btn.textContent = '🗑️';
      btn.onclick = () => deleteUID(u.uid);
      li.appendChild(btn);
      listEl.appendChild(li);
    });
}

function renderLogs() {
  const table = document.getElementById('logTable');
  table.innerHTML = '';
  logs.slice().reverse().forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.day}</td>
      <td>${log.uid}</td>
      <td>${log.inout || '-'}</td>
      <td>${new Date(log.time).toLocaleTimeString()}</td>
      <td>${log.slot || '-'}</td>
      <td>${log.status}</td>
    `;
    table.appendChild(row);
  });
}

loadUIDs();
loadLogs();
