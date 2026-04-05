// O dicionário de traduções e a configuração de idiomas agora são carregados do i18n.json
class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('site-lang') || 'pt';
        this.data = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('i18n.json');
            this.data = await response.json();

            this.buildSelector();
            this.updateCurrentFlag();
            this.updateDOM();

            document.documentElement.lang = this.currentLang === 'pt' ? 'pt-BR' : 'en';

            // Inicializar o restante do site agora que as traduções estão prontas
            if (typeof restartTypewriter === 'function') restartTypewriter();
            if (typeof loadProjects === 'function') loadProjects();
            if (typeof loadMusics === 'function') loadMusics();

            const langBtn = document.getElementById('lang-btn');
            const langSelector = document.querySelector('.lang-selector');

            if (langBtn) {
                langBtn.onclick = (e) => {
                    e.stopPropagation();
                    langSelector.classList.toggle('active');
                };
            }

            window.onclick = () => {
                if (langSelector) langSelector.classList.remove('active');
            };
        } catch (error) {
            console.error('Erro ao carregar i18n.json:', error);
        }
    }

    buildSelector() {
        const langMenu = document.getElementById('lang-menu');
        if (!langMenu || !this.data) return;

        langMenu.innerHTML = '';
        this.data.languages.forEach(lang => {
            const li = document.createElement('li');
            li.setAttribute('data-lang', lang.id);
            li.innerHTML = `
                <img src="${lang.flag}" alt="${lang.name}">
                ${lang.name}
            `;
            li.onclick = () => {
                this.setLanguage(lang.id);
                document.querySelector('.lang-selector')?.classList.remove('active');
            };
            langMenu.appendChild(li);
        });
    }

    setLanguage(lang) {
        if (lang === this.currentLang) return;
        this.currentLang = lang;
        localStorage.setItem('site-lang', lang);
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';

        this.updateCurrentFlag();
        this.updateDOM();

        if (typeof restartTypewriter === 'function') restartTypewriter();
        if (typeof loadProjects === 'function') loadProjects(currentCategory);
        if (typeof renderWithTransitionMusic === 'function') renderWithTransitionMusic(currentMusicCategory);
    }

    updateCurrentFlag() {
        if (!this.data) return;
        const currentFlag = document.getElementById('current-flag');
        const langConfig = this.data.languages.find(l => l.id === this.currentLang);
        if (currentFlag && langConfig) {
            currentFlag.src = langConfig.flag;
        }
    }

    t(key) {
        if (!this.data) return key;
        return this.data.translations[this.currentLang][key] || key;
    }

    updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.innerHTML = this.t(key);
        });

        document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
            const key = el.getAttribute('data-i18n-tooltip');
            el.innerText = this.t(key);
        });
    }
}

const i18n = new I18nManager();


let targetY = window.scrollY;
let currentY = window.scrollY;
const smoothness = 0.08;
let isScriptScrolling = false;
let wheelTimer;

document.addEventListener('wheel', function (event) {
    event.preventDefault();
    isScriptScrolling = true;

    targetY += event.deltaY * 1.5;
    const maxLimit = document.body.scrollHeight - window.innerHeight;
    targetY = Math.max(0, Math.min(targetY, maxLimit));

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
        if (Math.abs(targetY - currentY) < 1) isScriptScrolling = false;
    }, 500);
}, { passive: false });

window.addEventListener('scroll', () => {

    if (!isScriptScrolling) {
        targetY = window.scrollY;
        currentY = window.scrollY;
    }
});

function animateScroll() {
    if (Math.abs(targetY - currentY) > 0.1) {
        currentY += (targetY - currentY) * smoothness;
        window.scrollTo(0, currentY);

        updateHorizontalStory();
    } else if (isScriptScrolling) {
        isScriptScrolling = false;
    }

    requestAnimationFrame(animateScroll);
}

let hScrollCurrentX = 0;

