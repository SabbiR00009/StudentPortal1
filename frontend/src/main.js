const API_URL = 'http://localhost:3000/api';

async function fetchUsers() {
  const response = await fetch(`${API_URL}/users`);
  const users = await response.json();
  displayUsers(users);
}

function displayUsers(users) {
  const userList = document.getElementById('user-list');
  userList.innerHTML = users.map(user => 
    `<li>${user.name} - ${user.email}</li>`
  ).join('');
}

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  
  await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });
  
  fetchUsers();
  e.target.reset();
});

fetchUsers();