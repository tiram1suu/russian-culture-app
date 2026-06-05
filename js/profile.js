document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    loadTelegramUser();
});

function loadTelegramUser() {
    
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            
            const fullName = `${user.first_name} ${user.last_name || ''}`.trim();
            const usernameElement = document.getElementById('tg-username');
            if (usernameElement) {
                usernameElement.textContent = fullName;
            }
            
            
            const avatarElement = document.getElementById('tg-avatar');
            if (avatarElement) {
                if (user.photo_url) {
                    avatarElement.style.backgroundImage = `url('${user.photo_url}')`;
                } else {
                    
                    avatarElement.style.backgroundImage = `url('https://via.placeholder.com/80')`;
                }
            }
            
            
            localStorage.setItem('tgUserId', user.id);
            localStorage.setItem('tgUsername', fullName);
        }
    }
}

function loadProfileData() {
    const userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
    
    const coinsElement = document.getElementById('coins-count');
    if (coinsElement) {
        coinsElement.textContent = userData.totalCoins;
    }
    
    const eventsElement = document.getElementById('events-count');
    if (eventsElement) {
        eventsElement.textContent = userData.eventsAttended.length;
    }

    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;
    
    if (userData.eventsAttended.length >= 1) {
        achievementsContainer.innerHTML = `
            <div class="achievement-card">
                <div class="ach-icon">🏆</div>
                <div>
                    <div style="font-weight:bold;">Первое событие</div>
                    <div style="font-size:0.8rem; color:#888;">Вы посетили своё первое мероприятие! +50 монет</div>
                </div>
                <div style="margin-left:auto; color:#ffd700;">✅</div>
            </div>
        `;
    } else {
        achievementsContainer.innerHTML = `
            <div class="achievement-card" style="opacity:0.5;">
                <div class="ach-icon">🔒</div>
                <div>
                    <div style="font-weight:bold;">Первое событие</div>
                    <div style="font-size:0.8rem; color:#888;">Посетите 1 мероприятие</div>
                </div>
            </div>
        `;
    }
}