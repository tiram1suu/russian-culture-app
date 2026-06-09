// ===== КОНФИГУРАЦИЯ =====
const GITHUB_USERNAME = "tiram1suu";
const REPO_NAME = "russian-culture-app";
const ADMIN_PASSWORD = "RCC2025!"; 

let currentEvents = [];
let editingId = null;
let uploadedImageBase64 = null;


function checkPassword() {
    const password = document.getElementById('admin-password').value;
    const token = document.getElementById('admin-token').value;
    
    if (password === ADMIN_PASSWORD) {
        
        if (token) {
            localStorage.setItem('github_token', token);
        }
        
        
        const savedToken = localStorage.getItem('github_token');
        if (!savedToken && !token) {
            alert('Введите GitHub токен');
            return;
        }
        
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-screen').style.display = 'block';
        loadEvents();
    } else {
        alert('Неверный пароль!');
    }
}


async function loadEvents() {
    const token = localStorage.getItem('github_token');
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/data/events.json`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const data = await response.json();
        const content = atob(data.content);
        currentEvents = JSON.parse(content);
        renderEvents();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        document.getElementById('events-container-admin').innerHTML = '<p style="color:red;">Ошибка загрузки событий</p>';
    }
}


function renderEvents() {
    const container = document.getElementById('events-container-admin');
    if (currentEvents.length === 0) {
        container.innerHTML = '<p style="color:#888;">Пока нет событий. Добавьте первое!</p>';
        return;
    }
    container.innerHTML = currentEvents.map(event => `
        <div class="event-item">
            <div>
                <strong>${event.title}</strong> (${event.category})<br>
                <span style="color:#888; font-size:0.8rem;">${event.date} • ${event.time} • +${event.coins} монет</span>
            </div>
            <div>
                <button onclick="editEvent(${event.id})"><i class="fas fa-edit"></i></button>
                <button onclick="deleteEvent(${event.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}


function editEvent(id) {
    const event = currentEvents.find(e => e.id === id);
    if (!event) return;
    editingId = id;
    document.getElementById('form-title').textContent = '✏️ Редактировать событие';
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-title').value = event.title;
    document.getElementById('edit-category').value = event.category;
    document.getElementById('edit-date').value = event.date;
    document.getElementById('edit-time').value = event.time;
    document.getElementById('edit-coins').value = event.coins;
    document.getElementById('edit-form-link').value = event.form_link || '';
    uploadedImageBase64 = null;
    document.getElementById('image-preview-container').innerHTML = event.image ? `<img src="${event.image}" class="image-preview">` : '';
    document.getElementById('edit-image').value = '';
}

function cancelEdit() {
    editingId = null;
    document.getElementById('form-title').textContent = '➕ Добавить событие';
    document.getElementById('edit-id').value = '';
    document.getElementById('edit-title').value = '';
    document.getElementById('edit-category').value = '';
    document.getElementById('edit-date').value = '';
    document.getElementById('edit-time').value = '';
    document.getElementById('edit-coins').value = '';
    document.getElementById('edit-form-link').value = '';
    document.getElementById('image-preview-container').innerHTML = '';
    document.getElementById('edit-image').value = '';
    uploadedImageBase64 = null;
}


document.getElementById('edit-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        uploadedImageBase64 = event.target.result;
        document.getElementById('image-preview-container').innerHTML = `<img src="${uploadedImageBase64}" class="image-preview">`;
    };
    reader.readAsDataURL(file);
});


async function saveEvent() {
    const token = localStorage.getItem('github_token');
    const title = document.getElementById('edit-title').value.trim();
    const category = document.getElementById('edit-category').value.trim();
    const date = document.getElementById('edit-date').value.trim();
    const time = document.getElementById('edit-time').value.trim();
    const coins = parseInt(document.getElementById('edit-coins').value) || 0;
    const formLink = document.getElementById('edit-form-link').value.trim();

    if (!title || !category || !date || !time) {
        alert('Заполните все обязательные поля!');
        return;
    }

    let imageName = '';
    if (uploadedImageBase64) {
        
        imageName = await uploadImage(uploadedImageBase64, token);
        if (!imageName) {
            alert('Ошибка загрузки картинки');
            return;
        }
    }

    if (editingId) {
        
        const idx = currentEvents.findIndex(e => e.id === editingId);
        if (idx !== -1) {
            currentEvents[idx].title = title;
            currentEvents[idx].category = category;
            currentEvents[idx].date = date;
            currentEvents[idx].time = time;
            currentEvents[idx].coins = coins;
            currentEvents[idx].form_link = formLink;
            if (imageName) currentEvents[idx].image = `images/${imageName}`;
        }
    } else {
        
        const newId = currentEvents.length > 0 ? Math.max(...currentEvents.map(e => e.id)) + 1 : 1;
        currentEvents.push({
            id: newId,
            title: title,
            category: category,
            date: date,
            time: time,
            coins: coins,
            image: imageName ? `images/${imageName}` : '',
            form_link: formLink
        });
    }

    await saveEventsToGitHub(token);
    cancelEdit();
    renderEvents();
}


async function uploadImage(base64Image, token) {
    try {
        const fileName = `event_${Date.now()}.jpg`;
        const content = base64Image.split(',')[1];
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/images/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Add image ${fileName}`,
                content: content
            })
        });
        if (response.ok) {
            return fileName;
        } else {
            console.error('Ошибка загрузки картинки:', await response.json());
            return null;
        }
    } catch (error) {
        console.error('Ошибка загрузки картинки:', error);
        return null;
    }
}


async function saveEventsToGitHub(token) {
    try {
        
        const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/data/events.json`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const data = await getResponse.json();
        const sha = data.sha;

       
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(currentEvents, null, 2))));
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/data/events.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Update events via admin panel',
                content: content,
                sha: sha
            })
        });

        if (response.ok) {
            alert('✅ События сохранены!');
        } else {
            alert('❌ Ошибка сохранения: ' + (await response.json()).message);
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('❌ Ошибка сохранения на GitHub');
    }
}


async function deleteEvent(id) {
    if (!confirm('Удалить это событие?')) return;
    const token = localStorage.getItem('github_token');
    currentEvents = currentEvents.filter(e => e.id !== id);
    await saveEventsToGitHub(token);
    renderEvents();
}