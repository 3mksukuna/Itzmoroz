// بيانات التطبيق الأساسية
const APP_CONFIG = {
    ownerUsername: "3mksukuna",
    ownerPassword: "ben148406",
    emailSender: "Itzowner7z@gmail.com",
    backupEmail: "mahmoud555sxs@gmail.com",
    supabaseUrl: "https://ewlngentnaewuicjlfnr.supabase.co",
    supabaseKey: "sb_publishable_LTz8bGvNKGAdNWxgQSBeDw_EE01YRyB"
};

// حالة التطبيق
let appState = {
    currentUser: null,
    products: [],
    users: [],
    isSubscribed: false,
    currentProduct: null,
    countdownInterval: null
};

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شاشة التحميل بعد 2 ثانية
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 2000);
    
    // تحميل البيانات من localStorage
    loadFromStorage();
    
    // عرض المنتجات
    showProducts();
    
    // التحقق من حالة المستخدم
    checkUserStatus();
});

// تحميل البيانات من localStorage
function loadFromStorage() {
    const savedProducts = localStorage.getItem('itzmoroz_products');
    const savedUsers = localStorage.getItem('itzmoroz_users');
    const savedCurrentUser = localStorage.getItem('itzmoroz_currentUser');
    
    if (savedProducts) {
        appState.products = JSON.parse(savedProducts);
    } else {
        // إنشاء منتجات تجريبية
        createSampleProducts();
    }
    
    if (savedUsers) {
        appState.users = JSON.parse(savedUsers);
    }
    
    if (savedCurrentUser) {
        appState.currentUser = JSON.parse(savedCurrentUser);
    }
}

// حفظ البيانات في localStorage
function saveToStorage() {
    localStorage.setItem('itzmoroz_products', JSON.stringify(appState.products));
    localStorage.setItem('itzmoroz_users', JSON.stringify(appState.users));
    if (appState.currentUser) {
        localStorage.setItem('itzmoroz_currentUser', JSON.stringify(appState.currentUser));
    } else {
        localStorage.removeItem('itzmoroz_currentUser');
    }
}

// إنشاء منتجات تجريبية
function createSampleProducts() {
    appState.products = [
        {
            id: 1,
            name: "تطبيق ItzPlayer",
            description: "مشغل وسائط متقدّم يدعم جميع الصيغ",
            image: "https://placehold.co/300x200/0d47a1/white?text=ItzPlayer",
            file: "#",
            steps: [
                { title: "الخطوة الأولى", description: "قم بتنزيل التطبيق من الزر أدناه", file: "#" },
                { title: "الخطوة الثانية", description: "افتح التطبيق واتبع التعليمات", file: "#" }
            ],
            downloads: 1250,
            rating: 4.5,
            isFree: true,
            dateAdded: new Date().toISOString()
        },
        {
            id: 2,
            name: "لعبة ItzGame Pro",
            description: "لعبة مغامرات مذهلة برسومات عالية الجودة",
            image: "https://placehold.co/300x200/1565c0/white?text=ItzGame",
            file: "#",
            steps: [
                { title: "الخطوة الأولى", description: "قم بتنزيل اللعبة من الزر أدناه", file: "#" },
                { title: "الخطوة الثانية", description: "ثبت اللعبة وافتحها", file: "#" },
                { title: "الخطوة الثالثة", description: "ابدأ اللعب واستمتع!", file: "#" }
            ],
            downloads: 890,
            rating: 4.8,
            isFree: false,
            price: 4.99,
            dateAdded: new Date().toISOString()
        }
    ];
    saveToStorage();
}

