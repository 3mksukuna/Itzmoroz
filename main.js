// ============================================================
//  ITZMOROZ - MAIN.JS (SUPABASE + LOCALSTORAGE FALLBACK)
// ============================================================

// ===== CONFIG =====
var SB_URL = 'https://ewlngentnaewuicjlfnr.supabase.co';
var SB_KEY = 'sb_publishable_LTz8bGvNKGAdNWxgQSBeDw_EE01YRyB';
var OWNER_USER = '3mksukuna';
var OWNER_PASS = 'ben148406';

// ===== STATE =====
var me = null;
var lang = 'ar';
var viewMode = 'grid';
var editingId = null;
var tempImg = null;
var tempSS = [];
var tempFile = null;
var tempStepFiles = {};
var stepCounter = 0;
var tempRatings = {};
var subCallback = null;

// ===== SUPABASE =====
var sb = null;
var dbOK = false;

function initDB() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            sb = supabase.createClient(SB_URL, SB_KEY);
            console.log('Supabase client created');
        }
    } catch (e) {
        console.warn('Supabase init failed:', e);
    }
}

async function testDB() {
    if (!sb) return false;
    try {
        var result = await sb.from('users').select('id').limit(1);
        if (result.error) {
            console.warn('DB not ready:', result.error.message);
            return false;
        }
        console.log('✅ Database connected!');
        return true;
    } catch (e) {
        console.warn('DB test failed:', e);
        return false;
    }
}

// ===== LOCAL STORAGE =====
var LS = {
    get: function(k, d) {
        try { var v = localStorage.getItem('itz_' + k); return v ? JSON.parse(v) : (d !== undefined ? d : null); }
        catch (e) { return d !== undefined ? d : null; }
    },
    set: function(k, v) {
        try { localStorage.setItem('itz_' + k, JSON.stringify(v)); } catch (e) { console.warn('Storage full'); }
    },
    del: function(k) {
        try { localStorage.removeItem('itz_' + k); } catch (e) {}
    }
};

// ===== HELPERS =====
function gid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function fmtSize(b) {
    if (b < 1024) return b + 'B';
    if (b < 1048576) return (b / 1024).toFixed(1) + 'KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + 'MB';
    return (b / 1073741824).toFixed(2) + 'GB';
}
function openMod(id) { document.getElementById(id).style.display = 'flex'; }
function closeMod(id) { document.getElementById(id).style.display = 'none'; }

// ===== IMAGE COMPRESS =====
function compressImage(file, maxW) {
    return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var c = document.createElement('canvas');
                var w = img.width, h = img.height;
                if (w > (maxW || 600)) { h = h * (maxW || 600) / w; w = maxW || 600; }
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = function() { resolve(e.target.result); };
            img.src = e.target.result;
        };
        reader.onerror = function() { resolve(null); };
        reader.readAsDataURL(file);
    });
}

function toB64(file) {
    return new Promise(function(r, e) {
        var rd = new FileReader(); rd.onload = function() { r(rd.result); }; rd.onerror = e; rd.readAsDataURL(file);
    });
}

// ===== TOAST =====
function toast(msg, type) {
    type = type || 'inf';
    var c = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    var icon = type === 'ok' ? 'fa-check-circle' : type === 'er' ? 'fa-exclamation-circle' : 'fa-info-circle';
    t.innerHTML = '<i class="fas ' + icon + '"></i> ' + msg;
    c.appendChild(t);
    setTimeout(function() { t.classList.add('out'); setTimeout(function() { t.remove(); }, 250); }, 2800);
}

// ===== CONFIRM =====
function confirmAction(msg, fn) {
    document.getElementById('cfmMsg').textContent = msg;
    openMod('cfmBox');
    document.getElementById('cfmY').onclick = function() { closeMod('cfmBox'); fn(); };
    document.getElementById('cfmN').onclick = function() { closeMod('cfmBox'); };
}

// ============================================================
//  DATA LAYER - Supabase first, localStorage fallback
// ============================================================

async function dbGetUsers() {
    if (dbOK && sb) {
        try {
            var r = await sb.from('users').select('*');
            if (!r.error && r.data) return r.data;
        } catch (e) {}
    }
    return LS.get('users', []);
}

async function dbFindUser(username, password) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('users').select('*').eq('username', username).eq('password', password).single();
            if (!r.error && r.data) return r.data;
            return null;
        } catch (e) {}
    }
    var users = LS.get('users', []);
    for (var i = 0; i < users.length; i++) {
        if (users[i].username === username && users[i].password === password) return users[i];
    }
    return null;
}

async function dbCheckUsername(username) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('users').select('id').ilike('username', username);
            if (!r.error && r.data && r.data.length > 0) return true;
            return false;
        } catch (e) {}
    }
    var users = LS.get('users', []);
    for (var i = 0; i < users.length; i++) {
        if (users[i].username.toLowerCase() === username.toLowerCase()) return true;
    }
    return false;
}

async function dbAddUser(user) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('users').insert(user).select().single();
            if (!r.error && r.data) return r.data;
            if (r.error) console.warn('DB addUser error:', r.error.message);
        } catch (e) { console.warn('addUser catch:', e); }
    }
    var users = LS.get('users', []);
    users.push(user);
    LS.set('users', users);
    return user;
}

async function dbGetProducts() {
    if (dbOK && sb) {
        try {
            var r = await sb.from('products').select('*').order('created_at', { ascending: false });
            if (!r.error && r.data) return r.data;
        } catch (e) {}
    }
    return LS.get('products', []);
}

async function dbAddProduct(product) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('products').insert(product).select().single();
            if (!r.error && r.data) return r.data;
            if (r.error) console.warn('DB addProduct error:', r.error.message);
        } catch (e) { console.warn('addProduct catch:', e); }
    }
    var products = LS.get('products', []);
    products.unshift(product);
    LS.set('products', products);
    return product;
}

