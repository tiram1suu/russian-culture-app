document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});

async function loadEvents() {
    try {
        const response = await fetch(`data/events.json?t=${Date.now()}`);
        const events = await response.json();
        const container = document.getElementById('events-container');
        container.innerHTML = '';


        let userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
        

        const existingIds = events.map(e => e.id);
        

        const validAttended = userData.eventsAttended.filter(id => existingIds.includes(id));
        

        if (validAttended.length !== userData.eventsAttended.length) {
            userData.eventsAttended = validAttended;
            localStorage.setItem('russianCultureUser', JSON.stringify(userData));
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';

            const isAttended = userData.eventsAttended.includes(event.id);


            let actionButton = '';
            if (isAttended) {
                actionButton = `
                    <button class="btn-cancel-card" onclick="cancelEvent(${event.id}, ${event.coins})">
                        ❌ Отменить запись
                    </button>
                `;
            } else {
                actionButton = `
                    <button class="btn-join-card" onclick="joinEventFromCard(${event.id}, ${event.coins}, '${event.form_link}')">
                        Я ИДУ
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="event-card-inner">
                    <div class="event-row">
                        <div class="event-img" style="background-image: url('${event.image}');"></div>
                        <div class="event-info">
                            <div class="event-date">${event.date} • ${event.time}</div>
                            <div class="event-title">${event.title}</div>
                            <div class="event-category">${event.category}</div>
                            <div style="margin-top: 5px; color: #ffd700; font-size: 0.8rem;">+${event.coins} монет</div>
                        </div>
                    </div>
                    <div class="event-actions">
                        ${actionButton}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-container').innerHTML = '<p style="color:red;">Не удалось загрузить события</p>';
    }
}


function joinEventFromCard(id, coins, formLink) {
    const tg = window.Telegram.WebApp;
    let userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
    
    if (userData.eventsAttended.includes(id)) {
        tg.showAlert("Вы уже записаны на это событие!");
        return;
    }

    userData.eventsAttended.push(id);
    userData.totalCoins += coins;
    localStorage.setItem('russianCultureUser', JSON.stringify(userData));

    if (formLink) {
        tg.openLink(formLink);
    } else {
        tg.showAlert("Ссылка на форму отсутствует. Свяжитесь с организатором.");
    }

    loadEvents();
    tg.showAlert(`Вы записаны! +${coins} монет. Всего: ${userData.totalCoins}`);
}


function cancelEvent(id, coins) {
    const tg = window.Telegram.WebApp;
    let userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [], totalCoins: 0 };
    
    if (!userData.eventsAttended.includes(id)) {
        tg.showAlert("Вы не записаны на это событие!");
        return;
    }

    
    if (!confirm('Вы уверены, что хотите отменить запись? Монеты вернутся.')) return;

    
    userData.eventsAttended = userData.eventsAttended.filter(e => e !== id);
    userData.totalCoins -= coins;
    
    
    if (userData.totalCoins < 0) userData.totalCoins = 0;
    
    localStorage.setItem('russianCultureUser', JSON.stringify(userData));

    loadEvents();
    tg.showAlert(`Запись отменена. Возвращено ${coins} монет. Всего: ${userData.totalCoins}`);
}