document.addEventListener('DOMContentLoaded', () => {
    loadShop();
    loadCoins();
});

async function loadShop() {
    try {
        const response = await fetch(`data/shop.json?t=${Date.now()}`);
        const items = await response.json();
        const container = document.getElementById('shop-container');
        container.innerHTML = '';

        const userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
        const purchased = JSON.parse(localStorage.getItem('purchasedItems')) || [];

        const purchasesResponse = await fetch(`data/purchases.json?t=${Date.now()}`);
        const allPurchases = await purchasesResponse.json();

        items.forEach(item => {
            const isPurchasedByMe = purchased.includes(item.id);
            const totalPurchased = allPurchases.filter(p => p.itemId === item.id).length;
            const isSoldOut = item.limit && totalPurchased >= item.limit;
            const canBuy = userData.totalCoins >= item.price && !isPurchasedByMe && !isSoldOut;

            const card = document.createElement('div');
            card.className = 'shop-item';
            card.innerHTML = `
                <img src="${item.image}" onerror="this.src='https://via.placeholder.com/150?text=🎁'">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="price">🪙 ${item.price}</div>
                ${isSoldOut ? '<div style="color:#ff4444; font-weight:bold;">Раскупили</div>' : ''}
                <button class="btn-buy ${isPurchasedByMe ? 'purchased' : ''}" ${!canBuy ? 'disabled' : ''} onclick="buyItem(${item.id}, ${item.price})">
                    ${isPurchasedByMe ? '✅ Куплено' : isSoldOut ? 'Раскупили' : 'Купить'}
                </button>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading shop:', error);
        document.getElementById('shop-container').innerHTML = '<p style="color:red;">Не удалось загрузить магазин</p>';
    }
}

function loadCoins() {
    const userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
    document.getElementById('shop-coins').textContent = userData.totalCoins;
}

async function buyItem(id, price) {
    const tg = window.Telegram.WebApp;
    let userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
    let purchased = JSON.parse(localStorage.getItem('purchasedItems')) || [];

    if (userData.totalCoins < price) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }

    if (purchased.includes(id)) {
        tg.showAlert('Вы уже купили этот товар!');
        return;
    }

    const shopResponse = await fetch(`data/shop.json?t=${Date.now()}`);
    const items = await shopResponse.json();
    const item = items.find(i => i.id === id);
    if (item && item.limit) {
        const purchasesResponse = await fetch(`data/purchases.json?t=${Date.now()}`);
        const allPurchases = await purchasesResponse.json();
        const totalPurchased = allPurchases.filter(p => p.itemId === id).length;
        if (totalPurchased >= item.limit) {
            tg.showAlert('❌ Товар уже раскупили!');
            return;
        }
    }

    if (!confirm(`Купить "${item.title}" за ${price} монет?`)) return;

    userData.totalCoins -= price;
    purchased.push(id);
    localStorage.setItem('russianCultureUser', JSON.stringify(userData));
    localStorage.setItem('purchasedItems', JSON.stringify(purchased));

    const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
    const username = tgUser ? `@${tgUser.username || tgUser.first_name}` : 'Гость';
    const purchase = {
        itemId: id,
        itemTitle: item.title,
        username: username,
        date: new Date().toISOString()
    };

    await savePurchaseToGitHub(purchase);

    loadShop();
    loadCoins();
    tg.showAlert('✅ Покупка успешна!');
}

async function savePurchaseToGitHub(purchase) {
    try {
        const token = localStorage.getItem('github_token');
        const response = await fetch(`https://api.github.com/repos/tiram1suu/russian-culture-app/contents/data/purchases.json`, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        const data = await response.json();
        const sha = data.sha;
        let purchases = [];
        if (data.content) {
            purchases = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        }
        purchases.push(purchase);
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(purchases, null, 2))));
        const putResponse = await fetch(`https://api.github.com/repos/tiram1suu/russian-culture-app/contents/data/purchases.json`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
            body: JSON.stringify({
                message: 'Add purchase',
                content: content,
                sha: sha
            })
        });
        if (!putResponse.ok) {
            console.error('Ошибка сохранения покупки');
        }
    } catch (error) {
        console.error('Ошибка сохранения покупки:', error);
    }
}