async function dbUpdateProduct(id, data) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('products').update(data).eq('id', id);
            if (!r.error) return true;
        } catch (e) {}
    }
    var products = LS.get('products', []);
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === id) {
            for (var k in data) { products[i][k] = data[k]; }
            break;
        }
    }
    LS.set('products', products);
    return true;
}

async function dbDeleteProduct(id) {
    if (dbOK && sb) {
        try {
            await sb.from('reviews').delete().eq('product_id', id);
            await sb.from('favorites').delete().eq('product_id', id);
            await sb.from('products').delete().eq('id', id);
        } catch (e) {}
    }
    var products = LS.get('products', []);
    var newP = [];
    for (var i = 0; i < products.length; i++) { if (products[i].id !== id) newP.push(products[i]); }
    LS.set('products', newP);
}

async function dbGetProduct(id) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('products').select('*').eq('id', id).single();
            if (!r.error && r.data) return r.data;
        } catch (e) {}
    }
    var products = LS.get('products', []);
    for (var i = 0; i < products.length; i++) { if (products[i].id === id) return products[i]; }
    return null;
}

async function dbGetReviews(pid) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('reviews').select('*').eq('product_id', pid).order('created_at', { ascending: false });
            if (!r.error && r.data) return r.data;
        } catch (e) {}
    }
    var all = LS.get('reviews', {});
    return all[pid] || [];
}

async function dbAddReview(review) {
    if (dbOK && sb) {
        try {
            // Delete existing review by same user
            await sb.from('reviews').delete().eq('product_id', review.product_id).eq('user_id', review.user_id);
            var r = await sb.from('reviews').insert(review);
            if (!r.error) return true;
        } catch (e) {}
    }
    var all = LS.get('reviews', {});
    if (!all[review.product_id]) all[review.product_id] = [];
    var idx = -1;
    for (var i = 0; i < all[review.product_id].length; i++) {
        if (all[review.product_id][i].user_id === review.user_id) { idx = i; break; }
    }
    if (idx >= 0) all[review.product_id][idx] = review;
    else all[review.product_id].push(review);
    LS.set('reviews', all);
    return true;
}

async function dbGetFavs(userId) {
    if (dbOK && sb) {
        try {
            var r = await sb.from('favorites').select('product_id').eq('user_id', userId);
            if (!r.error && r.data) return r.data.map(function(x) { return x.product_id; });
        } catch (e) {}
    }
    return LS.get('fav_' + userId, []);
}

async function dbToggleFav(userId, productId) {
    if (dbOK && sb) {
        try {
            var existing = await sb.from('favorites').select('id').eq('user_id', userId).eq('product_id', productId);
            if (existing.data && existing.data.length > 0) {
                await sb.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
            } else {
                await sb.from('favorites').insert({ id: gid(), user_id: userId, product_id: productId });
            }
            return;
        } catch (e) {}
    }
    var favs = LS.get('fav_' + userId, []);
    var idx = favs.indexOf(productId);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(productId);
    LS.set('fav_' + userId, favs);
}

async function dbGetChannels() {
    if (dbOK && sb) {
        try {
            var r = await sb.from('channels').select('*');
            if (!r.error && r.data && r.data.length > 0) return r.data;
        } catch (e) {}
    }
    return LS.get('channels', defaultChannels());
}

async function dbAddChannel(ch) {
    if (dbOK && sb) {
        try {
            await sb.from('channels').insert(ch);
            return;
        } catch (e) {}
    }
    var chs = LS.get('channels', defaultChannels());
    chs.push(ch);
    LS.set('channels', chs);
}

async function dbDeleteChannel(id) {
    if (dbOK && sb) {
        try { await sb.from('channels').delete().eq('id', id); return; } catch (e) {}
    }
    var chs = LS.get('channels', []);
    var n = [];
    for (var i = 0; i < chs.length; i++) { if (chs[i].id !== id) n.push(chs[i]); }
    LS.set('channels', n);
}

async function dbGetSupport() {
    if (dbOK && sb) {
        try {
            var r = await sb.from('support_settings').select('*').eq('id', 1).single();
            if (!r.error && r.data) return { on: r.data.enabled, visa: r.data.visa_number };
        } catch (e) {}
    }
    return LS.get('support', { on: false, visa: '' });
}

async function dbSetSupport(s) {
    if (dbOK && sb) {
        try {
            await sb.from('support_settings').upsert({ id: 1, enabled: s.on, visa_number: s.visa });
            return;
        } catch (e) {}
    }
    LS.set('support', s);
}

function defaultChannels() {
    return [
        { id: 'c1', name: 'Itzmoroz Telegram', url: 'https://t.me/Itzmoroz', type: 'telegram', skippable: true },
        { id: 'c2', name: 'Itzmoroz YouTube', url: 'https://youtube.com/@itzmoroz?si=JrfwgGE5_Y7-CwUf', type: 'youtube', skippable: false },
        { id: 'c3', name: 'Itzmoroz Discord', url: 'https://discord.gg/7WFzk2VcU', type: 'discord', skippable: true },
        { id: 'c4', name: 'Itzshadoro YouTube', url: 'https://youtube.com/@itzshadoro?si=1YD4424OYbAF-Agk', type: 'youtube', skippable: false }
    ];
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    initDB();
    initLang();

    // Test DB connection
    dbOK = await testDB();

    // Init owner account
    await initOwner();

    // Load session
    await loadSession();

    // Hide splash & show app
    setTimeout(function() {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('app').style.display = '';
        renderProducts();
        updateUI();
    }, 1800);

    // Close dropdown
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-area')) {
            var dd = document.getElementById('userDD');
            if (dd) dd.classList.remove('show');
        }
    });

    // Close modals on overlay click
    var overlays = document.querySelectorAll('.ov');
    for (var i = 0; i < overlays.length; i++) {
        (function(ov) {
            ov.addEventListener('click', function(e) { if (e.target === ov) ov.style.display = 'none'; });
        })(overlays[i]);
    }

    // User menu toggle
    var btnMenu = document.getElementById('btnUserMenu');
    if (btnMenu) btnMenu.addEventListener('click', function() {
        document.getElementById('userDD').classList.toggle('show');
    });

    if (dbOK) {
        toast(lang === 'ar' ? '✅ متصل بقاعدة البيانات' : '✅ Database connected', 'ok');
    } else {
        toast(lang === 'ar' ? '📱 وضع محلي' : '📱 Local mode', 'inf');
    }
});

