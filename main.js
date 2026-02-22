/* ===== SUPABASE ===== */
const SB_URL='https://ewlngentnaewuicjlfnr.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bG5nZW50bmFld3VpY2psZm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYwMDAwMDAsImV4cCI6MjAzMTYwMDAwMH0.placeholder';
// Note: Using the publishable key you provided - adjust if needed
let sb;
let useLocal=false;
try{
    sb=supabase.createClient(SB_URL,'sb_publishable_LTz8bGvNKGAdNWxgQSBeDw_EE01YRyB');
}catch(e){
    console.warn('Supabase failed, local mode');
    useLocal=true;
}

/* ===== CONFIG ===== */
const OWNER='3mksukuna', OWNER_PW='ben148406', MAX_SIZE=5*1024*1024*1024;

/* ===== STATE ===== */
let me=null, lang='ar', viewMode='grid', editId=null;
let tmpImg=null, tmpSS=[], tmpFile=null, tmpStepFiles={}, stepN=0, tmpRating={};

/* ===== LOCAL DB FALLBACK ===== */
const LS={
    g(k,d=null){try{const v=localStorage.getItem('itz_'+k);return v?JSON.parse(v):d}catch{return d}},
    s(k,v){try{localStorage.setItem('itz_'+k,JSON.stringify(v))}catch{}}
};

/* ===== DB LAYER ===== */
const DB={
    async getUsers(){
        if(useLocal)return LS.g('users',[]);
        const{data}=await sb.from('users').select('*');
        return data||[];
    },
    async addUser(u){
        if(useLocal){const a=LS.g('users',[]);a.push(u);LS.s('users',a);return u}
        const{data,error}=await sb.from('users').insert(u).select().single();
        if(error)throw error;
        return data;
    },
    async getProducts(){
        if(useLocal)return LS.g('products',[]);
        const{data}=await sb.from('products').select('*').order('created_at',{ascending:false});
        return data||[];
    },
    async addProduct(p){
        if(useLocal){const a=LS.g('products',[]);a.unshift(p);LS.s('products',a);return p}
        const{data,error}=await sb.from('products').insert(p).select().single();
        if(error)throw error;
        return data;
    },
    async updateProduct(id,p){
        if(useLocal){const a=LS.g('products',[]);const i=a.findIndex(x=>x.id===id);if(i>=0)a[i]={...a[i],...p};LS.s('products',a);return}
        await sb.from('products').update(p).eq('id',id);
    },
    async deleteProduct(id){
        if(useLocal){let a=LS.g('products',[]);a=a.filter(x=>x.id!==id);LS.s('products',a);return}
        await sb.from('products').delete().eq('id',id);
    },
    async getReviews(pid){
        if(useLocal){const r=LS.g('reviews',{});return r[pid]||[]}
        const{data}=await sb.from('reviews').select('*').eq('product_id',pid);
        return data||[];
    },
    async addReview(r){
        if(useLocal){const a=LS.g('reviews',{});if(!a[r.product_id])a[r.product_id]=[];
        const i=a[r.product_id].findIndex(x=>x.user_id===r.user_id);
        if(i>=0)a[r.product_id][i]=r;else a[r.product_id].push(r);LS.s('reviews',a);return}
        // Upsert
        await sb.from('reviews').upsert(r,{onConflict:'product_id,user_id'});
    },
    async deleteReviews(pid){
        if(useLocal){const a=LS.g('reviews',{});delete a[pid];LS.s('reviews',a);return}
        await sb.from('reviews').delete().eq('product_id',pid);
    },
    async getFavorites(uid){
        if(useLocal)return LS.g('fav_'+uid,[]);
        const{data}=await sb.from('favorites').select('product_id').eq('user_id',uid);
        return(data||[]).map(x=>x.product_id);
    },
    async toggleFavorite(uid,pid){
        if(useLocal){let a=LS.g('fav_'+uid,[]);if(a.includes(pid))a=a.filter(x=>x!==pid);else a.push(pid);LS.s('fav_'+uid,a);return a}
        const{data:ex}=await sb.from('favorites').select('id').eq('user_id',uid).eq('product_id',pid);
        if(ex&&ex.length>0){await sb.from('favorites').delete().eq('user_id',uid).eq('product_id',pid)}
        else{await sb.from('favorites').insert({user_id:uid,product_id:pid})}
        return this.getFavorites(uid);
    },
    async getChannels(){
        if(useLocal)return LS.g('channels',defaultCh());
        const{data}=await sb.from('channels').select('*');
        return data&&data.length?data:defaultCh();
    },
    async addChannel(c){
        if(useLocal){const a=LS.g('channels',defaultCh());a.push(c);LS.s('channels',a);return}
        await sb.from('channels').insert(c);
    },
    async deleteChannel(id){
        if(useLocal){let a=LS.g('channels',[]);a=a.filter(x=>x.id!==id);LS.s('channels',a);return}
        await sb.from('channels').delete().eq('id',id);
    },
    async getSupport(){
        if(useLocal)return LS.g('support',{enabled:false,visa_number:''});
        const{data}=await sb.from('support_settings').select('*').eq('id',1).single();
        return data||{enabled:false,visa_number:''};
    },
    async setSupport(s){
        if(useLocal){LS.s('support',s);return}
        await sb.from('support_settings').upsert({id:1,...s});
    }
};