function updateHorizontalStory() {
    const section = document.getElementById('horizontal-story');
    const track = document.querySelector('.h-story-track');
    if (!section || !track) return;

    // Disable horizontal scroll logic on mobile
    if (window.innerWidth <= 900) {
        track.style.transform = '';
        return;
    }

    const start = section.offsetTop;
    const scrollRange = section.offsetHeight - window.innerHeight;

    let progress = (currentY - start) / scrollRange;
    progress = Math.max(0, Math.min(progress, 1));

    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let targetSnapX = 0;

    if (progress < 0.1) {
        targetSnapX = 0;
    } else if (progress < 0.45) {
        let p = (progress - 0.1) / 0.35;
        targetSnapX = ease(p) * 100;
    } else if (progress < 0.65) {
        targetSnapX = 100;
    } else if (progress < 1.0) {
        let p = (progress - 0.65) / 0.35;
        targetSnapX = 100 + (ease(p) * 100);
    } else {
        targetSnapX = 200;
    }

    const hSmoothness = 0.1;
    hScrollCurrentX += (targetSnapX - hScrollCurrentX) * hSmoothness;

    if (Math.abs(targetSnapX - hScrollCurrentX) < 0.01) {
        hScrollCurrentX = targetSnapX;
    }

    track.style.transform = `translateX(-${hScrollCurrentX}vw)`;

    const progressBar = document.querySelector('.h-progress-bar');
    if (progressBar) {

        progressBar.style.width = `${progress * 100}%`;
    }
}

window.addEventListener('load', updateHorizontalStory);

animateScroll();

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
const trail = [];
const maxTrail = 20;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function drawTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    trail.push({ x: mouseX, y: mouseY });

    if (trail.length > maxTrail) {
        trail.shift();
    }

    if (trail.length > 1) {
        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i];
            const p2 = trail[i + 1];

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            const ratio = i / trail.length;
            ctx.strokeStyle = `rgba(255, 255, 255, ${ratio * 0.8})`;
            ctx.lineWidth = Math.max(0.5, ratio * 4);
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }

    requestAnimationFrame(drawTrail);
}

drawTrail();

const matrixCanvas = document.getElementById('matrix-canvas');
const mCtx = matrixCanvas.getContext('2d');

function initMatrix() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
}
window.addEventListener('resize', initMatrix);
initMatrix();

const chars = '01{}[]()<>+-*="/\\$#~!?&ABCDFXYZ'.split('');
const fontSize = 20;
let columns = Math.floor(matrixCanvas.width / fontSize);
let drops = [];

function resetDrops() {
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }
}
resetDrops();
window.addEventListener('resize', resetDrops);

const attractors = [];
function updateAttractors() {

    const selectors = [
        '.presentation-text',
        '.profile-photo',
        '.section-title',
        '.projeto-card',
        '.software-item',
        '.conquista-card',
        '.musica-card',
        '.h-panel-content',
        '.contact-row'
    ];
    attractors.length = 0;
    selectors.forEach(sel => {
        const elements = document.querySelectorAll(sel);
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();

            if (rect.bottom > 0 && rect.top < window.innerHeight) {
                attractors.push({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    radius: Math.max(rect.width, rect.height) / 0.8
                });
            }
        });
    });
}
window.addEventListener('resize', updateAttractors);
window.addEventListener('scroll', updateAttractors);

setTimeout(updateAttractors, 1000);

