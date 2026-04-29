// script.js (النسخة المعدلة مع جلب 5 صور وجلب التحديثات من app_updates)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAEHTBBLpnzNKSPFWQrNinb8pWrA2DEtos",
    authDomain: "thabit-tv-81b69.firebaseapp.com",
    databaseURL: "https://thabit-tv-81b69-default-rtdb.firebaseio.com",
    projectId: "thabit-tv-81b69",
    storageBucket: "thabit-tv-81b69.firebasestorage.app",
    messagingSenderId: "604115208639",
    appId: "1:604115208639:web:608d512cc4ab41d017790a",
    measurementId: "G-LQCR558K90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// رابط احتياطي في حالة عدم وجود بيانات في Firebase
const FALLBACK_DOWNLOAD_URL = "https://github.com/thabitalgodai/appapk/releases/download/v4.0/THABIT_TV_v2.2.apk";

let currentScreenshots = [];
let currentIndex = 0;
let currentDownloadUrl = FALLBACK_DOWNLOAD_URL; // متغير لتخزين رابط التحميل الحالي

// دالة لجلب آخر تحديث من حزمة app_updates
async function getLatestUpdate() {
    try {
        const updatesRef = ref(db, 'app_updates');
        const snapshot = await get(updatesRef);
        
        if (snapshot.exists()) {
            const updates = snapshot.val();
            
            // استبعاد مفتاح data_app إذا كان موجوداً
            const updatesArray = Object.entries(updates)
                .filter(([key]) => key !== 'data_app')
                .map(([key, value]) => ({
                    id: key,
                    ...value
                }));
            
            if (updatesArray.length === 0) {
                console.warn("لا توجد تحديثات في app_updates");
                return null;
            }
            
            // ترتيب التحديثات حسب التاريخ (من الأحدث إلى الأقدم)
            updatesArray.sort((a, b) => {
                const dateA = new Date(a.date.replace(/\//g, '-'));
                const dateB = new Date(b.date.replace(/\//g, '-'));
                return dateB - dateA; // ترتيب تنازلي (الأحدث أولاً)
            });
            
            // إرجاع أحدث تحديث
            return updatesArray[0];
        } else {
            console.warn("لا توجد تحديثات في app_updates");
            return null;
        }
    } catch (error) {
        console.error("خطأ في جلب التحديثات:", error);
        return null;
    }
}

// دالة لجلب وتحديث رابط التحميل
async function updateDownloadUrl() {
    const latestUpdate = await getLatestUpdate();
    if (latestUpdate && latestUpdate.url) {
        currentDownloadUrl = latestUpdate.url;
        console.log(`تم تحديث رابط التحميل إلى الإصدار ${latestUpdate.version}`);
        
        // تحديث معلومات الإصدار في واجهة المستخدم
        const versionElement = document.getElementById('appVersion');
        const updateDateElement = document.getElementById('updateDate');
        const appSizeElement = document.getElementById('appSize');
        
        if (versionElement) versionElement.textContent = latestUpdate.version;
        if (updateDateElement) updateDateElement.textContent = latestUpdate.date;
        if (appSizeElement) appSizeElement.textContent = latestUpdate.size;
        
        return latestUpdate;
    } else {
        currentDownloadUrl = FALLBACK_DOWNLOAD_URL;
        console.warn("استخدام رابط التحميل الاحتياطي");
        return null;
    }
}

// Helper function to extract features
function extractFeatures(description) {
    const features = [];
    if (description && description.includes('قنوات رياضية')) {
        features.push({ icon: 'fas fa-futbol', title: 'قنوات رياضية', desc: 'مباشرة بأفضل جودة' });
    }
    if (description && description.includes('أفلام ومسلسلات')) {
        features.push({ icon: 'fas fa-film', title: 'أفلام ومسلسلات', desc: 'متنوعة ومحدثة باستمرار' });
    }
    if (description && description.includes('قنوات أطفال')) {
        features.push({ icon: 'fas fa-child', title: 'قنوات أطفال', desc: 'ترفيه وتعليم' });
    }
    if (description && description.includes('مشغل قوي')) {
        features.push({ icon: 'fas fa-play-circle', title: 'مشغل احترافي', desc: 'جميع الجودات بدون تقطيع' });
    }
    if (description && description.includes('الدردشة')) {
        features.push({ icon: 'fas fa-comments', title: 'تفاعل مباشر', desc: 'دردشة أثناء البث' });
    }
    if (description && description.includes('كونز')) {
        features.push({ icon: 'fas fa-coins', title: 'نظام المكافآت', desc: '10 كونز يومياً' });
    }
    
    if (features.length === 0) {
        features.push(
            { icon: 'fas fa-tv', title: 'مشاهدة ممتعة', desc: 'جودة عالية وتجربة سلسة' },
            { icon: 'fas fa-gift', title: 'مكافآت يومية', desc: 'احصل على كونز يومياً' },
            { icon: 'fas fa-headset', title: 'دعم فني', desc: 'خدمة عملاء 24/7' }
        );
    }
    return features;
}

// Load App Data from Firebase (app_updates/data_app)
async function loadAppData() {
    try {
        const appDataRef = ref(db, 'app_updates/data_app');
        const snapshot = await get(appDataRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const firstKey = Object.keys(data)[0];
            const appInfo = data[firstKey];
            
            if (appInfo) {
                const descText = appInfo.dec || appInfo.new || "THABIT TV — عالم الترفيه بين يديك";
                const appTitle = appInfo.title || "THABIT TV";
                const appSize = appInfo.size || "22.0 MB";
                const appTime = appInfo.time || "غير محدد";
                
                // Display App Header
                const appHeader = document.getElementById('appHeader');
                const iconHtml = appInfo.icon && !appInfo.icon.includes('content://') 
                    ? `<img src="${appInfo.icon}" alt="${appTitle}">` 
                    : `<i class="fas fa-tv"></i>`;
                
                appHeader.innerHTML = `
                    <div class="app-info-wrapper">
                        <div class="app-icon">
                            ${iconHtml}
                        </div>
                        <div class="app-details">
                            <h1 class="app-title">${appTitle}</h1>
                            <div class="app-meta">
                                <span><i class="fas fa-database"></i> الحجم: ${appSize}</span>
                                <span id="appVersionDisplay"><i class="fas fa-code-branch"></i> الإصدار: <span id="appVersion">4.0</span></span>
                                <span><i class="fas fa-calendar-alt"></i> آخر تحديث: <span id="updateDate">${appTime}</span></span>
                            </div>
                            <div class="app-description-text">${descText.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                `;
                
                // Extract and display features
                const features = extractFeatures(descText);
                const featuresGrid = document.getElementById('featuresGrid');
                featuresGrid.innerHTML = features.map(f => `
                    <div class="feature-card">
                        <i class="${f.icon}"></i>
                        <h3>${f.title}</h3>
                        <p>${f.desc}</p>
                    </div>
                `).join('');
                
                // Load screenshots - جلب جميع الصور من sc1 إلى sc5
                const screenshots = [];
                for (let i = 1; i <= 5; i++) {
                    const screenshot = appInfo[`sc${i}`];
                    if (screenshot && screenshot.trim() !== "" && !screenshot.includes('content://')) {
                        screenshots.push(screenshot);
                    }
                }
                
                if (screenshots.length > 0) {
                    currentScreenshots = screenshots;
                    const screenshotsSection = document.getElementById('screenshotsSection');
                    screenshotsSection.style.display = 'block';
                    const wrapper = document.getElementById('screenshotsWrapper');
                    
                    wrapper.innerHTML = screenshots.map((src, index) => `
                        <div class="swiper-slide">
                            <img src="${src}" alt="تطبيق THABIT TV - صورة ${index + 1}" data-index="${index}">
                        </div>
                    `).join('');
                    
                    // Initialize Swiper
                    new Swiper('.screenshots-swiper', {
                        slidesPerView: 'auto',
                        spaceBetween: 15,
                        centeredSlides: false,
                        loop: screenshots.length > 3,
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        },
                        pagination: {
                            el: '.swiper-pagination',
                            clickable: true,
                        },
                        breakpoints: {
                            320: {
                                slidesPerView: 2,
                                spaceBetween: 10,
                            },
                            640: {
                                slidesPerView: 3,
                                spaceBetween: 15,
                            },
                            1024: {
                                slidesPerView: 4,
                                spaceBetween: 20,
                            }
                        }
                    });
                    
                    // Add click event to images
                    setTimeout(() => {
                        document.querySelectorAll('.screenshots-swiper .swiper-slide img').forEach(img => {
                            img.addEventListener('click', (e) => {
                                const index = parseInt(img.getAttribute('data-index'));
                                openLightbox(index);
                            });
                        });
                    }, 500);
                }
            }
        } else {
            // Fallback content
            document.getElementById('appHeader').innerHTML = `
                <div class="app-info-wrapper">
                    <div class="app-icon"><i class="fas fa-tv"></i></div>
                    <div class="app-details">
                        <h1 class="app-title">THABIT TV</h1>
                        <div class="app-description-text">عالم الترفيه بين يديك</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading app data:", error);
    }
}

// Lightbox functions
function openLightbox(index) {
    currentIndex = index;
    const modal = document.getElementById('lightboxModal');
    const lightboxImage = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    
    lightboxImage.src = currentScreenshots[currentIndex];
    caption.textContent = `صورة ${currentIndex + 1} من ${currentScreenshots.length}`;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function prevImage() {
    currentIndex = (currentIndex - 1 + currentScreenshots.length) % currentScreenshots.length;
    const lightboxImage = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    lightboxImage.src = currentScreenshots[currentIndex];
    caption.textContent = `صورة ${currentIndex + 1} من ${currentScreenshots.length}`;
}

function nextImage() {
    currentIndex = (currentIndex + 1) % currentScreenshots.length;
    const lightboxImage = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    lightboxImage.src = currentScreenshots[currentIndex];
    caption.textContent = `صورة ${currentIndex + 1} من ${currentScreenshots.length}`;
}

// Load Packages with custom order
async function loadPackages() {
    try {
        const packagesRef = ref(db, 'packages');
        const snapshot = await get(packagesRef);
        
        if (snapshot.exists()) {
            const packagesData = snapshot.val();
            const packagesArray = Object.values(packagesData).filter(pkg => pkg.active !== false);
            
            // Define custom order
            const orderMap = {
                'الاشتراك اليومي': 1,
                'الاشتراك الشهري': 2,
                'الاشتراك 3 أشهر': 3,
                'الاشتراك لستة اشهر': 4,
                'الاشتراك السنوي': 5
            };
            
            packagesArray.sort((a, b) => {
                const orderA = orderMap[a.title] || 999;
                const orderB = orderMap[b.title] || 999;
                return orderA - orderB;
            });
            
            const packagesGrid = document.getElementById('packagesGrid');
            if (packagesArray.length === 0) {
                packagesGrid.innerHTML = '<p style="text-align:center; color:white;">لا توجد باقات متاحة حالياً</p>';
                return;
            }
            
            packagesGrid.innerHTML = packagesArray.map(pkg => {
                let durationText = "";
                if (pkg.type === "DAY") {
                    durationText = "يوم واحد";
                } else if (pkg.type === "MONTH") {
                    durationText = pkg.Subscription_duration === "6" ? "6 أشهر" : "شهر واحد";
                } else if (pkg.type === "YEAR") {
                    durationText = "سنة كاملة";
                } else {
                    durationText = pkg.Subscription_duration + " يوم";
                }
                
                let northPrice = pkg.price_north || "غير محدد";
                let southPrice = pkg.price_south || "غير محدد";
                
                return `
                    <div class="package-card">
                        <h3>${pkg.title || "باقة اشتراك"}</h3>
                        <div class="package-duration"><i class="far fa-calendar-alt"></i> المدة: ${durationText}</div>
                        <div class="package-prices">
                            <div class="price-item">
                                <span class="price-label"><i class="fas fa-map-marker-alt"></i> شمال اليمن:</span>
                                <span class="price-value">${southPrice} ريال</span>
                            </div>
                            <div class="price-item">
                                <span class="price-label"><i class="fas fa-map-marker-alt"></i> جنوب اليمن:</span>
                                <span class="price-value">${northPrice} ريال</span>
                            </div>
                        </div>
                        <div class="kunz"><i class="fas fa-coins"></i> ${pkg.Kunz || "0"} كونز</div>
                        <p style="margin-top: 1rem; font-size: 0.9rem; color: #718096;">${pkg.description || "باقة مميزة تناسب احتياجاتك"}</p>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error("Error loading packages:", error);
    }
}

// Setup social links
function setupSocialLinks() {
    // WhatsApp with welcome message
    const whatsappNumber = "736091318";
    const welcomeMessage = "مرحباً بك في THABIT TV 👋\nأود الاشتراك في التطبيق والحصول على الباقات المميزة.";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(welcomeMessage)}`;
    
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        whatsappLink.href = whatsappUrl;
        whatsappLink.target = "_blank";
    }
    
    // Telegram
    const telegramLink = document.getElementById('telegramLink');
    if (telegramLink) {
        telegramLink.href = "https://t.me/thabitalgodai";
        telegramLink.target = "_blank";
    }
    
    // Email
    const emailLink = document.getElementById('emailLink');
    if (emailLink) {
        emailLink.href = "mailto:sabet122x@gmail.com?subject=الاستفسار عن THABIT TV&body=مرحباً، أود الاستفسار عن تطبيق THABIT TV وباقات الاشتراك";
        emailLink.target = "_blank";
    }
}

// Setup copy buttons
function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const textToCopy = btn.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    });
}

// Setup scroll functionality
function setupScroll() {
    const scrollBtn = document.getElementById('scrollDownBtn');
    const downloadSection = document.getElementById('downloadSection');
    
    if (scrollBtn && downloadSection) {
        scrollBtn.addEventListener('click', () => {
            downloadSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        });
    }
}

// Setup download button with dynamic URL
function setupDownloadButton() {
    const realDownloadBtn = document.getElementById('realDownloadBtn');
    if (realDownloadBtn) {
        // إزالة السلوك الافتراضي للرابط
        realDownloadBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // إظهار تأثير التحميل
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
            this.style.pointerEvents = 'none';
            
            // التأكد من وجود رابط التحميل
            if (!currentDownloadUrl || currentDownloadUrl === FALLBACK_DOWNLOAD_URL) {
                await updateDownloadUrl();
            }
            
            // بدء التحميل
            window.location.href = currentDownloadUrl;
            
            // استعادة الزر بعد ثانيتين
            setTimeout(() => {
                this.innerHTML = originalHTML;
                this.style.pointerEvents = 'auto';
            }, 2000);
        });
        
        // تحديث href بشكل دوري
        realDownloadBtn.href = currentDownloadUrl;
        realDownloadBtn.setAttribute('download', '');
    }
}

// Setup lightbox events
function setupLightbox() {
    const modal = document.getElementById('lightboxModal');
    const closeBtn = document.querySelector('.close-lightbox');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', prevImage);
    if (nextBtn) nextBtn.addEventListener('click', nextImage);
    
    // Close on click outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLightbox();
            }
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal && modal.style.display === 'block') {
            if (e.key === 'ArrowLeft') nextImage();
            if (e.key === 'ArrowRight') prevImage();
            if (e.key === 'Escape') closeLightbox();
        }
    });
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }, 1000);
}

// Initialize
async function init() {
    // جلب رابط التحميل أولاً
    await updateDownloadUrl();
    
    // تحميل باقي البيانات
    await loadAppData();
    await loadPackages();
    
    // إعداد الوظائف
    setupSocialLinks();
    setupCopyButtons();
    setupScroll();
    setupDownloadButton(); // استبدال setupScroll السابقة لزر التحميل
    setupLightbox();
    hideLoading();
}

init();