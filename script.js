class I18nManager {
    constructor() {
        const savedLang = localStorage.getItem('site-lang');
        if (savedLang) {
            this.currentLang = savedLang;
        } else {
            const browserLang = navigator.language || navigator.userLanguage;
            this.currentLang = browserLang.startsWith('pt') ? 'pt' : 'en';
        }
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
            if (typeof restartTypewriter === 'function') restartTypewriter();
            if (typeof loadProjects === 'function') loadProjects();
            if (typeof loadMusics === 'function') loadMusics();
            const langBtn = document.getElementById('lang-btn');
            const langSelector = document.querySelector('.lang-selector');
            
            const taskbarLangBtn = document.getElementById('taskbar-lang-btn');
            if (taskbarLangBtn) {
                taskbarLangBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (!this.data) return;
                    
                    const langs = this.data.languages;
                    const currentIndex = langs.findIndex(l => l.id === this.currentLang);
                    const nextIndex = (currentIndex + 1) % langs.length;
                    this.setLanguage(langs[nextIndex].id);
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
        const taskbarFlag = document.getElementById('taskbar-flag');
        const langConfig = this.data.languages.find(l => l.id === this.currentLang);
        
        if (langConfig) {
            if (currentFlag) currentFlag.src = langConfig.flag;
            if (taskbarFlag) taskbarFlag.src = langConfig.flag;
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
        if (window.themeManager) themeManager.updateTooltip();
    }
}
class ThemeManager {
    constructor() {
        const savedTheme = localStorage.getItem('site-theme');
        if (savedTheme) {
            this.theme = savedTheme;
        } else {
            const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
            this.theme = prefersLight ? 'light' : 'dark';
        }
        this.isRetro = localStorage.getItem('site-retro') === 'true';
        this.toggleBtn = document.getElementById('theme-switch');
        this.init();
    }
    init() {
        if (!this.toggleBtn) return;
        this.applyTheme();
        this.applyRetroTheme();
        
        const handleToggle = (e) => {
            e.stopPropagation();
            this.toggle();
        };
        
        const handleRetro = (e) => {
            e.preventDefault();
            this.toggleRetro();
        };

        this.toggleBtn.onclick = handleToggle;
        this.toggleBtn.oncontextmenu = handleRetro;

        
        const taskbarToggle = document.getElementById('taskbar-theme-switch');
        if (taskbarToggle) {
            taskbarToggle.onclick = handleToggle;
            taskbarToggle.oncontextmenu = handleRetro;
        }

        this.initWin7Clock();
    }
    
    initWin7Clock() {
        const updateClock = () => {
            const timeEl = document.getElementById('win7-clock-time');
            const dateEl = document.getElementById('win7-clock-date');
            if (!timeEl || !dateEl) return;
            
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            dateEl.textContent = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    applyTheme() {
        if (this.theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        this.updateCurrentFlag(); 
        this.updateTooltip();
    }
    
    updateCurrentFlag() {
        if (window.i18n) {
            i18n.updateCurrentFlag();
            
            const taskbarFlag = document.getElementById('taskbar-flag');
            const mainFlag = document.getElementById('current-flag');
            if (taskbarFlag && mainFlag) taskbarFlag.src = mainFlag.src;
        }
    }
    toggle() {
        if (this.isRetro) {
            this.toggleRetro();
            return;
        }
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('site-theme', this.theme);
        this.applyTheme();
    }
    toggleRetro() {
        this.isRetro = !this.isRetro;
        localStorage.setItem('site-retro', this.isRetro);
        this.applyRetroTheme();
    }
    applyRetroTheme() {
        if (this.isRetro) {
            document.body.classList.add('theme-1990');
        } else {
            document.body.classList.remove('theme-1990');
        }
    }
    updateTooltip() {
        const tooltip = document.getElementById('theme-tooltip');
        if (tooltip && i18n) {
            const key = this.theme === 'dark' ? 'theme_toggle_light' : 'theme_toggle_dark';
            tooltip.setAttribute('data-i18n', key);
            tooltip.innerText = i18n.t(key);
        }
    }
}
const i18n = new I18nManager();
const themeManager = new ThemeManager();
window.themeManager = themeManager;
let targetY = window.scrollY;
let currentY = window.scrollY;
const smoothness = 0.08;
let isScriptScrolling = false;
let wheelTimer;
document.addEventListener('wheel', function (event) {
    if (themeManager.isRetro) return;
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
    if (themeManager.isRetro || !isScriptScrolling) {
        targetY = window.scrollY;
        currentY = window.scrollY;
    }
});
function animateScroll() {
    if (themeManager.isRetro) {
        
        currentY = window.scrollY;
        targetY = window.scrollY;
        updateHorizontalStory();
        updateProgressBar();
        requestAnimationFrame(animateScroll);
        return;
    }

    if (Math.abs(targetY - currentY) > 0.1) {
        currentY += (targetY - currentY) * smoothness;
        window.scrollTo(0, currentY);
        updateHorizontalStory();
    } else if (isScriptScrolling) {
        isScriptScrolling = false;
    }
    updateProgressBar();
    requestAnimationFrame(animateScroll);
}

function updateProgressBar() {
    const scrollProgressBar = document.getElementById('scroll-progress');
    if (scrollProgressBar) {
        const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollRange > 0 ? (window.scrollY / scrollRange) * 100 : 0;
        scrollProgressBar.style.width = `${progress}%`;
    }
}
let hScrollCurrentX = 0;
function updateHorizontalStory() {
    const section = document.getElementById('horizontal-story');
    const track = document.querySelector('.h-story-track');
    if (!section || !track) return;
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
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
const trail = [];
const maxTrail = 20;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
const matrixCanvas = document.getElementById('matrix-canvas');
const mCtx = matrixCanvas.getContext('2d');
const trailCanvas = document.getElementById('trail-canvas');
const tCtx = trailCanvas.getContext('2d');
function initMatrix() {
    const dpr = window.devicePixelRatio || 1;
    [matrixCanvas, trailCanvas].forEach(canvas => {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
    });
}
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}
initMatrix();
window.addEventListener('resize', throttle(initMatrix, 200));
function drawMatrix() {
    mCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const glowGradient = mCtx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 500);
    const accentColor = themeManager.theme === 'dark' ? 'rgba(253, 184, 44, 0.05)' : 'rgba(253, 184, 44, 0.15)';
    const bgColor = themeManager.theme === 'dark' ? 'rgba(9, 6, 4, 0)' : 'rgba(255, 255, 255, 0)';
    glowGradient.addColorStop(0, accentColor);
    glowGradient.addColorStop(1, bgColor);
    mCtx.fillStyle = glowGradient;
    mCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    tCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    trail.push({ x: mouseX, y: mouseY });
    if (trail.length > maxTrail) {
        trail.shift();
    }
    if (trail.length > 1) {
        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i];
            const p2 = trail[i + 1];
            tCtx.beginPath();
            tCtx.moveTo(p1.x, p1.y);
            tCtx.lineTo(p2.x, p2.y);
            const ratio = i / trail.length;
            const trailOpacity = themeManager.theme === 'dark' ? 0.4 : 0.6;
            tCtx.strokeStyle = `rgba(253, 184, 44, ${ratio * trailOpacity})`;
            tCtx.lineWidth = Math.max(0.5, ratio * 3);
            tCtx.lineCap = 'round';
            tCtx.stroke();
        }
    }
    requestAnimationFrame(drawMatrix);
}
drawMatrix();
const indicator = document.getElementById('scroll-indicator');
setTimeout(() => {
    if (indicator) indicator.classList.add('visible');
}, 1500);
window.addEventListener('scroll', () => {
    if (indicator) indicator.classList.toggle('hidden', window.scrollY > 50);
});
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
            span.classList.add('letter');
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
    const indicator = document.querySelector('.project-active-bg');
    if (!indicator || !tab) return;
    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.height = `${tab.offsetHeight}px`;
    indicator.style.left = `${tab.offsetLeft}px`;
    indicator.style.top = `${tab.offsetTop}px`;
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
    isMusicsTransitioning = true;
    if (nav) nav.style.pointerEvents = 'none';
    const isMovingForward = newIndex > currentIndex;
    const newGrid = document.createElement('div');
    newGrid.className = 'music-grid' + (newCategory === 'songs' ? ' music-list-view' : '');
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
            card.className = 'artist-card music-card';
            card.href = music.link;
            card.target = '_blank';
            card.innerHTML = `
                <span class="artist-rank">#${index + 1}</span>
                <div class="artist-img-wrapper music-img-wrapper">
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
        if (tab.dataset.music === currentMusicCategory) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}
document.querySelectorAll('.music-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (!isMusicsTransitioning) loadMusics(tab.dataset.music);
    });
});
setTimeout(() => {
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
        p.className = 'musical-particle';
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
            tooltip.classList.add('copied');
            setTimeout(() => {
                tooltip.innerText = originalText;
                tooltip.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
        });
    });
})();
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

const playerContainer = document.getElementById('spotify-floating-player');
const playerToggle = document.getElementById('player-toggle');

if (playerToggle && playerContainer) {
    const spotifyLogo = `<img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" style="width: 32px; height: 32px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));">`;
    const minusIcon = `<svg viewBox="0 0 24 24" fill="none" class="toggle-icon" style="width: 14px; height: 14px;"><path d="M6 12L18 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

    playerToggle.onclick = (e) => {
        e.stopPropagation();
        const isNowMinimized = playerContainer.classList.toggle('minimized');
        playerToggle.innerHTML = isNowMinimized ? spotifyLogo : minusIcon;
        playerToggle.setAttribute('aria-label', isNowMinimized ? 'Maximize Player' : 'Minimize Player');
    };

    setInterval(() => {
        const img = playerContainer.querySelector('.player-content img');
        if (img) {
            const currentSrc = img.src;
            const baseUrl = currentSrc.includes('&t=') ? currentSrc.split('&t=')[0] : currentSrc;
            img.src = `${baseUrl}&t=${new Date().getTime()}`;
        }
    }, 5000);
}