// ===== LANGUAGE =====
function initLang() {
    var saved = LS.get('lang');
    if (saved) lang = saved;
    else lang = (navigator.language || 'ar').startsWith('ar') ? 'ar' : 'en';
    applyLang();
}

function applyLang() {
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = lang;
    LS.set('lang', lang);
}

function toggleLang() {
    lang = lang === 'ar' ? 'en' : 'ar';
    applyLang();
    renderProducts();
    toast(lang === 'ar' ? 'تم تغيير اللغة' : 'Language changed', 'ok');
}

// ===== OWNER =====
async function initOwner() {
    var exists = await dbCheckUsername(OWNER_USER);
    if (!exists) {
        await dbAddUser({
            id: 'owner01',
            username: OWNER_USER,
            password: OWNER_PASS,
            display_name: 'Owner',
            birthdate: '2000-01-01',
            is_owner: true,
            created_at: new Date().toISOString()
        });
    }
}

async function loadSession() {
    var session = LS.get('session');
    if (session && session.u) {
        var user = await dbFindUser(session.u, session.p);
        if (user) me = user;
    }
}

// ============================================================
//  AUTH
// ============================================================
function switchAuth(tab) {
    document.getElementById('tabL').classList.toggle('active', tab === 'login');
    document.getElementById('tabR').classList.toggle('active', tab === 'reg');
    document.getElementById('formLogin').style.display = tab === 'login' ? 'flex' : 'none';
    document.getElementById('formReg').style.display = tab === 'reg' ? 'flex' : 'none';
}

async function doLogin(e) {
    e.preventDefault();
    var u = document.getElementById('logU').value.trim();
    var p = document.getElementById('logP').value;
    if (!u || !p) { toast(lang === 'ar' ? 'أدخل البيانات' : 'Fill fields', 'er'); return; }

    toast(lang === 'ar' ? 'جاري التحقق...' : 'Checking...', 'inf');
    var user = await dbFindUser(u, p);
    if (!user) { toast(lang === 'ar' ? 'بيانات غلط!' : 'Wrong credentials!', 'er'); return; }

    me = user;
    LS.set('session', { u: me.username, p: me.password });
    closeMod('authMod');
    document.getElementById('formLogin').reset();
    toast(lang === 'ar' ? 'أهلاً بك! 👋' : 'Welcome! 👋', 'ok');
    updateUI();
    renderProducts();
}

async function doRegister(e) {
    e.preventDefault();
    var u = document.getElementById('regU').value.trim();
    var p = document.getElementById('regP').value;
    var p2 = document.getElementById('regP2').value;
    var dn = document.getElementById('regN').value.trim();
    var bd = document.getElementById('regB').value;

    if (!document.getElementById('agreeT').checked) {
        toast(lang === 'ar' ? 'وافق على الشروط!' : 'Agree to terms!', 'er'); return;
    }
    if (u.length < 3) { toast(lang === 'ar' ? 'الاسم قصير (3+)' : 'Username too short', 'er'); return; }
    if (p.length < 4) { toast(lang === 'ar' ? 'كلمة المرور قصيرة (4+)' : 'Password too short', 'er'); return; }
    if (p !== p2) { toast(lang === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords don\'t match', 'er'); return; }

    toast(lang === 'ar' ? 'جاري الإنشاء...' : 'Creating...', 'inf');

    var taken = await dbCheckUsername(u);
    if (taken) { toast(lang === 'ar' ? 'الاسم مستخدم بالفعل!' : 'Username taken!', 'er'); return; }

    var newUser = {
        id: gid(),
        username: u,
        password: p,
        display_name: dn || u,
        birthdate: bd,
        is_owner: false,
        created_at: new Date().toISOString()
    };

    var result = await dbAddUser(newUser);
    me = result;
    LS.set('session', { u: me.username, p: me.password });
    closeMod('authMod');
    document.getElementById('formReg').reset();
    toast(lang === 'ar' ? 'تم إنشاء حسابك! 🎉' : 'Account created! 🎉', 'ok');
    updateUI();
    renderProducts();
}

function doLogout() {
    me = null;
    LS.del('session');
    document.getElementById('userDD').classList.remove('show');
    updateUI();
    renderProducts();
    goHome();
    toast(lang === 'ar' ? 'تم الخروج' : 'Logged out', 'inf');
}

// ============================================================
//  UI
// ============================================================
function updateUI() {
    var logged = !!me;
    var isOwner = me && (me.is_owner || me.username === OWNER_USER);
    document.getElementById('btnLogin').style.display = logged ? 'none' : '';
    document.getElementById('userArea').style.display = logged ? '' : 'none';
    document.getElementById('btnFav').style.display = logged ? '' : 'none';
    if (logged) document.getElementById('dispName').textContent = me.display_name || me.username;
    document.getElementById('ownerDash').style.display = isOwner ? '' : 'none';
    document.getElementById('userDash').style.display = (logged && !isOwner) ? '' : 'none';
}

// ============================================================
//  SEARCH
// ============================================================
function toggleSearch() {
    var bar = document.getElementById('searchBar');
    if (bar.style.display === 'none') {
        bar.style.display = '';
        document.getElementById('searchInput').focus();
    } else {
        bar.style.display = 'none';
        document.getElementById('searchInput').value = '';
        renderProducts();
    }
}