function drawMatrix() {
    mCtx.fillStyle = 'rgba(9, 6, 4, 0.15)';
    mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    const glowGradient = mCtx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 500);
    glowGradient.addColorStop(0, 'rgba(253, 184, 44, 0.015)');
    glowGradient.addColorStop(1, 'rgba(9, 6, 4, 0)');

    mCtx.fillStyle = glowGradient;
    mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    mCtx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const charX = i * fontSize;
        const charY = drops[i] * fontSize;

        const dx = mouseX - charX;
        const dy = mouseY - charY;
        const mouseDistance = Math.sqrt(dx * dx + dy * dy);

        let alpha = 0.05;

        if (mouseDistance < 200) {
            alpha = Math.max(alpha, Math.min(0.12, 0.02 + (200 - mouseDistance) / 1500));
        }

        attractors.forEach(attr => {
            const adx = attr.x - charX;
            const ady = attr.y - charY;
            const attrDistance = Math.sqrt(adx * adx + ady * ady);
            if (attrDistance < attr.radius) {

                const intensity = Math.min(0.08, 0.02 + (attr.radius - attrDistance) / 2000);
                alpha = Math.max(alpha, intensity);
            }
        });

        const text = chars[Math.floor(Math.random() * chars.length)];
        mCtx.fillStyle = `rgba(253, 184, 44, ${alpha})`;
        mCtx.fillText(text, charX, charY);

        if (charY > matrixCanvas.height && Math.random() > 0.98) {
            drops[i] = 0;
        }
        drops[i] += 0.35;
    }

    requestAnimationFrame(drawMatrix);
}

drawMatrix();

const indicator = document.getElementById('scroll-indicator');
setTimeout(() => {
    if (indicator) indicator.classList.add('visivel');
}, 1500);

window.addEventListener('scroll', () => {
    if (indicator) indicator.classList.toggle('escondido', window.scrollY > 50);
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revelada');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

function handleActiveNav() {
    const navLinks = document.querySelectorAll('.header-right a');
    const sections = ['#top', '#about', '#tools', '#achievements', '#projects', '#musics', '#horizontal-story', '#contact'];

    let currentSection = "";

    sections.forEach(selector => {
        const section = document.querySelector(selector);
        if (!section) return;

        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const scrollPosition = window.scrollY + 150;

        if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
            currentSection = selector;
        }
    });

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        currentSection = '#contact';
    }

    if (currentSection) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === currentSection);
        });
    }
}

const revealElements = ['about', 'tools', 'achievements', 'projects', 'musics', 'contact'];
revealElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) revealObserver.observe(el);
});

window.addEventListener('scroll', handleActiveNav);
handleActiveNav();

const typewriterElement = document.getElementById('typewriter');
let k = 0;
let typewriterInterval;

function restartTypewriter() {
    if (!typewriterElement) return;
    clearInterval(typewriterInterval);
    typewriterElement.textContent = "";
    k = 0;
    const fullText = i18n.t('typewriter');

    function type() {
        if (k < fullText.length) {
            const char = fullText.charAt(k);
            const span = document.createElement('span');
            span.classList.add('letra');
            span.textContent = char;

            const isHi = (i18n.currentLang === 'pt' && k >= 12 && k <= 15) ||
                (i18n.currentLang === 'en' && k >= 8 && k <= 11);

            if (isHi) {
                span.classList.add('highlight');
            }

            typewriterElement.appendChild(span);
            k++;
            setTimeout(type, 23);
        }
    }
    setTimeout(type, 50);
}

// Removido o início automático global para evitar race condition com o fetch do i18n
// if (typewriterElement) {
//     restartTypewriter();
// }

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

setTimeout(() => {
    const header = document.querySelector('.main-header');
    if (header) header.classList.remove('pre-load');
}, 100);

const tabButtons = document.querySelectorAll('.tools-selector .tab-btn:not(.music-tab)');
const tabWrapper = document.querySelector('.tools-wrapper');
const contentContainer = document.querySelector('.tools-content');

function updateHeight() {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && contentContainer) {
        contentContainer.style.height = activeTab.offsetHeight + 'px';
    }
}

let currentTabIndex = 0;
const prevBtn = document.getElementById('prevTab');
const nextBtn = document.getElementById('nextTab');

function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.classList.toggle('hidden', currentTabIndex === 0);
    nextBtn.classList.toggle('hidden', currentTabIndex === tabButtons.length - 1);
}

