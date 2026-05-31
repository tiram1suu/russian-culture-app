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
            card.onclick = () => window.location.href = `event-detail.html?id=${event.id}`;

            card.innerHTML = `
                <div class="event-img" style="background-image: url('${event.image}');"></div>
                <div class="event-info">
                    <div class="event-date">${event.date} • ${event.time}</div>
                    <div class="event-title">${event.title}</div>
                    <div class="event-category">${event.category}</div>
                    <div style="margin-top: 5px; color: #ffd700; font-size: 0.8rem;">+${event.coins} монет</div>
                </div>
                <div class="event-arrow">➜</div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-container').innerHTML = '<p style="color:red;">Не удалось загрузить события</p>';
    }
}