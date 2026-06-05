document.addEventListener('DOMContentLoaded', () => {
    loadEvents();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.filter-btn.active').classList.remove('active');
            this.classList.add('active');
            loadEvents();
        });
    });
});

async function loadEvents() {
    try {
        const response = await fetch('data/events.json');
        const events = await response.json();
        const container = document.getElementById('events-container');
        container.innerHTML = '';

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';

            
            const userData = JSON.parse(localStorage.getItem('russianCultureUser')) || { eventsAttended: [] };
            const isAttended = userData.eventsAttended.includes(event.id);

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
                        <button class="btn-join-card" onclick="joinEventFromCard(${event.id}, ${event.coins}, '${event.form_link}')" ${isAttended ? 'disabled' : ''}>
                            ${isAttended ? '✅ Вы записаны' : 'Я ИДУ'}
                        </button>
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