function defaultCh(){return[
{id:gid(),name:'Itzmoroz - Telegram',url:'https://t.me/Itzmoroz',type:'telegram',skippable:true},
{id:gid(),name:'Itzmoroz - YouTube',url:'https://youtube.com/@itzmoroz?si=JrfwgGE5_Y7-CwUf',type:'youtube',skippable:false},
{id:gid(),name:'Itzmoroz - Discord',url:'https://discord.gg/7WFzk2VcU',type:'discord',skippable:true},
{id:gid(),name:'Itzshadoro - YouTube',url:'https://youtube.com/@itzshadoro?si=1YD4424OYbAF-Agk',type:'youtube',skippable:false}
]}

function gid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,8)}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded',async()=>{
    detectLang();
    await initOwner();
    checkSession();
    setTimeout(async()=>{
        document.getElementById('splashScreen').classList.add('hide');
        document.getElementById('app').style.display='';
        await renderProducts();
        updateUI();
    },2200);
    initClicks();
});

function detectLang(){
    const s=LS.g('lang');
    if(s)lang=s;
    else lang=((navigator.language||'ar').startsWith('ar'))?'ar':'en';
    applyLang();
}

function applyLang(){
    document.body.setAttribute('dir',lang==='ar'?'rtl':'ltr');
    document.documentElement.lang=lang;
    document.getElementById('langLbl').textContent=lang==='ar'?'EN':'عربي';
    const si=document.getElementById('searchIn');
    if(si)si.placeholder=lang==='ar'?'بحث عن منتج...':'Search products...';
    document.querySelectorAll('[data-'+lang+']').forEach(e=>{e.textContent=e.getAttribute('data-'+lang)});
    LS.s('lang',lang);
}

function toggleLang(){lang=lang==='ar'?'en':'ar';applyLang();renderProducts();updateUI()}

async function initOwner(){
    const users=await DB.getUsers();
    if(!users.find(u=>u.username===OWNER)){
        await DB.addUser({id:gid(),username:OWNER,password:OWNER_PW,display_name:'Owner',birthdate:'2000-01-01',is_owner:true,created_at:new Date().toISOString()});
    }
}

function checkSession(){
    const s=LS.g('session');
    if(s)DB.getUsers().then(users=>{me=users.find(u=>u.username===s.username)||null;updateUI()});
}

function initClicks(){
    document.addEventListener('click',e=>{
        if(!e.target.closest('.user-wrap'))document.getElementById('userDrop')?.classList.remove('show');
    });
    document.querySelectorAll('.overlay').forEach(o=>{
        o.addEventListener('click',e=>{if(e.target===o)o.style.display='none'});
    });
}

/* ===== MODALS ===== */
function openModal(id){document.getElementById(id).style.display='flex'}
function closeModal(id){document.getElementById(id).style.display='none'}

/* ===== AUTH ===== */
function switchAuth(t){
    document.getElementById('tabLogin').classList.toggle('active',t==='login');
    document.getElementById('tabRegister').classList.toggle('active',t==='register');
    document.getElementById('loginForm').style.display=t==='login'?'flex':'none';
    document.getElementById('registerForm').style.display=t==='register'?'flex':'none';
}

async function handleLogin(e){
    e.preventDefault();
    const u=document.getElementById('loginUser').value.trim();
    const p=document.getElementById('loginPass').value;
    const users=await DB.getUsers();
    const found=users.find(x=>x.username===u&&x.password===p);
    if(!found){toast(lang==='ar'?'اسم المستخدم أو كلمة المرور غير صحيحة':'Invalid credentials','er');return}
    me=found;LS.s('session',{username:me.username});
    closeModal('authModal');toast(lang==='ar'?'تم تسجيل الدخول':'Logged in','ok');
    updateUI();renderProducts();document.getElementById('loginForm').reset();
}