async function doSearch() {
    var q = document.getElementById('searchInput').value.trim().toLowerCase();
    var all = await dbGetProducts();
    if (!q) { renderProductList(all); return; }
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i].name.toLowerCase().indexOf(q) >= 0 || (all[i].description || '').toLowerCase().indexOf(q) >= 0) {
            filtered.push(all[i]);
        }
    }
    renderProductList(filtered);
}

// ===== VIEW =====
function setView(mode) {
    viewMode = mode;
    var grid = document.getElementById('productsGrid');
    if (mode === 'list') grid.classList.add('list-view'); else grid.classList.remove('list-view');
    document.getElementById('btnGrid').classList.toggle('active', mode === 'grid');
    document.getElementById('btnList').classList.toggle('active', mode === 'list');
}

// ============================================================
//  PRODUCTS
// ============================================================
async function renderProducts() {
    var products = await dbGetProducts();
    renderProductList(products);
}

async function renderProductList(list) {
    var grid = document.getElementById('productsGrid');
    var empty = document.getElementById('emptyState');
    if (!list || list.length === 0) { grid.innerHTML = ''; empty.style.display = ''; return; }
    empty.style.display = 'none';
    var isOwner = me && (me.is_owner || me.username === OWNER_USER);
    var html = '';

    for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var revs = await dbGetReviews(p.id);
        var avg = 0;
        if (revs.length) { var t = 0; for (var j = 0; j < revs.length; j++) t += (revs[j].rating || 0); avg = t / revs.length; }
        var stars = avg > 0 ? '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg)) : '';
        var img = p.image_data || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iIzEzMjI0MiIvPjx0ZXh0IHg9IjgwIiB5PSI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiM4ODk5YjAiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        var canEdit = isOwner || (me && p.user_id === me.id);

        html += '<div class="product-card" onclick="openDetail(\'' + p.id + '\')">';
        if (canEdit) {
            html += '<div class="pc-actions" onclick="event.stopPropagation()">';
            html += '<button class="pc-edit" onclick="openEditProduct(\'' + p.id + '\')"><i class="fas fa-pen"></i></button>';
            html += '<button class="pc-del" onclick="deleteProduct(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>';
            html += '</div>';
        }
        html += '<span class="pc-badge">' + (lang === 'ar' ? 'مجاني' : 'Free') + '</span>';
        html += '<img class="pc-img" src="' + img + '" loading="lazy">';
        html += '<div class="pc-body"><div class="pc-name">' + esc(p.name) + '</div>';
        html += '<div class="pc-desc">' + esc(p.description) + '</div>';
        if (stars) html += '<div class="pc-stars">' + stars + ' (' + avg.toFixed(1) + ')</div>';
        html += '</div></div>';
    }
    grid.innerHTML = html;
}