function switchTab(index) {
    if (index < 0 || index >= tabButtons.length) return;
    currentTabIndex = index;

    tabButtons.forEach(b => b.classList.remove('active'));
    tabButtons[currentTabIndex].classList.add('active');

    if (tabWrapper) {
        tabWrapper.style.transform = `translateX(-${currentTabIndex * 100}%)`;
    }

    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.classList.remove('active'));
    if (contents[currentTabIndex]) {
        contents[currentTabIndex].classList.add('active');
    }

    updateArrows();

    setTimeout(updateHeight, 400);
}

tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        switchTab(index);
    });
});

if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(currentTabIndex - 1);
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(currentTabIndex + 1);
    });
}

updateArrows();
window.addEventListener('load', updateHeight);
window.addEventListener('resize', updateHeight);
setTimeout(updateHeight, 1000);

let projectsData = null;
let currentCategory = 'web';
let isProjectsTransitioning = false;
const categoryOrder = ['web', 'roblox', 'scratch', 'tutorials'];

async function loadProjects(activeCategory = 'web') {
    try {
        if (projectsData) {
            renderWithTransition(activeCategory);
            return;
        }

        const response = await fetch('projects.json');
        projectsData = await response.json();
        renderWithTransition(activeCategory);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function renderWithTransition(newCategory) {
    const display = document.querySelector('.projects-display');
    const oldGrid = document.getElementById('project-grid');
    const sidebar = document.querySelector('.projects-sidebar');
    const titleElement = document.getElementById('project-category-title');

    if (!display || isProjectsTransitioning) return;

    const currentIndex = categoryOrder.indexOf(currentCategory);
    const newIndex = categoryOrder.indexOf(newCategory);

    // Removido o retorno antecipado para permitir re-renderização ao mudar de idioma
    // if (currentIndex === newIndex && oldGrid && oldGrid.innerHTML !== '') return;

    isProjectsTransitioning = true;
    if (sidebar) sidebar.classList.add('is-loading');

    if (titleElement) {
        titleElement.textContent = i18n.t(`proj_tab_${newCategory}`) || newCategory;

        titleElement.style.opacity = '0';
        setTimeout(() => titleElement.style.opacity = '1', 50);
    }

    const isMovingUp = newIndex > currentIndex;

    const newGrid = document.createElement('div');
    newGrid.className = 'project-grid';

    renderProjects(newCategory, newGrid);

    if (oldGrid) {
        display.style.position = 'relative';

        oldGrid.style.position = 'absolute';
        oldGrid.style.top = '0';
        oldGrid.style.left = '0';
        oldGrid.style.width = '100%';
        oldGrid.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        oldGrid.id = 'project-grid-old';

        newGrid.style.transform = isMovingUp ? 'translateY(100px)' : 'translateY(-100px)';
        newGrid.style.opacity = '0';
        newGrid.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        display.appendChild(newGrid);
        newGrid.offsetHeight;

        oldGrid.style.transform = isMovingUp ? 'translateY(-100px)' : 'translateY(100px)';
        oldGrid.style.opacity = '0';

        newGrid.style.transform = 'translateY(0)';
        newGrid.style.opacity = '1';

        setTimeout(() => {
            if (oldGrid.parentNode) oldGrid.parentNode.removeChild(oldGrid);
            newGrid.id = 'project-grid';
            newGrid.style.transition = '';
            newGrid.style.transform = '';
            newGrid.style.opacity = '';
            display.style.position = '';

            if (sidebar) sidebar.classList.remove('is-loading');
            isProjectsTransitioning = false;
        }, 300);

    } else {
        newGrid.id = 'project-grid';
        display.appendChild(newGrid);
        if (sidebar) sidebar.classList.remove('is-loading');
        isProjectsTransitioning = false;
    }

    currentCategory = newCategory;
}

function renderProjects(category, targetGrid = null, showAll = false) {
    const grid = targetGrid || document.getElementById('project-grid');
    if (!grid || !projectsData || !projectsData[category]) return;

    grid.innerHTML = '';
    const categoryData = projectsData[category];
    const isRoblox = category === 'roblox';
    const isScratch = category === 'scratch';
    const keys = Object.keys(categoryData);

    const total = keys.length;
    const limit = (!showAll && total > 4) ? 4 : total;

    if (total === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'placeholder-text';
        emptyMsg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 50px;';
        emptyMsg.textContent = i18n.t('proj_soon').replace('{cat}', i18n.t(`proj_tab_${category}`));
        grid.appendChild(emptyMsg);
    } else {
        keys.slice(0, limit).forEach(key => {
            const proj = categoryData[key];
            const item = document.createElement('div');
            const isTutorial = category === 'tutorials';

            if (isTutorial) {
                item.className = 'project-item video-item';
                item.innerHTML = `
                    <div class="video-wrapper">
                        <iframe src="https://www.youtube.com/embed/${proj.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                    <div class="video-subtitle">
                        <h3>${proj.name}</h3>
                    </div>
                `;
            } else {
                item.className = 'project-item';
                item.innerHTML = `
                    <img src="${proj.image}" alt="${proj.name}" class="project-img" onerror="this.src='https://via.placeholder.com/600x400/1a1512/fdb82c?text=${proj.name}'">
                    <div class="project-overlay">
                        <div class="project-info">
                            <h3>${proj.name}</h3>
                            <div class="project-links">
                                ${proj.source ? `
                                    <a href="${proj.source}" target="_blank" class="project-link">
                                        <img src="images/icons/redirect.svg" alt="" style="transform: rotate(180deg)"> Source
                                    </a>` : ''}
                                ${proj.live ? `
                                    <a href="${proj.live}" target="_blank" class="project-link ${isRoblox ? 'btn-roblox' : ''}">
                                        <img src="images/icons/redirect.svg" alt=""> ${(isRoblox || isScratch) ? i18n.t('btn_play') : 'Live'}
                                    </a>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.project-link')) return;
                    openModal(proj, category);
                });
            }

            grid.appendChild(item);
        });

        if (!showAll && total > 4) {
            const btnExpand = document.createElement('div');
            btnExpand.className = 'expand-container';
            btnExpand.style.cssText = 'grid-column: 1 / -1; display: flex; justify-content: center; padding: 5px 0 15px 0;';
            btnExpand.innerHTML = `
                <button class="project-btn-expand">
                    ${i18n.t('proj_ver_mais').replace('{n}', total - 4)}
                    <span class="expand-icon">+</span>
                </button>
            `;
            btnExpand.querySelector('button').onclick = (e) => {
                e.stopPropagation();
                renderProjects(category, grid, true);
            };
            grid.appendChild(btnExpand);
        }
    }

    if (isScratch) {
        const scratchFooter = document.createElement('div');
        scratchFooter.className = 'scratch-category-footer';
        scratchFooter.innerHTML = `<img src="images/bicamp.svg" alt="Bicamp" class="scratch-footer-img">`;
        grid.appendChild(scratchFooter);
    }
}