async function handleRegister(e){
    e.preventDefault();
    const u=document.getElementById('regUser').value.trim();
    const p=document.getElementById('regPass').value;
    const p2=document.getElementById('regPass2').value;
    const dn=document.getElementById('regName').value.trim();
    const bd=document.getElementById('regBirth').value;
    if(!document.getElementById('agreeTerms').checked){toast(lang==='ar'?'يجب الموافقة على الشروط':'Agree to terms','er');return}
    if(p!==p2){toast(lang==='ar'?'كلمة المرور غير متطابقة':'Passwords don\'t match','er');return}
    if(u.length<3){toast(lang==='ar'?'اسم المستخدم قصير':'Username too short','er');return}
    if(p.length<4){toast(lang==='ar'?'كلمة المرور قصيرة':'Password too short','er');return}
    const users=await DB.getUsers();
    if(users.find(x=>x.username.toLowerCase()===u.toLowerCase())){toast(lang==='ar'?'الاسم موجود بالفعل':'Username taken','er');return}
    const nu={id:gid(),username:u,password:p,display_name:dn,birthdate:bd,is_owner:false,created_at:new Date().toISOString()};
    await DB.addUser(nu);me=nu;LS.s('session',{username:me.username});
    closeModal('authModal');toast(lang==='ar'?'تم إنشاء الحساب':'Account created','ok');
    updateUI();renderProducts();document.getElementById('registerForm').reset();
}

function handleLogout(){
    me=null;LS.s('session',null);document.getElementById('userDrop')?.classList.remove('show');
    updateUI();renderProducts();toast(lang==='ar'?'تم تسجيل الخروج':'Logged out','inf');
}

/* ===== UI ===== */
function updateUI(){
    const logged=!!me, owner=me?.is_owner||me?.username===OWNER;
    document.getElementById('btnLoginH').style.display=logged?'none':'';
    document.getElementById('userWrap').style.display=logged?'':'none';
    document.getElementById('btnFav').style.display=logged?'':'none';
    if(logged)document.getElementById('userNameLbl').textContent=me.display_name||me.username;
    document.getElementById('ownerDash').style.display=owner?'':'none';
    document.getElementById('userDash').style.display=(logged&&!owner)?'':'none';
}

/* ===== SEARCH ===== */
function toggleSearch(){
    const r=document.getElementById('searchRow');
    if(r.style.display==='none'){r.style.display='flex';document.getElementById('searchIn').focus()}
    else{r.style.display='none';document.getElementById('searchIn').value='';renderProducts()}
}
async function handleSearch(){
    const q=document.getElementById('searchIn').value.trim().toLowerCase();
    const all=await DB.getProducts();
    const f=q?all.filter(p=>p.name.toLowerCase().includes(q)||p.description.toLowerCase().includes(q)):all;
    renderList(f);
}

/* ===== VIEW ===== */
function setView(m){
    viewMode=m;
    const g=document.getElementById('prodGrid');
    g.classList.toggle('list-v',m==='list');
    document.getElementById('gridBtn').classList.toggle('active',m==='grid');
    document.getElementById('listBtn').classList.toggle('active',m==='list');
}

/* ===== PRODUCTS ===== */
async function renderProducts(){
    const all=await DB.getProducts();
    renderList(all);
}