// ============================================================
//  PRODUCT DETAIL
// ============================================================
async function openDetail(id) {
    var p = await dbGetProduct(id);
    if (!p) return;
    var body = document.getElementById('detailBody');
    var revs = await dbGetReviews(id);
    var avg = 0;
    if (revs.length) { var t = 0; for (var j = 0; j < revs.length; j++) t += (revs[j].rating || 0); avg = t / revs.length; }

    var users = await dbGetUsers();
    var pub = null;
    for (var k = 0; k < users.length; k++) { if (users[k].id === p.user_id) { pub = users[k]; break; } }
    var pubName = pub ? (pub.display_name || pub.username) : '?';

    var favs = me ? await dbGetFavs(me.id) : [];
    var isFav = favs.indexOf(id) >= 0;

    var html = '';
    if (p.image_data) html += '<img class="pd-img" src="' + p.image_data + '" onclick="event.stopPropagation();viewImage(this.src)">';
    html += '<h2 class="pd-name">' + esc(p.name) + '</h2>';
    html += '<div class="pd-author"><i class="fas fa-user"></i> ' + esc(pubName) + '</div>';
    html += '<p class="pd-desc">' + esc(p.description) + '</p>';

    // Screenshots
    var ss = p.screenshots || [];
    if (typeof ss === 'string') try { ss = JSON.parse(ss); } catch(e) { ss = []; }
    if (ss.length) {
        html += '<div class="pd-ss"><h4><i class="fas fa-images"></i> ' + (lang === 'ar' ? 'صور الشاشة' : 'Screenshots') + '</h4><div class="pd-ss-grid">';
        for (var si = 0; si < ss.length; si++) html += '<img src="' + ss[si] + '" onclick="event.stopPropagation();viewImage(this.src)" loading="lazy">';
        html += '</div></div>';
    }

    // Steps
    var steps = p.steps || [];
    if (typeof steps === 'string') try { steps = JSON.parse(steps); } catch(e) { steps = []; }
    if (steps.length) {
        html += '<div class="pd-steps"><h4><i class="fas fa-list-ol"></i> ' + (lang === 'ar' ? 'الخطوات' : 'Steps') + '</h4>';
        for (var sti = 0; sti < steps.length; sti++) {
            var st = steps[sti];
            html += '<div class="step-card"><div class="step-title">' + (lang === 'ar' ? 'خطوة ' : 'Step ') + (sti + 1) + ': ' + esc(st.name) + '</div>';
            if (st.desc) html += '<div class="step-desc">' + esc(st.desc) + '</div>';
            if (st.fileKey) html += '<button class="step-dl-btn" onclick="event.stopPropagation();downloadFile(\'' + st.fileKey + '\',\'' + esc(st.fileName || '') + '\')"><i class="fas fa-download"></i> ' + (lang === 'ar' ? 'تحميل' : 'Download') + '</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    // Reviews
    html += '<div class="pd-reviews"><h4><i class="fas fa-star"></i> ' + (lang === 'ar' ? 'التقييمات' : 'Reviews') + '</h4>';
    if (avg > 0) html += '<p style="color:var(--yellow);margin-bottom:8px">★ ' + avg.toFixed(1) + '/5 (' + revs.length + ')</p>';
    if (me) {
        html += '<div class="rev-form"><div class="star-pick" id="stars_' + id + '">';
        for (var r = 1; r <= 5; r++) html += '<i class="fas fa-star" onclick="event.stopPropagation();pickStar(\'' + id + '\',' + r + ')"></i>';
        html += '</div><textarea class="rev-input" id="revText_' + id + '" placeholder="' + (lang === 'ar' ? 'رأيك...' : 'Review...') + '"></textarea>';
        html += '<button class="btn-main btn-sm" onclick="event.stopPropagation();submitReview(\'' + id + '\')" style="align-self:flex-end">' + (lang === 'ar' ? 'إرسال' : 'Submit') + '</button></div>';
    } else {
        html += '<p style="color:var(--text2);font-size:.82rem;margin-bottom:8px">' + (lang === 'ar' ? 'سجل دخول للتقييم' : 'Login to review') + '</p>';
    }
    for (var ri = 0; ri < revs.length; ri++) {
        var rv = revs[ri];
        html += '<div class="rev-item"><div class="rev-user"><i class="fas fa-user-circle" style="color:var(--accent)"></i> ' + esc(rv.username) + ' <span class="rev-user-stars">' + '★'.repeat(rv.rating || 0) + '☆'.repeat(5 - (rv.rating || 0)) + '</span></div>';
        html += '<div class="rev-text">' + esc(rv.review_text || rv.text || '') + '</div></div>';
    }
    html += '</div>';

    // Download
    if (p.file_name) {
        html += '<div class="pd-download"><button class="btn-download" onclick="event.stopPropagation();handleDownload(\'' + id + '\')"><i class="fas fa-download"></i> ' + (lang === 'ar' ? 'تحميل ' : 'Download ') + esc(p.file_name) + '</button></div>';
    }

    // Favorite
    if (me) {
        html += '<div style="text-align:center;margin-top:8px"><button class="btn-fav ' + (isFav ? 'active' : '') + '" onclick="event.stopPropagation();toggleFav(\'' + id + '\')"><i class="fas fa-heart"></i> ' + (isFav ? (lang === 'ar' ? 'إزالة' : 'Remove') : (lang === 'ar' ? 'مفضلة' : 'Favorite')) + '</button></div>';
    }

    body.innerHTML = html;
    openMod('detailMod');
}

function viewImage(src) {
    document.getElementById('imgVS').src = src;
    document.getElementById('imgV').style.display = 'flex';
}

// ===== REVIEWS =====
function pickStar(pid, n) {
    tempRatings[pid] = n;
    var c = document.getElementById('stars_' + pid);
    if (!c) return;
    var stars = c.querySelectorAll('i');
    for (var i = 0; i < stars.length; i++) stars[i].classList.toggle('active', i < n);
}

async function submitReview(pid) {
    if (!me) return;
    var rating = tempRatings[pid] || 0;
    var text = (document.getElementById('revText_' + pid) || {}).value || '';
    if (!rating) { toast(lang === 'ar' ? 'اختر تقييم' : 'Pick rating', 'er'); return; }
    await dbAddReview({
        id: gid(), product_id: pid, user_id: me.id,
        username: me.display_name || me.username,
        rating: rating, review_text: text.trim(),
        created_at: new Date().toISOString()
    });
    delete tempRatings[pid];
    toast(lang === 'ar' ? 'شكراً! ⭐' : 'Thanks! ⭐', 'ok');
    openDetail(pid);
    renderProducts();
}

// ===== FAVORITES =====
async function toggleFav(pid) {
    if (!me) return;
    await dbToggleFav(me.id, pid);
    openDetail(pid);
}

async function showFavPage() {
    if (!me) return;
    var favIds = await dbGetFavs(me.id);
    var all = await dbGetProducts();
    var favP = [];
    for (var i = 0; i < all.length; i++) { if (favIds.indexOf(all[i].id) >= 0) favP.push(all[i]); }
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('ownerDash').style.display = 'none';
    document.getElementById('userDash').style.display = 'none';
    document.getElementById('favSection').style.display = '';
    var grid = document.getElementById('favGrid');
    var empty = document.getElementById('favEmpty');
    if (!favP.length) { grid.innerHTML = ''; empty.style.display = ''; return; }
    empty.style.display = 'none';
    var html = '';
    for (var j = 0; j < favP.length; j++) {
        var p = favP[j];
        html += '<div class="product-card" onclick="openDetail(\'' + p.id + '\')"><span class="pc-badge">' + (lang === 'ar' ? 'مجاني' : 'Free') + '</span><img class="pc-img" src="' + (p.image_data || '') + '" loading="lazy"><div class="pc-body"><div class="pc-name">' + esc(p.name) + '</div></div></div>';
    }
    grid.innerHTML = html;
}

function goHome() {
    document.getElementById('favSection').style.display = 'none';
    document.getElementById('mainSection').style.display = '';
    updateUI();
    renderProducts();
}

// ===== DOWNLOAD =====
async function handleDownload(pid) {
    var p = await dbGetProduct(pid);
    if (!p || !p.file_name) return;
    if (!LS.get('subscribed')) { showSubscribe(function() { doDownload(p); }); return; }
    doDownload(p);
}

function doDownload(p) {
    var fKey = 'file_' + p.id;
    var fData = LS.get(fKey);
    if (fData && fData.data) {
        var a = document.createElement('a');
        a.href = fData.data; a.download = fData.name || p.file_name || 'download';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        toast(lang === 'ar' ? 'جاري التحميل 📥' : 'Downloading 📥', 'ok');
    } else {
        toast(lang === 'ar' ? 'الملف غير متاح على هذا الجهاز' : 'File not on this device', 'er');
    }
}

function downloadFile(key, name) {
    var f = LS.get(key);
    if (f && f.data) {
        var a = document.createElement('a'); a.href = f.data; a.download = f.name || name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else { toast(lang === 'ar' ? 'غير متاح' : 'Not available', 'er'); }
}

// ===== SUBSCRIBE =====
async function showSubscribe(cb) {
    subCallback = cb;
    var chs = await dbGetChannels();
    var box = document.getElementById('subList');
    var html = '';
    for (var i = 0; i < chs.length; i++) {
        var c = chs[i];
        var icon = c.type === 'youtube' ? 'fab fa-youtube' : c.type === 'telegram' ? 'fab fa-telegram-plane' : c.type === 'discord' ? 'fab fa-discord' : 'fas fa-link';
        var cls = c.type === 'youtube' ? 'yt' : c.type === 'telegram' ? 'tg' : c.type === 'discord' ? 'dc' : '';
        var skip = (c.skippable || c.skip) ? '<button class="sub-skip-btn" disabled onclick="this.closest(\'.sub-row\').style.display=\'none\'">' + (lang === 'ar' ? 'تخطي' : 'Skip') + ' <span class="skip-num"></span></button>' : '';
        html += '<div class="sub-row"><a href="' + c.url + '" target="_blank" class="sub-btn ' + cls + '"><i class="' + icon + '"></i> ' + esc(c.name) + '</a>' + skip + '</div>';
    }
    box.innerHTML = html;
    openMod('subMod');

    var skipBtn = document.getElementById('skipBtn');
    var skipCD = document.getElementById('skipCD');
    skipBtn.disabled = true;
    var count = 10;
    skipCD.textContent = '(' + count + ')';
    var timer = setInterval(function() {
        count--;
        skipCD.textContent = count > 0 ? '(' + count + ')' : '';
        if (count <= 0) { clearInterval(timer); skipBtn.disabled = false; }
    }, 1000);
    skipBtn.onclick = function() {
        LS.set('subscribed', true);
        closeMod('subMod');
        if (subCallback) { subCallback(); subCallback = null; }
    };

    var skipBtns = document.querySelectorAll('.sub-skip-btn');
    for (var j = 0; j < skipBtns.length; j++) {
        (function(btn) {
            var cd = 10;
            var sp = btn.querySelector('.skip-num');
            sp.textContent = '(' + cd + ')';
            var si = setInterval(function() { cd--; sp.textContent = cd > 0 ? '(' + cd + ')' : ''; if (cd <= 0) { clearInterval(si); btn.disabled = false; } }, 1000);
        })(skipBtns[j]);
    }
}

// ============================================================
//  ADD / EDIT PRODUCT
// ============================================================
function openAddProduct() {
    if (!me) { toast(lang === 'ar' ? 'سجل دخول أولاً' : 'Login first', 'er'); openMod('authMod'); return; }
    editingId = null;
    resetAddForm();
    document.getElementById('addTitle').innerHTML = '<i class="fas fa-plus-circle"></i> ' + (lang === 'ar' ? 'إضافة منتج' : 'Add Product');
    openMod('addMod');
}

async function openEditProduct(id) {
    if (!me) return;
    editingId = id;
    resetAddForm();
    var p = await dbGetProduct(id);
    if (!p) return;
    document.getElementById('addTitle').innerHTML = '<i class="fas fa-edit"></i> ' + (lang === 'ar' ? 'تعديل' : 'Edit');
    document.getElementById('pName').value = p.name;
    document.getElementById('pDesc').value = p.description || '';
    if (p.image_data) document.getElementById('imgPv').innerHTML = '<img src="' + p.image_data + '">';
    var ss = p.screenshots || [];
    if (typeof ss === 'string') try { ss = JSON.parse(ss); } catch(e) { ss = []; }
    if (ss.length) {
        var h = '';
        for (var j = 0; j < ss.length; j++) h += '<img src="' + ss[j] + '">';
        document.getElementById('ssPv').innerHTML = h;
    }
    if (p.file_name) document.getElementById('filePv').innerHTML = '<div class="file-info"><i class="fas fa-file"></i> ' + esc(p.file_name) + '</div>';
    var steps = p.steps || [];
    if (typeof steps === 'string') try { steps = JSON.parse(steps); } catch(e) { steps = []; }
    for (var k = 0; k < steps.length; k++) {
        addStep();
        var el = document.getElementById('stepsBox').lastElementChild;
        el.querySelector('.step-name-in').value = steps[k].name || '';
        el.querySelector('.step-desc-in').value = steps[k].desc || '';
        if (steps[k].fileName) el.querySelector('.step-fn').textContent = steps[k].fileName;
    }
    openMod('addMod');
}

function resetAddForm() {
    tempImg = null; tempSS = []; tempFile = null; tempStepFiles = {}; stepCounter = 0;
    document.getElementById('addForm').reset();
    document.getElementById('imgPv').innerHTML = '';
    document.getElementById('ssPv').innerHTML = '';
    document.getElementById('filePv').innerHTML = '';
    document.getElementById('stepsBox').innerHTML = '';
    document.getElementById('publishLoader').style.display = 'none';
    document.getElementById('publishBtn').disabled = false;
}

async function deleteProduct(id) {
    confirmAction(lang === 'ar' ? 'حذف هذا المنتج؟' : 'Delete?', async function() {
        await dbDeleteProduct(id);
        closeMod('detailMod');
        await renderProducts();
        toast(lang === 'ar' ? 'تم الحذف ✓' : 'Deleted ✓', 'ok');
    });
}

function prevFile(input, pvId) {
    if (!input.files || !input.files[0]) return;
    tempImg = input.files[0];
    var reader = new FileReader();
    reader.onload = function() { document.getElementById(pvId).innerHTML = '<img src="' + reader.result + '">'; };
    reader.readAsDataURL(input.files[0]);
}

function prevFiles(input, pvId) {
    if (!input.files) return;
    tempSS = Array.from(input.files);
    var pv = document.getElementById(pvId);
    pv.innerHTML = '';
    for (var i = 0; i < input.files.length; i++) {
        (function(f) {
            var r = new FileReader();
            r.onload = function() { var img = document.createElement('img'); img.src = r.result; pv.appendChild(img); };
            r.readAsDataURL(f);
        })(input.files[i]);
    }
}

function prevMainFile(input, pvId) {
    if (!input.files || !input.files[0]) return;
    tempFile = input.files[0];
    document.getElementById(pvId).innerHTML = '<div class="file-info"><i class="fas fa-file"></i> ' + esc(tempFile.name) + ' (' + fmtSize(tempFile.size) + ')</div>';
}

function addStep() {
    stepCounter++;
    var box = document.getElementById('stepsBox');
    var div = document.createElement('div');
    div.className = 'step-item';
    div.setAttribute('data-step', stepCounter);
    div.innerHTML = '<div class="step-head"><span>' + (lang === 'ar' ? 'خطوة ' : 'Step ') + stepCounter + '</span><button type="button" onclick="this.closest(\'.step-item\').remove()"><i class="fas fa-times"></i></button></div>' +
        '<div class="field"><i class="fas fa-heading"></i><input class="step-name-in" placeholder="' + (lang === 'ar' ? 'اسم الخطوة' : 'Step name') + '" required></div>' +
        '<div class="field"><i class="fas fa-align-left"></i><textarea class="step-desc-in" placeholder="' + (lang === 'ar' ? 'الوصف' : 'Description') + '"></textarea></div>' +
        '<div class="step-file-zone" onclick="this.querySelector(\'input\').click()"><i class="fas fa-upload"></i> ' + (lang === 'ar' ? 'رفع ملف' : 'Upload') + '<span class="step-fn"></span><input type="file" onchange="handleStepFile(this,' + stepCounter + ')" hidden></div>';
    box.appendChild(div);
}

function handleStepFile(input, num) {
    if (input.files && input.files[0]) {
        tempStepFiles[num] = input.files[0];
        input.closest('.step-file-zone').querySelector('.step-fn').textContent = ' ' + input.files[0].name;
    }
}

async function doAddProduct(e) {
    e.preventDefault();
    var name = document.getElementById('pName').value.trim();
    var desc = document.getElementById('pDesc').value.trim();
    if (!name || !desc) { toast(lang === 'ar' ? 'أدخل الاسم والوصف' : 'Fill name & desc', 'er'); return; }

    var btn = document.getElementById('publishBtn');
    var loader = document.getElementById('publishLoader');
    btn.disabled = true;
    loader.style.display = 'flex';

    try {
        var existing = editingId ? await dbGetProduct(editingId) : null;

        // Compress & encode image
        var imageData = existing ? existing.image_data : null;
        if (tempImg) {
            try { imageData = await compressImage(tempImg, 600); } catch (err) { console.warn('img err'); }
        }

        // Compress screenshots
        var ssData = existing ? (existing.screenshots || []) : [];
        if (typeof ssData === 'string') try { ssData = JSON.parse(ssData); } catch(e) { ssData = []; }
        if (tempSS.length > 0) {
            ssData = [];
            for (var si = 0; si < tempSS.length; si++) {
                try { ssData.push(await compressImage(tempSS[si], 400)); } catch (err) {}
            }
        }

        // Save main file to localStorage
        var fileName = existing ? existing.file_name : null;
        var productId = editingId || gid();
        if (tempFile) {
            try {
                var fd = await toB64(tempFile);
                LS.set('file_' + productId, { name: tempFile.name, data: fd });
                fileName = tempFile.name;
            } catch (err) {
                console.warn('file save err');
                toast(lang === 'ar' ? 'الملف كبير جداً' : 'File too large', 'er');
            }
        }

        // Steps
        var stepsData = [];
        var stepEls = document.querySelectorAll('.step-item');
        for (var sj = 0; sj < stepEls.length; sj++) {
            var el = stepEls[sj];
            var sName = el.querySelector('.step-name-in').value.trim();
            var sDesc = el.querySelector('.step-desc-in').value.trim();
            var sNum = parseInt(el.getAttribute('data-step'));
            var sFk = null, sFn = null;
            var existSteps = existing ? (existing.steps || []) : [];
            if (typeof existSteps === 'string') try { existSteps = JSON.parse(existSteps); } catch(e) { existSteps = []; }
            if (existSteps[sj]) { sFk = existSteps[sj].fileKey; sFn = existSteps[sj].fileName; }
            if (tempStepFiles[sNum]) {
                try {
                    var sk = 'sf_' + gid();
                    var sd = await toB64(tempStepFiles[sNum]);
                    LS.set(sk, { name: tempStepFiles[sNum].name, data: sd });
                    sFk = sk; sFn = tempStepFiles[sNum].name;
                } catch (err) {}
            }
            if (sName) stepsData.push({ name: sName, desc: sDesc, fileKey: sFk, fileName: sFn });
        }

        var productData = {
            id: productId,
            name: name,
            description: desc,
            image_data: imageData,
            screenshots: ssData,
            file_name: fileName,
            steps: stepsData,
            user_id: me.id,
            created_at: existing ? existing.created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (editingId) {
            await dbUpdateProduct(editingId, productData);
        } else {
            await dbAddProduct(productData);
        }

        closeMod('addMod');
        await renderProducts();
        editingId = null;
        toast(lang === 'ar' ? 'تم النشر بنجاح! 🎉' : 'Published! 🎉', 'ok');

    } catch (err) {
        console.error('Publish error:', err);
        toast(lang === 'ar' ? 'حدث خطأ: ' + err.message : 'Error: ' + err.message, 'er');
    }

    btn.disabled = false;
    loader.style.display = 'none';
}

// ============================================================
//  SUPPORT
// ============================================================
async function showSupport() {
    var s = await dbGetSupport();
    var body = document.getElementById('supBody');
    if (!s.on || !s.visa) {
        body.innerHTML = '<div class="sup-unavail"><i class="fas fa-exclamation-triangle"></i><p>' + (lang === 'ar' ? 'الدعم غير متاح حالياً' : 'Support not available') + '</p></div>';
    } else {
        body.innerHTML = '<div class="sup-visa-box"><p>' + (lang === 'ar' ? 'حوّل إلى:' : 'Transfer to:') + '</p><div class="sup-visa-num" id="visaDisp">' + esc(s.visa) + '</div><button class="btn-copy" onclick="copyVisa()"><i class="fas fa-copy"></i> ' + (lang === 'ar' ? 'نسخ' : 'Copy') + '</button></div><p style="color:var(--text2);font-size:.82rem">' + (lang === 'ar' ? 'شكراً ❤️' : 'Thanks ❤️') + '</p>';
    }
    openMod('supMod');
}

function copyVisa() {
    var v = document.getElementById('visaDisp');
    if (!v) return;
    navigator.clipboard.writeText(v.textContent).then(function() { toast(lang === 'ar' ? 'تم النسخ ✓' : 'Copied ✓', 'ok'); })
    .catch(function() { toast(lang === 'ar' ? 'تم النسخ ✓' : 'Copied ✓', 'ok'); });
}

async function showSupSettings() {
    var s = await dbGetSupport();
    var body = document.getElementById('supBody');
    body.innerHTML = '<div style="text-align:start"><div class="set-row"><span>' + (lang === 'ar' ? 'تفعيل الدعم' : 'Enable') + '</span><label class="toggle"><input type="checkbox" id="supTog" ' + (s.on ? 'checked' : '') + '><span class="toggle-slider"></span></label></div><div style="margin-top:10px"><label style="font-size:.82rem;color:var(--accent);display:block;margin-bottom:4px">' + (lang === 'ar' ? 'رقم الفيزا' : 'Visa') + '</label><input class="visa-input" id="visaIn" value="' + esc(s.visa || '') + '" placeholder="XXXX XXXX XXXX XXXX"></div><button class="btn-main" style="width:100%;margin-top:14px" onclick="saveSupSettings()">' + (lang === 'ar' ? 'حفظ' : 'Save') + '</button></div>';
    openMod('supMod');
}

async function saveSupSettings() {
    var on = document.getElementById('supTog').checked;
    var visa = (document.getElementById('visaIn').value || '').trim();
    await dbSetSupport({ on: on, visa: visa });
    closeMod('supMod');
    toast(lang === 'ar' ? 'تم الحفظ ✓' : 'Saved ✓', 'ok');
}

// ============================================================
//  LOGS
// ============================================================
async function showLogs() {
    var users = await dbGetUsers();
    var normal = [];
    for (var i = 0; i < users.length; i++) { if (!users[i].is_owner) normal.push(users[i]); }
    var html = '<div class="log-stat"><div class="log-num">' + normal.length + '</div><div class="log-label">' + (lang === 'ar' ? 'مسجل' : 'Users') + '</div></div><div class="log-list">';
    for (var j = 0; j < normal.length; j++) {
        var u = normal[j];
        html += '<div class="log-item"><i class="fas fa-user-circle"></i> <strong>' + esc(u.display_name || u.username) + '</strong> @' + esc(u.username) + '<span class="log-date">' + new Date(u.created_at).toLocaleDateString() + '</span></div>';
    }
    if (!normal.length) html += '<p style="text-align:center;color:var(--text2);padding:14px">' + (lang === 'ar' ? 'لا مستخدمين' : 'No users') + '</p>';
    html += '</div>';
    document.getElementById('logsBody').innerHTML = html;
    openMod('logsMod');
}

// ============================================================
//  CHANNELS
// ============================================================
async function showChannels() {
    var chs = await dbGetChannels();
    var html = '';
    for (var i = 0; i < chs.length; i++) {
        var c = chs[i];
        html += '<div class="ch-item"><div class="ch-info"><div class="ch-name">' + esc(c.name) + '</div><div class="ch-url">' + esc(c.url) + '</div><div class="ch-type">' + c.type + '</div></div><button onclick="delChannel(\'' + c.id + '\')"><i class="fas fa-trash"></i></button></div>';
    }
    html += '<div class="ch-add-form"><input id="chN" placeholder="' + (lang === 'ar' ? 'الاسم' : 'Name') + '"><input id="chU" placeholder="URL" type="url"><select id="chT"><option value="youtube">YouTube</option><option value="telegram">Telegram</option><option value="discord">Discord</option><option value="other">Other</option></select><label style="display:flex;align-items:center;gap:4px;font-size:.75rem;color:var(--text2);width:100%"><input type="checkbox" id="chS"> ' + (lang === 'ar' ? 'تخطي' : 'Skip') + '</label><button onclick="addNewChannel()">' + (lang === 'ar' ? 'إضافة' : 'Add') + '</button></div>';
    document.getElementById('chBody').innerHTML = html;
    openMod('chMod');
}

async function addNewChannel() {
    var n = document.getElementById('chN').value.trim();
    var u = document.getElementById('chU').value.trim();
    if (!n || !u) { toast(lang === 'ar' ? 'أدخل البيانات' : 'Fill fields', 'er'); return; }
    await dbAddChannel({ id: gid(), name: n, url: u, type: document.getElementById('chT').value, skippable: document.getElementById('chS').checked });
    toast(lang === 'ar' ? 'تمت الإضافة ✓' : 'Added ✓', 'ok');
    showChannels();
}

async function delChannel(id) {
    await dbDeleteChannel(id);
    toast(lang === 'ar' ? 'تم الحذف ✓' : 'Deleted ✓', 'ok');
    showChannels();
}