function openModal(proj, category = 'web') {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const isRoblox = category === 'roblox';
    const isScratch = category === 'scratch';

    modal.style.setProperty('--modal-primary', proj.color || '#fdb82c');
    modal.style.setProperty('--modal-font', proj.font || "'Dancing Script', cursive");

    const mImg = document.getElementById('modal-img');
    mImg.src = proj.image;

    const infoContainer = document.querySelector('.modal-info');
    infoContainer.innerHTML = `
        <div class="modal-text-content">
            <h2 id="modal-title">${proj.name}</h2>
            <p id="modal-desc">${proj.description[i18n.currentLang] || i18n.t('proj_no_desc')}</p>
        </div>
        <div id="modal-links" class="project-links">
            ${proj.source ? `
                <a href="${proj.source}" target="_blank" class="project-link">
                    <img src="images/icons/redirect.svg" alt="" style="transform: rotate(180deg)"> Source
                </a>` : ''}
            ${proj.live ? `
                <a href="${proj.live}" target="_blank" class="project-link ${isRoblox ? 'btn-roblox' : ''}">
                    <img src="images/icons/redirect.svg" alt=""> ${(isRoblox || isScratch) ? i18n.t('btn_play') : 'Live'}
                </a>` : ''}
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.querySelector('.close-modal')?.addEventListener('click', closeModal);

document.getElementById('project-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'project-modal') closeModal();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

function updateProjectIndicator(tab) {
    const indicador = document.querySelector('.project-active-bg');
    if (!indicador || !tab) return;

    indicador.style.width = `${tab.offsetWidth}px`;
    indicador.style.height = `${tab.offsetHeight}px`;
    indicador.style.left = `${tab.offsetLeft}px`;
    indicador.style.top = `${tab.offsetTop}px`;
}

const btnProjects = document.querySelectorAll('.project-tab');
btnProjects.forEach(btn => {
    btn.addEventListener('click', () => {
        btnProjects.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        updateProjectIndicator(btn);

        const category = btn.getAttribute('data-proj');
        loadProjects(category);
    });
});

setTimeout(() => {
    const activeTab = document.querySelector('.project-tab.active');
    if (activeTab) updateProjectIndicator(activeTab);
}, 100);

window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.project-tab.active');
    if (activeTab) updateProjectIndicator(activeTab);
});

// loadProjects(); // Chamado agora pelo i18n.init() quando as traduções estiverem prontas

const header = document.querySelector('.main-header');
window.addEventListener('scroll', () => {
    if (header) {
        header.classList.toggle('scrolled', window.scrollY > 80);
    }
});

let musicsData = null;
let currentMusicCategory = 'artists';
let isMusicsTransitioning = false;

async function loadMusics(activeCategory = 'artists') {
    try {
        if (!musicsData) {
            const response = await fetch('musics.json');
            musicsData = await response.json();
        }
        renderWithTransitionMusic(activeCategory);
    } catch (error) {
        console.error('Error loading musics:', error);
    }
}

function renderWithTransitionMusic(newCategory) {
    const display = document.querySelector('.musics-display');
    const oldGrid = document.getElementById('music-grid');
    const nav = document.querySelector('.musics-nav');

    if (!display || isMusicsTransitioning) return;

    const categories = ['artists', 'songs'];
    const currentIndex = categories.indexOf(currentMusicCategory);
    const newIndex = categories.indexOf(newCategory);

    // Removido o retorno antecipado para permitir re-renderização ao mudar de idioma
    // if (currentIndex === newIndex && oldGrid && oldGrid.innerHTML !== '') return;

    isMusicsTransitioning = true;
    if (nav) nav.style.pointerEvents = 'none';

    const isMovingForward = newIndex > currentIndex;

    const newGrid = document.createElement('div');
    newGrid.className = 'music-grid' + (newCategory === 'songs' ? ' musica-list-view' : '');
    newGrid.id = 'music-grid';

    renderMusicItems(newCategory, newGrid);

    if (oldGrid) {
        display.style.position = 'relative';

        oldGrid.style.position = 'absolute';
        oldGrid.style.top = '0';
        oldGrid.style.left = '0';
        oldGrid.style.width = '100%';
        oldGrid.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        oldGrid.id = 'music-grid-old';

        newGrid.style.transform = isMovingForward ? 'translateX(100%)' : 'translateX(-100%)';
        newGrid.style.opacity = '0';
        newGrid.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        display.appendChild(newGrid);

        newGrid.offsetHeight;

        oldGrid.style.transform = isMovingForward ? 'translateX(-100%)' : 'translateX(100%)';
        oldGrid.style.opacity = '0';

        newGrid.style.transform = 'translateX(0)';
        newGrid.style.opacity = '1';

        setTimeout(() => {
            if (oldGrid.parentNode) oldGrid.parentNode.removeChild(oldGrid);
            newGrid.style.transition = '';
            newGrid.style.transform = '';
            newGrid.style.opacity = '';
            display.style.position = '';

            if (nav) nav.style.pointerEvents = 'auto';
            isMusicsTransitioning = false;
        }, 400);
    } else {
        display.appendChild(newGrid);
        if (nav) nav.style.pointerEvents = 'auto';
        isMusicsTransitioning = false;
    }

    currentMusicCategory = newCategory;
    updateMusicSelector();
}

function renderMusicItems(category, container) {
    const items = musicsData[category] || [];

    if (category === 'artists') {
        items.forEach((artist, index) => {
            const card = document.createElement('a');
            card.className = 'artist-card';
            card.href = artist.link;
            card.target = '_blank';
            card.innerHTML = `
                <span class="artist-rank">#${index + 1}</span>
                <div class="artist-img-wrapper">
                    <img src="${artist.image}" alt="${artist.name}" class="artist-img">
                </div>
                <div class="artist-info">
                    <h3 class="artist-name">${artist.name}</h3>
                    <span class="spotify-hint">${artist.genres[i18n.currentLang] || artist.genres['pt']}</span>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" alt="Spotify" class="artist-spotify-icon">
                <div class="spotify-tooltip">${i18n.t('spotify_tooltip')}</div>
            `;

            let hoverTimeout;
            card.addEventListener('mouseenter', () => {
                const vinylPhoto = document.querySelector('.artist-photo');
                if (!vinylPhoto) return;

                clearTimeout(hoverTimeout);

                hoverTimeout = setTimeout(() => {
                    vinylPhoto.style.opacity = '0';
                    setTimeout(() => {
                        vinylPhoto.src = artist.image;
                        vinylPhoto.style.opacity = '1';
                    }, 120);
                }, 150);
            });

            card.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
            });

            container.appendChild(card);
        });
    } else if (category === 'songs') {
        items.forEach((music, index) => {
            const card = document.createElement('a');
            card.className = 'artist-card musica-card';
            card.href = music.link;
            card.target = '_blank';
            card.innerHTML = `
                <span class="artist-rank">#${index + 1}</span>
                <div class="artist-img-wrapper musica-img-wrapper">
                    <img src="${music.image}" alt="${music.title}" class="artist-img">
                </div>
                <div class="artist-info">
                    <h3 class="artist-name">${music.title}</h3>
                    <span class="spotify-hint">${music.artist}</span>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" alt="Spotify" class="artist-spotify-icon">
                <div class="spotify-tooltip">${i18n.t('spotify_tooltip')}</div>
            `;

            let hoverTimeout;
            card.addEventListener('mouseenter', () => {
                const vinylPhoto = document.querySelector('.artist-photo');
                if (!vinylPhoto) return;
                clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(() => {
                    vinylPhoto.style.opacity = '0';
                    setTimeout(() => {
                        vinylPhoto.src = music.image;
                        vinylPhoto.style.opacity = '1';
                    }, 120);
                }, 150);
            });

            card.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
            });

            container.appendChild(card);
        });
    }
}

function updateMusicSelector() {
    const tabs = document.querySelectorAll('.music-tab.tab-btn');

    tabs.forEach(tab => {
        if (tab.dataset.musica === currentMusicCategory) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

document.querySelectorAll('.music-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (!isMusicsTransitioning) loadMusics(tab.dataset.musica);
    });
});

setTimeout(() => {
    // loadMusics('artists'); // Chamado agora pelo i18n.init()
    updateMusicSelector();
}, 100);

window.addEventListener('resize', updateMusicSelector);

document.querySelectorAll('.header-right a, .btn-hero').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            isScriptScrolling = true;
            if (targetId === '#top') {
                targetY = 0;
            } else {

                const headerOffset = 75;
                targetY = targetElement.offsetTop - headerOffset;
            }
        }
    });
});

(function () {
    const vinyl = document.querySelector('.spinning-part');
    const wrapper = document.querySelector('.vinyl-wrapper');
    if (!vinyl || !wrapper) return;

    let isDragging = false;
    let rotation = 0;
    let velocity = 0.5;
    let lastAngle = 0;
    let friction = 0.985;
    let baseSpeed = 0.5;
    let lastTime = Date.now();

    function getAngle(x, y) {
        const rect = wrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    }

    function startDrag(e) {
        isDragging = true;
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        lastAngle = getAngle(x, y);
        velocity = 0;
        lastTime = Date.now();
    }

    function moveDrag(e) {
        if (!isDragging) return;
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        if (x === undefined || y === undefined) return;

        const currentAngle = getAngle(x, y);
        let delta = currentAngle - lastAngle;

        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        rotation += delta;

        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 10) {
            velocity = delta * 0.8;
        }

        lastAngle = currentAngle;
        lastTime = now;

        vinyl.style.transform = `rotate(${rotation}deg)`;
    }

    function stopDrag() {
        isDragging = false;
    }

    wrapper.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', stopDrag);

    wrapper.addEventListener('touchstart', startDrag, { passive: false });
    wrapper.addEventListener('touchmove', (e) => {
        if (isDragging) e.preventDefault();
        moveDrag(e);
    }, { passive: false });
    wrapper.addEventListener('touchend', stopDrag);

    function animate() {
        if (!isDragging) {

            rotation += velocity;

            if (Math.abs(velocity) > baseSpeed) {
                velocity *= friction;
            } else {
                velocity = baseSpeed;
            }

            vinyl.style.transform = `rotate(${rotation}deg)`;
        }
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
})();

(function () {
    const container = document.getElementById('music-particles');
    if (!container) return;

    const symbols = ['♩', '♪', '♫', '♬', '♭', '♮', '♯', '●', '○', '•', '°'];

    function spawnParticle() {
        const p = document.createElement('div');
        p.className = 'musical-p';

        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const size = Math.floor(Math.random() * (35 - 12 + 1)) + 12;
        const left = Math.random() * 100;
        const duration = Math.floor(Math.random() * (16 - 8 + 1)) + 8;
        const delay = Math.random() * 5;
        const blur = Math.random() * 2;

        p.innerText = symbol;
        p.style.fontSize = `${size}px`;
        p.style.left = `${left}%`;
        p.style.animationDuration = `${duration}s`;
        p.style.animationDelay = `${delay}s`;
        p.style.filter = `blur(${blur}px)`;

        container.appendChild(p);

        setTimeout(() => {
            if (p.parentNode === container) {
                container.removeChild(p);
            }
        }, (duration + delay) * 1000);
    }

    setInterval(spawnParticle, 2500);

    for (let i = 0; i < 5; i++) {
        spawnParticle();
    }
})();

(function () {
    const discordBtn = document.querySelector('.discord-copy');
    if (!discordBtn) return;

    const tooltip = discordBtn.querySelector('.contact-tooltip');
    const originalText = tooltip.innerText;

    discordBtn.addEventListener('click', () => {
        const textToCopy = discordBtn.getAttribute('data-copy');
        const tooltip = discordBtn.querySelector('.contact-tooltip');
        const originalText = tooltip.innerText;

        navigator.clipboard.writeText(textToCopy).then(() => {
            tooltip.innerText = i18n.t('contact_copied');
            tooltip.classList.add('copiado');

            setTimeout(() => {
                tooltip.innerText = originalText;
                tooltip.classList.remove('copiado');
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
        });
    });
})();

// Mobile Menu Logic
(function () {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (!hamburgerBtn || !mobileMenu) return;

    function toggleMenu() {
        hamburgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }

    hamburgerBtn.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (mobileMenu.classList.contains('active')) {
                toggleMenu();
            }

            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                isScriptScrolling = true;
                if (targetId === '#top') {
                    targetY = 0;
                } else {
                    const headerOffset = 75;
                    targetY = targetElement.offsetTop - headerOffset;
                }
            }
        });
    });
})();