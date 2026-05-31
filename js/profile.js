document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
});

function loadProfileData() {
    const userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
    
    document.getElementById('coins-count').textContent = userData.totalCoins;
    document.getElementById('events-count').textContent = userData.eventsAttended.length;

    const achievementsContainer = document.getElementById('achievements-container');
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