// عرض المنتجات
function showProducts() {
    document.getElementById('products-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
    
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';
    
    appState.products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div style="position: relative;">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                ${product.isFree ? '<span class="free-badge">مجاني</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>
                <button class="download-btn" onclick="showProductDetail(${product.id})">
                    <i class="fas fa-eye"></i> عرض التفاصيل
                </button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// عرض تفاصيل المنتج
function showProductDetail(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product) return;
    
    appState.currentProduct = product;
    const detailContent = document.getElementById('product-detail-content');
    
    let stepsHtml = '';
    if (product.steps && product.steps.length > 0) {
        stepsHtml = `
            <div class="steps-section">
                <h3><i class="fas fa-list-ol"></i> خطوات التثبيت</h3>
                ${product.steps.map((step, index) => `
                    <div class="step">
                        <h4>${index + 1}. ${step.title}</h4>
                        <p>${step.description}</p>
                        ${step.file ? `<a href="${step.file}" class="btn btn-secondary" download><i class="fas fa-download"></i> تنزيل الملف</a>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    detailContent.innerHTML = `
        <div class="product-header">
            <img src="${product.image}" alt="${product.name}" class="product-image-large">
            <div class="product-meta">
                <h2>${product.name}</h2>
                <div class="rating">
                    ${renderStars(product.rating)}
                    <span>(${product.rating}/5)</span>
                </div>
                <div class="download-count">
                    <i class="fas fa-download"></i> ${product.downloads} تنزيل
                </div>
                <p>${product.isFree ? 'منتج مجاني' : `السعر: $${product.price}`}</p>
            </div>
        </div>
        
        <div class="description">
            <h3><i class="fas fa-info-circle"></i> الوصف</h3>
            <p>${product.description}</p>
        </div>
        
        ${stepsHtml}
        
        <div class="download-section">
            <h3><i class="fas fa-download"></i> تنزيل المنتج</h3>
            <div class="actions">
                <button class="btn btn-primary" onclick="startDownload(${product.id})">
                    <i class="fas fa-download"></i> ${product.isFree ? 'تنزيل الآن' : 'شراء وتنزيل'}
                </button>
                ${!product.isFree ? `
                    <button class="btn btn-success" onclick="openSupport()">
                        <i class="fas fa-donate"></i> دعم المطور
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="addToFavorites(${product.id})">
                    <i class="fas fa-heart"></i> إضافة إلى المفضلة
                </button>
            </div>
        </div>
    `;
    
    openModal('product-detail-modal');
}

// عرض نجوم التقييم
function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// بدء عملية التنزيل
function startDownload(productId) {
    if (!appState.currentUser) {
        showLogin();
        return;
    }
    
    // إذا لم يكن المستخدم مشتركًا، إظهار شاشة الاشتراك
    if (!appState.isSubscribed) {
        openModal('subscription-modal');
        startCountdown();
        return;
    }
    
    // تنزيل المنتج
    const product = appState.products.find(p => p.id === productId);
    if (product) {
        product.downloads++;
        saveToStorage();
        alert(`بدأ تنزيل "${product.name}"...`);
        closeModal('product-detail-modal');
    }
}

// بدء العداد التنازلي للتخطي
function startCountdown() {
    let count = 10;
    document.getElementById('countdown').textContent = count;
    document.querySelector('.skip-btn').disabled = true;
    
    appState.countdownInterval = setInterval(() => {
        count--;
        document.getElementById('countdown').textContent = count;
        
        if (count <= 0) {
            clearInterval(appState.countdownInterval);
            document.querySelector('.skip-btn').disabled = false;
        }
    }, 1000);
}

// تخطي الاشتراك
function skipSubscription() {
    appState.isSubscribed = true;
    saveToStorage();
    closeModal('subscription-modal');
    startDownload(appState.currentProduct.id);
}

// الاشتراك في قناة
function subscribeChannel(channel) {
    let url = '';
    switch(channel) {
        case 'youtube':
            url = 'https://youtube.com/@itzmoroz';
            break;
        case 'telegram':
            url = 'https://t.me/Itzmoroz';
            break;
        case 'discord':
            url = 'https://discord.gg/7WFzk2VcU';
            break;
    }
    
    window.open(url, '_blank');
    
    // بعد 5 ثوانٍ من الاشتراك، اعتبار المستخدم مشتركًا
    setTimeout(() => {
        appState.isSubscribed = true;
        saveToStorage();
        closeModal('subscription-modal');
        startDownload(appState.currentProduct.id);
    }, 5000);
}

// إضافة إلى المفضلة
function addToFavorites(productId) {
    alert('تمت إضافة المنتج إلى المفضلة!');
}

// فتح لوحة التحكم
function openDashboard() {
    if (!appState.currentUser) {
        showLogin();
        return;
    }
    
    document.getElementById('products-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
}

// فتح إضافة منتج
function openAddProduct() {
    if (!appState.currentUser) {
        showLogin();
        return;
    }
    
    openModal('add-product-modal');
}

// إضافة خطوة جديدة
function addStep() {
    const container = document.getElementById('steps-container');
    const stepCount = container.querySelectorAll('.step-item').length + 1;
    
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';
    stepItem.innerHTML = `
        <input type="text" class="step-title" placeholder="عنوان الخطوة ${stepCount}">
        <textarea class="step-description" placeholder="وصف الخطوة ${stepCount}"></textarea>
        <input type="file" class="step-file" accept=".apk,.zip,.rar">
        <button type="button" class="remove-step" onclick="removeStep(this)">إزالة</button>
    `;
    
    container.appendChild(stepItem);
}

// إزالة خطوة
function removeStep(button) {
    button.parentElement.remove();
}

// عرض جميع المنتجات
function viewAllProducts() {
    showProducts();
    document.getElementById('products-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

// عرض السجلات
function viewLogs() {
    alert(`عدد المستخدمين المسجلين: ${appState.users.length}\nعدد المنتجات: ${appState.products.length}`);
}

// فتح الدعم
function openSupport() {
    openModal('support-modal');
    
    // تحديث حالة البطاقة
    const cardStatus = document.getElementById('card-status');
    const cardNumber = document.getElementById('card-number');
    
    // محاكاة عدم توفر البطاقة
    cardStatus.textContent = 'غير متاح';
    cardStatus.style.color = '#f44336';
    cardNumber.textContent = 'غير متوفر حالياً';
}

// التحقق من حالة المستخدم
function checkUserStatus() {
    if (appState.currentUser) {
        document.getElementById('login-link').classList.add('hidden');
        document.getElementById('logout-link').classList.remove('hidden');
        
        // إظهار لوحة التحكم للمالك فقط
        if (appState.currentUser.username === APP_CONFIG.ownerUsername) {
            document.getElementById('dashboard-link').classList.remove('hidden');
        } else {
            document.getElementById('dashboard-link').classList.add('hidden');
        }
    } else {
        document.getElementById('login-link').classList.remove('hidden');
        document.getElementById('logout-link').classList.add('hidden');
        document.getElementById('dashboard-link').classList.add('hidden');
    }
}

// إظهار شاشة تسجيل الدخول
function showLogin() {
    openModal('login-modal');
}

// إظهار شاشة التسجيل
function showRegister() {
    closeModal('login-modal');
    openModal('register-modal');
}

// تسجيل الخروج
function logout() {
    appState.currentUser = null;
    appState.isSubscribed = false;
    saveToStorage();
    checkUserStatus();
    showProducts();
    alert('تم تسجيل الخروج بنجاح');
}

// فتح مودال
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

// إغلاق مودال
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    
    // إيقاف العداد إذا كان يعمل
    if (appState.countdownInterval) {
        clearInterval(appState.countdownInterval);
    }
}

// إرسال رمز التحقق (محاكاة)
function sendVerificationCode(email) {
    // في تطبيق حقيقي، سيتم إرسال رمز عبر البريد الإلكتروني
    const code = Math.floor(100000 + Math.random() * 900000);
    alert(`تم إرسال رمز التحقق إلى ${email}: ${code}`);
    return code.toString();
}

// معالجة تسجيل الدخول
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    // التحقق من بيانات المالك
    if (username === APP_CONFIG.ownerUsername && password === APP_CONFIG.ownerPassword) {
        appState.currentUser = { username, isAdmin: true };
        saveToStorage();
        closeModal('login-modal');
        checkUserStatus();
        alert('مرحبًا أيها المالك!');
        return;
    }
    
    // التحقق من المستخدمين المسجلين
    const user = appState.users.find(u => u.username === username && u.password === password);
    if (user) {
        appState.currentUser = { username, isAdmin: false };
        saveToStorage();
        closeModal('login-modal');
        checkUserStatus();
        alert('تم تسجيل الدخول بنجاح');
    } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
});

// معالجة إنشاء الحساب
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('register-email').value;
    
    // التحقق من أن اسم المستخدم غير مأخوذ
    if (appState.users.some(u => u.username === username)) {
        alert('اسم المستخدم مأخوذ بالفعل');
        return;
    }
    
    // إضافة المستخدم الجديد
    const newUser = { username, password, email };
    appState.users.push(newUser);
    saveToStorage();
    
    // إذا تم إدخال بريد إلكتروني، إرسال رمز التحقق
    if (email) {
        const verificationCode = sendVerificationCode(email);
        localStorage.setItem('pending_user', JSON.stringify({ ...newUser, verificationCode }));
        closeModal('register-modal');
        openModal('verification-modal');
    } else {
        // تسجيل الدخول مباشرة دون تحقق من البريد
        appState.currentUser = { username, isAdmin: false };
        saveToStorage();
        closeModal('register-modal');
        checkUserStatus();
        alert('تم إنشاء الحساب بنجاح');
    }
});

// معالجة التحقق من الرمز
document.getElementById('verification-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const enteredCode = document.getElementById('verification-code').value;
    const pendingUser = JSON.parse(localStorage.getItem('pending_user'));
    
    if (pendingUser && pendingUser.verificationCode === enteredCode) {
        appState.currentUser = { username: pendingUser.username, isAdmin: false };
        saveToStorage();
        localStorage.removeItem('pending_user');
        closeModal('verification-modal');
        checkUserStatus();
        alert('تم التحقق من البريد الإلكتروني وإنشاء الحساب بنجاح');
    } else {
        alert('رمز التحقق غير صحيح');
    }
});

// معالجة إضافة المنتج
document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!appState.currentUser) {
        alert('يجب تسجيل الدخول لإضافة منتج');
        return;
    }
    
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const imageFile = document.getElementById('product-image').files[0];
    const productFile = document.getElementById('product-file').files[0];
    
    // جمع خطوات التثبيت
    const stepsContainer = document.getElementById('steps-container');
    const stepItems = stepsContainer.querySelectorAll('.step-item');
    const steps = [];
    
    stepItems.forEach(item => {
        const title = item.querySelector('.step-title').value;
        const desc = item.querySelector('.step-description').value;
        const file = item.querySelector('.step-file').files[0];
        
        if (title || desc) {
            steps.push({
                title: title || 'خطوة',
                description: desc || '',
                file: file ? URL.createObjectURL(file) : null
            });
        }
    });
    
    // إنشاء منتج جديد
    const newProduct = {
        id: Date.now(),
        name,
        description,
        image: imageFile ? URL.createObjectURL(imageFile) : 'https://placehold.co/300x200/0d47a1/white?text=منتج',
        file: productFile ? URL.createObjectURL(productFile) : '#',
        steps,
        downloads: 0,
        rating: 0,
        isFree: true,
        dateAdded: new Date().toISOString()
    };
    
    appState.products.push(newProduct);
    saveToStorage();
    
    closeModal('add-product-modal');
    alert('تمت إضافة المنتج بنجاح');
    
    // إعادة تعيين النموذج
    this.reset();
    document.getElementById('steps-container').innerHTML = `
        <h3>خطوات التثبيت:</h3>
        <div class="step-item">
            <input type="text" class="step-title" placeholder="عنوان الخطوة">
            <textarea class="step-description" placeholder="وصف الخطوة"></textarea>
            <input type="file" class="step-file" accept=".apk,.zip,.rar">
            <button type="button" class="remove-step" onclick="removeStep(this)">إزالة</button>
        </div>
    `;
});