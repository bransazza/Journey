document.addEventListener('DOMContentLoaded', () => {
    // --- SETUP ---
    const PASSCODE = "GibranCintaFarah1506"; 
    const START_DATE = new Date("2025-06-15"); 

    // --- ELEMENTS ---
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    const passcodeIn = document.getElementById('passcode');
    const errorMsg = document.getElementById('error-msg');
    
    // DATA LOCAL STORAGE
    let places = JSON.parse(localStorage.getItem('couplePlaces')) || [];
    let todos = JSON.parse(localStorage.getItem('coupleTodos')) || [];
    let sliderInterval;

    // --- LOGIN SYSTEM ---
    if(sessionStorage.getItem('isLoggedIn') === 'true') {
        showApp();
    }

    window.checkLogin = () => {
        if(passcodeIn.value === PASSCODE) {
            sessionStorage.setItem('isLoggedIn', 'true');
            showApp();
        } else {
            errorMsg.innerText = "Kata sandi salah";
            passcodeIn.value = '';
        }
    };

    function showApp() {
        loginPage.classList.add('hidden');
        mainApp.classList.remove('hidden');
        updateTimer();
        renderPlaces();
        renderTodos();
        initDoodles();
        
        // Panggil Galeri Firebase
        if (window.loadGalleryFromFirebase) {
            window.loadGalleryFromFirebase();
        }
    }

    window.logout = () => {
        sessionStorage.removeItem('isLoggedIn');
        location.reload();
    };

    // --- NAVIGATION TABS ---
    window.switchTab = (tabName) => {
        const sections = ['gallery-section', 'add-section', 'plans-section'];
        const buttons = ['btn-view', 'btn-add', 'btn-plans'];

        sections.forEach(sec => document.getElementById(sec).classList.add('hidden'));
        buttons.forEach(btn => document.getElementById(btn).classList.remove('active-btn'));

        if (tabName === 'gallery') {
            document.getElementById('gallery-section').classList.remove('hidden');
            document.getElementById('btn-view').classList.add('active-btn');
            if(window.loadGalleryFromFirebase) window.loadGalleryFromFirebase();
        } else if (tabName === 'plans') {
            document.getElementById('plans-section').classList.remove('hidden');
            document.getElementById('btn-plans').classList.add('active-btn');
            renderPlaces();
            renderTodos();
            clearInterval(sliderInterval);
        } else if (tabName === 'add') {
            document.getElementById('add-section').classList.remove('hidden');
            document.getElementById('btn-add').classList.add('active-btn');
            clearInterval(sliderInterval);
        }
    };

    // --- TIMER ---
    function updateTimer() {
        const now = new Date();
        let years = now.getFullYear() - START_DATE.getFullYear();
        let months = now.getMonth() - START_DATE.getMonth();
        let days = now.getDate() - START_DATE.getDate();

        if (days < 0) { months--; let p = new Date(now.getFullYear(), now.getMonth(), 0); days += p.getDate(); }
        if (months < 0) { years--; months += 12; }
        document.getElementById('timer').innerText = `Ciee udah pacaran selama: \n${years} Thn, ${months} Bln, ${days} Hari`;
    }

    // --- SLIDER (HIGHLIGHT) - FIXED ---
    // Fungsi ini kita bikin global (window.) supaya bisa dipanggil dari index.html
    window.initSlider = function() {
        const sliderTrack = document.getElementById('slider-track');
        const highlightWrapper = document.getElementById('highlight-wrapper');
        
        // Cek elemen dengan class 'memory-cluster' (Struktur Vintage)
        const photoCards = document.querySelectorAll('.memory-cluster');

        if (sliderInterval) clearInterval(sliderInterval);

        // Jika tidak ada foto, sembunyikan slider
        if (photoCards.length === 0) {
            if(highlightWrapper) highlightWrapper.classList.add('hidden');
            return;
        }

        if(highlightWrapper) highlightWrapper.classList.remove('hidden');
        if(sliderTrack) sliderTrack.innerHTML = '';

        // Ambil 5 foto acak
        const cardsArray = Array.from(photoCards);
        const shuffled = cardsArray.sort(() => 0.5 - Math.random()).slice(0, 5);

        shuffled.forEach((card, index) => {
            // Ambil gambar dari dalam .paper-photo
            const imgEl = card.querySelector('.paper-photo img');
            // Ambil judul dari .paper-title
            const titleEl = card.querySelector('.paper-title');
            
            if(imgEl && titleEl) {
                const imgSrc = imgEl.src;
                // Bersihkan teks judul dari ikon 📌
                let rawTitle = titleEl.childNodes[0].textContent.trim(); 
                const title = rawTitle.replace('📌', '').trim();

                const slideDiv = document.createElement('div');
                slideDiv.className = index === 0 ? 'slide active' : 'slide';
                
                slideDiv.innerHTML = `
                    <img src="${imgSrc}" alt="Highlight">
                    <div class="slide-caption">${title}</div>
                `;
                sliderTrack.appendChild(slideDiv);
            }
        });

        // Jalankan Animasi
        let currentSlide = 0;
        const slideElements = document.querySelectorAll('.slide');

        if(slideElements.length > 1) {
            sliderInterval = setInterval(() => {
                slideElements[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % slideElements.length;
                slideElements[currentSlide].classList.add('active');
            }, 5000); 
        }
    };

    // --- PLANS (PLACE TO GO) ---
    window.addPlace = () => {
        const input = document.getElementById('placeInput');
        if(input.value.trim() === '') return;
        
        // UPDATE: Tambahkan property 'done: false'
        places.push({ id: Date.now(), text: input.value, done: false });
        
        localStorage.setItem('couplePlaces', JSON.stringify(places));
        input.value = '';
        renderPlaces();
    };

    window.renderPlaces = () => {
        const list = document.getElementById('placesList');
        if(!list) return;
        list.innerHTML = '';
        
        places.forEach(place => {
            const rot = Math.random() * 4 - 2;
            const li = document.createElement('li');
            
            // UPDATE: Cek apakah sudah done? Kalau ya, tambah class 'completed'
            if(place.done) li.classList.add('completed');
            
            li.style.transform = `rotate(${rot}deg)`;
            
            // UPDATE: Tambahkan onclick="togglePlace(...)" pada teks
            li.innerHTML = `
                <span onclick="togglePlace(${place.id})">📍 ${place.text}</span> 
                <button class="btn-del-list" onclick="deletePlace(${place.id})">✖</button>
            `;
            list.appendChild(li);
        });
    };

    // BARU: Fungsi untuk mencoret/un-coret Place
    window.togglePlace = (id) => {
        places = places.map(p => p.id === id ? {...p, done: !p.done} : p);
        localStorage.setItem('couplePlaces', JSON.stringify(places));
        renderPlaces();
    };

    window.deletePlace = (id) => {
        places = places.filter(p => p.id !== id);
        localStorage.setItem('couplePlaces', JSON.stringify(places));
        renderPlaces();
    };

    // --- TODOS (THINGS TO DO) ---
    window.addTodo = () => {
        const input = document.getElementById('todoInput');
        if(input.value.trim() === '') return;
        
        // UPDATE: Tambahkan property 'done: false'
        todos.push({ id: Date.now(), text: input.value, done: false });
        
        localStorage.setItem('coupleTodos', JSON.stringify(todos));
        input.value = '';
        renderTodos();
    };

    window.renderTodos = () => {
        const list = document.getElementById('todoList');
        if(!list) return;
        list.innerHTML = '';
        
        todos.forEach(todo => {
            const rot = Math.random() * 4 - 2;
            const li = document.createElement('li');
            
            // UPDATE: Cek status done
            if(todo.done) li.classList.add('completed');
            
            li.style.transform = `rotate(${rot}deg)`;
            
            // UPDATE: Tambahkan onclick="toggleTodo(...)"
            li.innerHTML = `
                <span onclick="toggleTodo(${todo.id})">📝 ${todo.text}</span> 
                <button class="btn-del-list" onclick="deleteTodo(${todo.id})">✖</button>
            `;
            list.appendChild(li);
        });
    };

    window.toggleTodo = (id) => {
        todos = todos.map(t => t.id === id ? {...t, done: !t.done} : t);
        localStorage.setItem('coupleTodos', JSON.stringify(todos));
        renderTodos();
    };

    window.deleteTodo = (id) => {
        todos = todos.filter(t => t.id !== id);
        localStorage.setItem('coupleTodos', JSON.stringify(todos));
        renderTodos();
    };

   // --- SEARCH FILTER ---
    window.filterLocalGallery = () => {
        const input = document.getElementById('searchInput');
        const filter = input.value.toLowerCase();
        const gallery = document.getElementById('gallery');
        // Mengambil semua elemen yang memiliki class 'memory-cluster' (Foto Vintage)
        const cards = gallery.getElementsByClassName('memory-cluster'); 

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            // Mengambil semua teks di dalam kartu (Judul, Tanggal, Desc, Tag)
            const textContent = card.innerText.toLowerCase(); 
            
            // Jika teks cocok, tampilkan. Jika tidak, sembunyikan (display: none).
            if (textContent.includes(filter)) {
                card.style.display = ""; 
            } else {
                card.style.display = "none"; 
            }
        }
    };

    // --- DEKORASI ---
    function initDoodles() {
        const container = document.getElementById('background-decor');
        if(!container) return;
        container.innerHTML = ''; 
        const svgs = [
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h19l-9 9"/><path d="M23 12L2 3"/></svg>`,
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
        ];
        for (let i = 0; i < 15; i++) {
            const div = document.createElement('div');
            div.className = 'scrap-doodle';
            div.innerHTML = svgs[Math.floor(Math.random() * svgs.length)];
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const size = Math.random() * 80 + 40; 
            const rot = Math.random() * 360;
            div.style.left = `${posX}%`;
            div.style.top = `${posY}%`;
            div.style.width = `${size}px`;
            div.style.height = `${size}px`;
            div.style.transform = `rotate(${rot}deg)`;
            container.appendChild(div);
        }
    }

    // --- MOUSE TRAIL ---
    document.addEventListener('mousemove', function(e) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = e.clientX + 'px';
        sparkle.style.top = e.clientY + 'px';
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
    });

    // --- MUSIC PLAYER ---
    const playlist = [
        { title: "Ariana Grande - pov", src: "playlist/pov.mp3" },
        { title: "Harry Styles - Adore You", src: "playlist/adoreyou.mp3" },
        { title: "H.E.R. - Best Part", src: "playlist/bestpart.mp3" },
        { title: "Stephen Sanchez - Until I Found You", src: "playlist/foundyou.mp3" },
        { title: "Taylor Swift - So High School", src: "playlist/highscholl.mp3" },
        { title: "Lauv - I Like Me Better", src: "playlist/ilikemebetter.mp3" },
        { title: "Taylor Swift - You Are In Love", src: "playlist/inlove.mp3" },
        { title: "Taylor Swift - Paper Rings", src: "playlist/paperrings.mp3" },
        { title: "Taylor Swift - Lover", src: "playlist/lover.mp3" }
    ];
    let currentSongIndex = 0;
    const audio = document.getElementById('audio');
    const titleText = document.getElementById('song-title');
    const playBtn = document.getElementById('play-btn');
    const vinyl = document.getElementById('vinyl');

    function loadSong(index) {
        if(!audio) return;
        const song = playlist[index];
        titleText.innerText = song.title;
        audio.src = song.src;
    }

    window.toggleMusic = () => {
        if (!audio.src) loadSong(0);
        if (audio.paused) {
            audio.play();
            playBtn.innerText = '⏸';
            if(vinyl) vinyl.style.animationPlayState = 'running';
        } else {
            audio.pause();
            playBtn.innerText = '▶';
            if(vinyl) vinyl.style.animationPlayState = 'paused';
        }
    };

    window.nextSong = () => {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        loadSong(currentSongIndex);
        audio.play();
        playBtn.innerText = '⏸';
        if(vinyl) vinyl.style.animationPlayState = 'running';
    };

    window.prevSong = () => {
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        loadSong(currentSongIndex);
        audio.play();
        playBtn.innerText = '⏸';
        if(vinyl) vinyl.style.animationPlayState = 'running';
    };

    if(audio) {
        audio.addEventListener('ended', nextSong);
        loadSong(currentSongIndex);
    }

    window.toggleWidget = () => {
        const widget = document.getElementById('music-widget');
        const btn = document.querySelector('.toggle-player-btn');
        widget.classList.toggle('hide-widget');
        btn.innerHTML = widget.classList.contains('hide-widget') ? '🎵' : '✖';
    };
    
});