async function renderList(list){
    const g=document.getElementById('prodGrid');
    const em=document.getElementById('emptyMsg');
    if(!list.length){g.innerHTML='';em.style.display='';return}
    em.style.display='none';
    const owner=me?.is_owner||me?.username===OWNER;
    const users=await DB.getUsers();

    let html='';
    for(const p of list){
        const revs=await DB.getReviews(p.id);
        const avg=revs.length?revs.reduce((s,r)=>s+(r.rating||0),0)/revs.length:0;
        const stars=avg>0?'★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg)):'';
        const img=p.image_data||'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzBkMWIzMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZpbGw9IiM4ODk5YjAiIGZvbnQtc2l6ZT0iMTQiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        const canEdit=owner||(me&&p.user_id===me.id);
        html+=`<div class="p-card" onclick="openDetail('${p.id}')">
            ${canEdit?`<div class="p-card-acts" onclick="event.stopPropagation()">
                <button class="p-card-edit" onclick="editProd('${p.id}')"><i class="fas fa-pen"></i></button>
                <button class="p-card-del" onclick="delProd('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>`:''}
            <span class="p-badge">${lang==='ar'?'مجاني':'Free'}</span>
            <img class="p-card-img" src="${img}" loading="lazy">
            <div class="p-card-body">
                <div class="p-card-name">${esc(p.name)}</div>
                <div class="p-card-desc">${esc(p.description)}</div>
                ${stars?`<div class="p-card-stars">${stars} <span>(${avg.toFixed(1)})</span></div>`:''}
            </div></div>`;
    }
    g.innerHTML=html;
}

/* ===== DETAIL ===== */
async function openDetail(id){
    const all=await DB.getProducts();
    const p=all.find(x=>x.id===id);
    if(!p)return;
    const body=document.getElementById('detailBody');
    const revs=await DB.getReviews(id);
    const avg=revs.length?revs.reduce((s,r)=>s+(r.rating||0),0)/revs.length:0;
    const users=await DB.getUsers();
    const pub=users.find(u=>u.id===p.user_id);
    const pubName=pub?(pub.display_name||pub.username):'Unknown';
    let favs=me?await DB.getFavorites(me.id):[];
    const isFav=favs.includes(id);

    let ssHtml='';
    const screenshots=p.screenshots||[];
    if(screenshots.length){
        ssHtml=`<div class="pd-ss"><h4>${lang==='ar'?'صور الشاشة':'Screenshots'}</h4>
        <div class="pd-ss-grid">${screenshots.map(s=>`<img src="${s}" onclick="event.stopPropagation();viewImg('${s}')" loading="lazy">`).join('')}</div></div>`;
    }

    let stepsHtml='';
    const steps=p.steps||[];
    if(steps.length){
        stepsHtml=`<div class="pd-steps"><h4>${lang==='ar'?'الطرق / الخطوات':'Steps / Methods'}</h4>
        ${steps.map((s,i)=>`<div class="pd-step">
            <div class="pd-step-t">${lang==='ar'?'الخطوة':'Step'} ${i+1}: ${esc(s.name)}</div>
            <div class="pd-step-d">${esc(s.description||'')}</div>
            ${s.file_key?`<button class="pd-step-dl" onclick="event.stopPropagation();dlFile('${s.file_key}','${esc(s.file_name||'file')}')"><i class="fas fa-download"></i> ${lang==='ar'?'تحميل':'Download'} ${esc(s.file_name||'')}</button>`:''}
        </div>`).join('')}</div>`;
    }

    let revsHtml=`<div class="pd-revs"><h4>${lang==='ar'?'التقييمات':'Reviews'}</h4>
    ${avg>0?`<p style="color:var(--warn);margin-bottom:8px">★ ${avg.toFixed(1)} / 5 (${revs.length})</p>`:''}
    ${me?`<div class="rev-form">
        <div class="star-r" id="sr_${id}">${[1,2,3,4,5].map(n=>`<i class="fas fa-star" data-r="${n}" onclick="event.stopPropagation();setRat('${id}',${n})"></i>`).join('')}</div>
        <textarea class="rev-in" id="rt_${id}" placeholder="${lang==='ar'?'اكتب رأيك...':'Write your review...'}"></textarea>
        <button class="btn-main" onclick="event.stopPropagation();submitRev('${id}')" style="align-self:flex-end;padding:7px 18px;font-size:.83rem">${lang==='ar'?'إرسال':'Submit'}</button>
    </div>`:`<p style="color:var(--dim);font-size:.83rem;margin-bottom:10px">${lang==='ar'?'سجل دخول لإضافة رأيك':'Login to review'}</p>`}
    ${revs.map(r=>`<div class="rev-item"><div class="rev-user"><i class="fas fa-user-circle" style="color:var(--acc)"></i>${esc(r.username)} <span class="rev-stars">${'★'.repeat(r.rating||0)}${'☆'.repeat(5-(r.rating||0))}</span></div><div class="rev-txt">${esc(r.text||'')}</div></div>`).join('')}</div>`;

    let dlHtml='';
    if(p.file_key){
        dlHtml=`<div class="pd-dl"><button class="btn-dl" onclick="event.stopPropagation();handleDL('${id}')"><i class="fas fa-download"></i> ${lang==='ar'?'تحميل':'Download'} ${esc(p.file_name||'')}</button></div>`;
    }

    body.innerHTML=`
    ${p.image_data?`<img class="pd-img" src="${p.image_data}" onclick="event.stopPropagation();viewImg('${p.image_data}')">`:''}
    <h2 class="pd-name">${esc(p.name)}</h2>
    <div class="pd-by"><i class="fas fa-user"></i> ${lang==='ar'?'نشر بواسطة:':'By:'} ${esc(pubName)}</div>
    <p class="pd-desc">${esc(p.description)}</p>
    ${ssHtml}${stepsHtml}${revsHtml}${dlHtml}
    ${me?`<button class="btn-fav ${isFav?'on':''}" onclick="event.stopPropagation();togFav('${id}')">
        <i class="fas fa-heart"></i> ${isFav?(lang==='ar'?'إزالة من المفضلة':'Remove'):(lang==='ar'?'إضافة للمفضلة':'Add to Favorites')}
    </button>`:''}`;

    openModal('detailModal');
}

function viewImg(src){
    document.getElementById('imgViewerSrc').src=src;
    document.getElementById('imgViewer').style.display='flex';
}

/* ===== RATING ===== */
function setRat(pid,r){
    tmpRating[pid]=r;
    const c=document.getElementById('sr_'+pid);
    if(c)c.querySelectorAll('i').forEach((s,i)=>s.classList.toggle('on',i<r));
}

async function submitRev(pid){
    if(!me){toast(lang==='ar'?'سجل دخول':'Login first','er');return}
    const r=tmpRating[pid]||0;
    const t=document.getElementById('rt_'+pid)?.value.trim()||'';
    if(!r){toast(lang==='ar'?'اختر تقييم':'Select rating','er');return}
    await DB.addReview({id:gid(),product_id:pid,user_id:me.id,username:me.display_name||me.username,rating:r,text:t,created_at:new Date().toISOString()});
    delete tmpRating[pid];
    openDetail(pid);
    toast(lang==='ar'?'تم إرسال تقييمك':'Review submitted','ok');
}

/* ===== FAVORITES ===== */
async function togFav(pid){
    if(!me)return;
    await DB.toggleFavorite(me.id,pid);
    openDetail(pid);
}

async function showFavs(){
    if(!me)return;
    const favIds=await DB.getFavorites(me.id);
    const all=await DB.getProducts();
    const favs=all.filter(p=>favIds.includes(p.id));
    document.getElementById('mainSec').style.display='none';
    document.getElementById('ownerDash').style.display='none';
    document.getElementById('userDash').style.display='none';
    document.getElementById('favSec').style.display='';
    const g=document.getElementById('favGrid');
    if(!favs.length){g.innerHTML=`<div class="empty"><i class="fas fa-heart-broken"></i><p>${lang==='ar'?'لا توجد مفضلات':'No favorites'}</p></div>`;return}
    g.innerHTML=favs.map(p=>`<div class="p-card" onclick="openDetail('${p.id}')">
        <span class="p-badge">${lang==='ar'?'مجاني':'Free'}</span>
        <img class="p-card-img" src="${p.image_data||''}" loading="lazy">
        <div class="p-card-body"><div class="p-card-name">${esc(p.name)}</div></div></div>`).join('');
}

function goHome(){
    document.getElementById('favSec').style.display='none';
    document.getElementById('mainSec').style.display='';
    updateUI();renderProducts();
}

/* ===== DOWNLOAD ===== */
async function handleDL(pid){
    const all=await DB.getProducts();
    const p=all.find(x=>x.id===pid);
    if(!p||!p.file_key)return;
    if(!LS.g('subscribed')){showSubModal(()=>doDL(p));return}
    doDL(p);
}

function doDL(p){
    const f=LS.g(p.file_key);
    if(f&&f.data){
        const a=document.createElement('a');a.href=f.data;a.download=f.name||p.file_name||'download';
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        toast(lang==='ar'?'جاري التحميل...':'Downloading...','ok');
    }else{toast(lang==='ar'?'الملف غير متاح':'File not available','er')}
}

function dlFile(key,name){
    const f=LS.g(key);
    if(f&&f.data){const a=document.createElement('a');a.href=f.data;a.download=f.name||name;document.body.appendChild(a);a.click();document.body.removeChild(a)}
    else toast(lang==='ar'?'الملف غير متاح':'File not available','er');
}

/* ===== SUBSCRIBE ===== */
let subCb=null;
async function showSubModal(cb){
    subCb=cb;
    const chs=await DB.getChannels();
    const box=document.getElementById('subBtns');
    box.innerHTML=chs.map(c=>{
        const ic=c.type==='youtube'?'fab fa-youtube':c.type==='telegram'?'fab fa-telegram-plane':c.type==='discord'?'fab fa-discord':'fas fa-link';
        const cls=c.type==='youtube'?'yt':c.type==='telegram'?'tg':c.type==='discord'?'dc':'';
        const skipBtn=c.skippable?`<button class="sub-skip skip-ch" data-id="${c.id}" disabled>${lang==='ar'?'تخطي':'Skip'} <span class="scd"></span></button>`:'';
        return`<div class="sub-row"><a href="${c.url}" target="_blank" class="sub-b ${cls}"><i class="${ic}"></i>${esc(c.name)}</a>${skipBtn}</div>`;
    }).join('');
    openModal('subModal');
    const bs=document.getElementById('btnSkipSub');bs.disabled=true;
    let cd=10;const ct=document.getElementById('skipCd');ct.textContent=cd+'s';
    const iv=setInterval(()=>{cd--;ct.textContent=cd+'s';if(cd<=0){clearInterval(iv);bs.disabled=false;ct.textContent=''}},1000);
    bs.onclick=()=>{LS.s('subscribed',true);closeModal('subModal');if(subCb){subCb();subCb=null}};
    document.querySelectorAll('.skip-ch').forEach(b=>{
        let d=10;const sp=b.querySelector('.scd');sp.textContent='('+d+'s)';
        const si=setInterval(()=>{d--;sp.textContent='('+d+'s)';if(d<=0){clearInterval(si);b.disabled=false;sp.textContent=''}},1000);
        b.onclick=()=>{b.closest('.sub-row').style.display='none'};
    });
}

/* ===== ADD/EDIT PRODUCT ===== */
function openAddProduct(eid){
    if(!me){toast(lang==='ar'?'سجل دخول':'Login first','er');openModal('authModal');return}
    editId=eid||null;tmpImg=null;tmpSS=[];tmpFile=null;tmpStepFiles={};stepN=0;
    document.getElementById('addForm').reset();
    ['imgPrev','ssPrev','filePrev','stepsBox'].forEach(x=>document.getElementById(x).innerHTML='');
    document.getElementById('progWrap').style.display='none';
    if(eid){
        document.getElementById('addTitle').textContent=lang==='ar'?'تعديل المنتج':'Edit Product';
        DB.getProducts().then(all=>{
            const p=all.find(x=>x.id===eid);
            if(!p)return;
            document.getElementById('prodName').value=p.name;
            document.getElementById('prodDesc').value=p.description||'';
            if(p.image_data)document.getElementById('imgPrev').innerHTML=`<img src="${p.image_data}">`;
            if(p.screenshots?.length)document.getElementById('ssPrev').innerHTML=p.screenshots.map(s=>`<img src="${s}">`).join('');
            if(p.file_name)document.getElementById('filePrev').innerHTML=`<div class="fname"><i class="fas fa-file"></i>${esc(p.file_name)}</div>`;
            (p.steps||[]).forEach((s,i)=>{addStep();const el=document.getElementById('stepsBox').lastElementChild;
                el.querySelector('.sn').value=s.name;el.querySelector('.sd').value=s.description||'';
                if(s.file_name)el.querySelector('.sfn').textContent=s.file_name});
        });
    }else{
        document.getElementById('addTitle').textContent=lang==='ar'?'إضافة منتج':'Add Product';
    }
    openModal('addModal');
}

async function editProd(id){openAddProduct(id)}

function delProd(id){
    confirm_(lang==='ar'?'هل أنت متأكد من الحذف؟':'Delete this product?',async()=>{
        await DB.deleteProduct(id);await DB.deleteReviews(id);
        renderProducts();closeModal('detailModal');
        toast(lang==='ar'?'تم الحذف':'Deleted','ok');
    });
}

function addStep(){
    stepN++;const c=document.getElementById('stepsBox');
    const d=document.createElement('div');d.className='step-item';d.dataset.step=stepN;
    d.innerHTML=`<div class="step-hdr"><span>${lang==='ar'?'الخطوة':'Step'} ${stepN}</span><button type="button" onclick="this.closest('.step-item').remove()"><i class="fas fa-times"></i></button></div>
    <div class="field"><i class="fas fa-heading"></i><input class="sn" required><label>${lang==='ar'?'اسم الخطوة':'Step Name'}</label></div>
    <div class="field"><i class="fas fa-align-left"></i><textarea class="sd"></textarea><label>${lang==='ar'?'وصف الخطوة':'Step Description'}</label></div>
    <div class="step-fd"><i class="fas fa-upload"></i> ${lang==='ar'?'رفع ملف (اختياري)':'Upload file (optional)'}
    <span class="sfn" style="color:var(--ok);display:block;margin-top:3px"></span>
    <input type="file" onchange="onStepFile(this,${stepN})"></div>`;
    c.appendChild(d);
}

function onStepFile(inp,n){
    if(inp.files&&inp.files[0]){
        if(inp.files[0].size>MAX_SIZE){toast(lang==='ar'?'الملف كبير جداً':'File too large','er');return}
        tmpStepFiles[n]=inp.files[0];
        const fn=inp.parentElement.querySelector('.sfn');if(fn)fn.textContent=inp.files[0].name;
    }
}

function previewFile(inp,prevId,multi,type){
    if(!inp.files||!inp.files.length)return;
    const prev=document.getElementById(prevId);
    if(type==='file'){
        const f=inp.files[0];
        if(f.size>MAX_SIZE){toast(lang==='ar'?'الملف كبير جداً':'File too large','er');return}
        tmpFile=f;prev.innerHTML=`<div class="fname"><i class="fas fa-file"></i>${esc(f.name)} (${fmtSize(f.size)})</div>`;
    }else if(multi){
        tmpSS=Array.from(inp.files);prev.innerHTML='';
        for(const f of inp.files){const r=new FileReader();r.onload=()=>{const i=document.createElement('img');i.src=r.result;prev.appendChild(i)};r.readAsDataURL(f)}
    }else{
        tmpImg=inp.files[0];const r=new FileReader();r.onload=()=>prev.innerHTML=`<img src="${r.result}">`;r.readAsDataURL(inp.files[0]);
    }
}

async function handleAddProduct(e){
    e.preventDefault();
    const name=document.getElementById('prodName').value.trim();
    const desc=document.getElementById('prodDesc').value.trim();
    if(!name||!desc){toast(lang==='ar'?'أدخل الاسم والوصف':'Enter name & description','er');return}

    const pw=document.getElementById('progWrap');const pf=document.getElementById('progFill');const pt=document.getElementById('progTxt');
    pw.style.display='';const prog=v=>{pf.style.width=v+'%';pt.textContent=Math.round(v)+'%'};
    prog(0);

    try{
        let image_data=null,screenshots=[],file_key=null,file_name=null,steps=[];

        // Existing data for edit
        let existing=null;
        if(editId){const all=await DB.getProducts();existing=all.find(x=>x.id===editId)}

        if(tmpImg){prog(5);image_data=await toB64(tmpImg);prog(15)}
        else if(existing)image_data=existing.image_data;

        if(tmpSS.length){for(let i=0;i<tmpSS.length;i++){screenshots.push(await toB64(tmpSS[i]));prog(15+(i/tmpSS.length)*20)}}
        else if(existing)screenshots=existing.screenshots||[];

        prog(40);

        if(tmpFile){
            const k='file_'+gid();
            const d=await toB64(tmpFile);
            LS.s(k,{name:tmpFile.name,type:tmpFile.type,data:d,size:tmpFile.size});
            file_key=k;file_name=tmpFile.name;prog(70);
        }else if(existing){file_key=existing.file_key;file_name=existing.file_name}

        const stepEls=document.querySelectorAll('.step-item');
        for(let i=0;i<stepEls.length;i++){
            const el=stepEls[i];const sn=el.querySelector('.sn').value.trim();
            const sd=el.querySelector('.sd').value.trim();const num=parseInt(el.dataset.step);
            let sfk=null,sfn=null;
            if(tmpStepFiles[num]){
                const k='sf_'+gid();const d=await toB64(tmpStepFiles[num]);
                LS.s(k,{name:tmpStepFiles[num].name,type:tmpStepFiles[num].type,data:d,size:tmpStepFiles[num].size});
                sfk=k;sfn=tmpStepFiles[num].name;
            }else if(existing?.steps?.[i]){sfk=existing.steps[i].file_key;sfn=existing.steps[i].file_name}
            if(sn)steps.push({name:sn,description:sd,file_key:sfk,file_name:sfn});
            prog(70+(i/stepEls.length)*20);
        }

        prog(95);

        const pd={
            id:editId||gid(),name,description:desc,image_data,screenshots,file_key,file_name,
            steps,user_id:me.id,
            created_at:existing?.created_at||new Date().toISOString(),
            updated_at:new Date().toISOString()
        };

        if(editId)await DB.updateProduct(editId,pd);
        else await DB.addProduct(pd);

        prog(100);
        setTimeout(()=>{closeModal('addModal');renderProducts();pw.style.display='none';editId=null;
            toast(lang==='ar'?(editId?'تم التحديث':'تم النشر بنجاح'):(editId?'Updated':'Published'),'ok');
        },400);
    }catch(err){
        console.error(err);pw.style.display='none';
        toast(lang==='ar'?'حدث خطأ':'Error occurred','er');
    }
}

function toB64(f){return new Promise((ok,er)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=er;r.readAsDataURL(f)})}
function fmtSize(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';if(b<1073741824)return(b/1048576).toFixed(1)+'MB';return(b/1073741824).toFixed(2)+'GB'}

/* ===== SUPPORT ===== */
async function showSupport(){
    const s=await DB.getSupport();
    const body=document.getElementById('supBody');
    if(!s.enabled||!s.visa_number){
        body.innerHTML=`<div class="sup-na"><i class="fas fa-exclamation-triangle"></i><p>${lang==='ar'?'غير متاح أن تدعمنا بالفلوس الآن':'Support not available now'}</p></div>`;
    }else{
        body.innerHTML=`<div class="sup-visa"><p>${lang==='ar'?'يمكنك دعمنا بالتحويل إلى:':'Transfer to:'}</p>
        <div class="sup-visa-num" id="visaDisp">${esc(s.visa_number)}</div>
        <button class="btn-copy" onclick="copyVisa()"><i class="fas fa-copy"></i> ${lang==='ar'?'نسخ':'Copy'}</button></div>
        <p style="color:var(--dim);font-size:.83rem">${lang==='ar'?'شكراً لدعمكم! ❤️':'Thank you! ❤️'}</p>`;
    }
    openModal('supModal');
}

function copyVisa(){
    const v=document.getElementById('visaDisp')?.textContent;
    if(v)navigator.clipboard.writeText(v).then(()=>toast(lang==='ar'?'تم النسخ':'Copied','ok')).catch(()=>{
        const t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);toast(lang==='ar'?'تم النسخ':'Copied','ok')});
}

async function showSupSettings(){
    const s=await DB.getSupport();
    const body=document.getElementById('supBody');
    body.innerHTML=`<div class="sup-set" style="text-align:start">
    <div class="set-row"><span class="set-lbl">${lang==='ar'?'تفعيل الدعم':'Enable Support'}</span>
    <label class="tog"><input type="checkbox" id="supTog" ${s.enabled?'checked':''}><span class="tog-s"></span></label></div>
    <div class="visa-inp"><label style="font-size:.83rem;color:var(--acc);margin-bottom:5px;display:block">${lang==='ar'?'رقم الفيزا':'Visa Number'}</label>
    <input id="visaIn" value="${esc(s.visa_number||'')}" placeholder="XXXX XXXX XXXX XXXX"></div>
    <button class="btn-main" style="margin-top:14px;width:100%" onclick="saveSupSet()">${lang==='ar'?'حفظ':'Save'}</button></div>`;
    openModal('supModal');
}

async function saveSupSet(){
    const en=document.getElementById('supTog')?.checked||false;
    const vn=document.getElementById('visaIn')?.value.trim()||'';
    await DB.setSupport({enabled:en,visa_number:vn});
    toast(lang==='ar'?'تم الحفظ':'Saved','ok');closeModal('supModal');
}

/* ===== LOGS ===== */
async function showLogs(){
    const users=await DB.getUsers();
    const normal=users.filter(u=>!u.is_owner);
    document.getElementById('logsBody').innerHTML=`
    <div class="log-stat"><div class="log-num">${normal.length}</div><div class="log-lbl">${lang==='ar'?'حسابات مسجلة':'Registered'}</div></div>
    <div class="log-list">${normal.map(u=>`<div class="log-item"><i class="fas fa-user-circle"></i>
    <span class="log-name">${esc(u.display_name||u.username)} (@${esc(u.username)})</span>
    <span class="log-date">${new Date(u.created_at).toLocaleDateString()}</span></div>`).join('')||`<p style="text-align:center;color:var(--dim);padding:18px">${lang==='ar'?'لا يوجد':'None'}</p>`}</div>`;
    openModal('logsModal');
}

/* ===== CHANNELS ===== */
async function showChannels(){
    const chs=await DB.getChannels();
    document.getElementById('chBody').innerHTML=`
    ${chs.map(c=>`<div class="ch-item"><div class="ch-info">
    <div class="ch-name">${esc(c.name)}</div><div class="ch-url">${esc(c.url)}</div>
    <div class="ch-type">${c.type} ${c.skippable?(lang==='ar'?'(قابل للتخطي)':'(skippable)'):''}</div>
    </div><button onclick="delCh('${c.id}')"><i class="fas fa-trash"></i></button></div>`).join('')}
    <div class="ch-add">
    <input id="chName" placeholder="${lang==='ar'?'اسم القناة':'Channel Name'}">
    <input id="chUrl" placeholder="${lang==='ar'?'الرابط':'URL'}" type="url">
    <select id="chType"><option value="youtube">YouTube</option><option value="telegram">Telegram</option><option value="discord">Discord</option><option value="other">Other</option></select>
    <label style="display:flex;align-items:center;gap:4px;font-size:.78rem;color:var(--dim);width:100%"><input type="checkbox" id="chSkip"> ${lang==='ar'?'قابل للتخطي':'Skippable'}</label>
    <button onclick="addCh()">${lang==='ar'?'إضافة':'Add'}</button></div>`;
    openModal('chModal');
}

async function addCh(){
    const n=document.getElementById('chName').value.trim();
    const u=document.getElementById('chUrl').value.trim();
    const t=document.getElementById('chType').value;
    const s=document.getElementById('chSkip').checked;
    if(!n||!u){toast(lang==='ar'?'أدخل الاسم والرابط':'Enter name & URL','er');return}
    await DB.addChannel({id:gid(),name:n,url:u,type:t,skippable:s});
    toast(lang==='ar'?'تم الإضافة':'Added','ok');showChannels();
}

async function delCh(id){
    await DB.deleteChannel(id);toast(lang==='ar'?'تم الحذف':'Deleted','ok');showChannels();
}

/* ===== TOAST ===== */
function toast(msg,type='inf'){
    const c=document.getElementById('toasts');
    const t=document.createElement('div');
    t.className='toast '+type;
    const ic=type==='ok'?'fa-check-circle':type==='er'?'fa-exclamation-circle':'fa-info-circle';
    t.innerHTML=`<i class="fas ${ic}"></i> ${msg}`;c.appendChild(t);
    setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),300)},3000);
}

/* ===== CONFIRM ===== */
function confirm_(msg,onYes){
    document.getElementById('confirmMsg').textContent=msg;
    openModal('confirmBox');
    document.getElementById('confirmYes').onclick=()=>{closeModal('confirmBox');onYes()};
    document.getElementById('confirmNo').onclick=()=>closeModal('confirmBox');
}

/* ===== UTILS ===== */
function esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=s;return d.innerHTML}
