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

let shopItems = [];
let editingShopId = null;
let shopImageBase64 = null;

function showShopForm() {
    document.getElementById('shop-admin-form').style.display = 'block';
    document.getElementById('shop-form-title').textContent = '➕ Добавить товар';
    document.getElementById('shop-edit-id').value = '';
    document.getElementById('shop-edit-title').value = '';
    document.getElementById('shop-edit-description').value = '';
    document.getElementById('shop-edit-price').value = '';
    document.getElementById('shop-image-preview').innerHTML = '';
    document.getElementById('shop-edit-image').value = '';
    editingShopId = null;
    shopImageBase64 = null;
}

function cancelShopEdit() {
    document.getElementById('shop-admin-form').style.display = 'none';
    editingShopId = null;
    shopImageBase64 = null;
}

document.getElementById('shop-edit-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        shopImageBase64 = event.target.result;
        document.getElementById('shop-image-preview').innerHTML = `<img src="${shopImageBase64}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
});

async function loadShopItems() {
    try {
        const response = await fetch(`data/shop.json?t=${Date.now()}`);
        shopItems = await response.json();
        const container = document.getElementById('shop-items-container');
        if (shopItems.length === 0) {
            container.innerHTML = '<p style="color:#888;">Пока нет товаров</p>';
            return;
        }
        container.innerHTML = shopItems.map(item => `
            <div class="event-item">
                <div>
                    <strong>${item.title}</strong> (🪙 ${item.price})<br>
                    <span style="color:#888; font-size:0.8rem;">${item.description}</span>
                </div>
                <div>
                    <button onclick="editShopItem(${item.id})"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteShopItem(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading shop:', error);
        document.getElementById('shop-items-container').innerHTML = '<p style="color:red;">Ошибка загрузки</p>';
    }
}

function editShopItem(id) {
    const item = shopItems.find(i => i.id === id);
    if (!item) return;
    editingShopId = id;
    document.getElementById('shop-form-title').textContent = '✏️ Редактировать товар';
    document.getElementById('shop-edit-id').value = id;
    document.getElementById('shop-edit-title').value = item.title;
    document.getElementById('shop-edit-description').value = item.description;
    document.getElementById('shop-edit-price').value = item.price;
    document.getElementById('shop-image-preview').innerHTML = `<img src="${item.image}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;">`;
    document.getElementById('shop-edit-image').value = '';
    document.getElementById('shop-admin-form').style.display = 'block';
}

async function saveShopItem() {
    const token = localStorage.getItem('github_token');
    const title = document.getElementById('shop-edit-title').value.trim();
    const description = document.getElementById('shop-edit-description').value.trim();
    const price = parseInt(document.getElementById('shop-edit-price').value) || 0;

    if (!title || !price) {
        alert('Заполните название и цену!');
        return;
    }

    let imageName = '';
    if (shopImageBase64) {
        imageName = await uploadImage(shopImageBase64, token);
        if (!imageName) {
            alert('Ошибка загрузки картинки');
            return;
        }
    }

    if (editingShopId) {
        const idx = shopItems.findIndex(i => i.id === editingShopId);
        if (idx !== -1) {
            shopItems[idx].title = title;
            shopItems[idx].description = description;
            shopItems[idx].price = price;
            if (imageName) shopItems[idx].image = `images/${imageName}`;
        }
    } else {
        const newId = shopItems.length > 0 ? Math.max(...shopItems.map(i => i.id)) + 1 : 1;
        shopItems.push({
            id: newId,
            title: title,
            description: description,
            price: price,
            image: imageName ? `images/${imageName}` : ''
        });
    }

    await saveShopToGitHub(token);
    cancelShopEdit();
    loadShopItems();
}

async function saveShopToGitHub(token) {
    try {
        const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/data/shop.json`, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        const data = await getResponse.json();
        const sha = data.sha;
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(shopItems, null, 2))));
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/data/shop.json`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
            body: JSON.stringify({ message: 'Update shop via admin panel', content: content, sha: sha })
        });
        if (response.ok) {
            alert('✅ Товары сохранены!');
        } else {
            alert('❌ Ошибка сохранения: ' + (await response.json()).message);
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('❌ Ошибка сохранения на GitHub');
    }
}

async function deleteShopItem(id) {
    if (!confirm('Удалить этот товар?')) return;
    const token = localStorage.getItem('github_token');
    shopItems = shopItems.filter(i => i.id !== id);
    await saveShopToGitHub(token);
    loadShopItems();
}

loadShopItems();

async function loadPurchases() {
    try {
        const token = localStorage.getItem('github_token');
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/data/purchases.json`, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        const data = await response.json();
        if (!data.content) {
            document.getElementById('purchases-container').innerHTML = '<p style="color:#888;">Пока нет покупок</p>';
            return;
        }
        const purchases = JSON.parse(atob(data.content));
        const container = document.getElementById('purchases-container');
        container.innerHTML = purchases.reverse().map(p => `
            <div class="event-item">
                <div>
                    <strong>${p.username}</strong><br>
                    <span style="color:#888;">${p.itemTitle}</span><br>
                    <span style="color:#555; font-size:0.7rem;">${new Date(p.date).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки покупок:', error);
        document.getElementById('purchases-container').innerHTML = '<p style="color:red;">Ошибка загрузки</p>';
    }
}