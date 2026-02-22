// ========== CONFIG ==========
const SB_URL='https://ewlngentnaewuicjlfnr.supabase.co';
const SB_KEY='sb_publishable_LTz8bGvNKGAdNWxgQSBeDw_EE01YRyB';
const OWNER='3mksukuna';
const OWNER_PW='ben148406';
const MAX_FILE=5*1024*1024*1024;

// ========== STATE ==========
let me=null;
let lang='ar';
let vm='g';
let edId=null;
let _img=null;
let _ss=[];
let _file=null;
let _sf={};
let _sn=0;
let _rat={};
let _subCb=null;
let _products=[];
let _users=[];

// ========== LOCAL DB ==========
const L={
    g(k,d=null){try{let v=localStorage.getItem('iz_'+k);return v?JSON.parse(v):d}catch{return d}},
    s(k,v){try{localStorage.setItem('iz_'+k,JSON.stringify(v))}catch{}},
    d(k){try{localStorage.removeItem('iz_'+k)}catch{}}
};

// ========== HELPERS ==========
function gid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}
function esc(s){if(!s)return'';let d=document.createElement('div');d.textContent=s;return d.innerHTML}
function fmtSz(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';if(b<1073741824)return(b/1048576).toFixed(1)+'MB';return(b/1073741824).toFixed(2)+'GB'}
function toB64(f){return new Promise((r,e)=>{let rd=new FileReader();rd.onload=()=>r(rd.result);rd.onerror=e;rd.readAsDataURL(f)})}
function om(id){document.getElementById(id).style.display='flex'}
function cm(id){document.getElementById(id).style.display='none'}

// ========== TOAST ==========
function ts(msg,type='inf'){
    let c=document.getElementById('toasts');
    let t=document.createElement('div');
    t.className='tst '+type;
    let ic=type==='ok'?'fa-check-circle':type==='er'?'fa-exclamation-circle':'fa-info-circle';
    t.innerHTML='<i class="fas '+ic+'"></i> '+msg;
    c.appendChild(t);
    setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),200)},2500);
}

// ========== CONFIRM ==========
function cfm(msg,fn){
    document.getElementById('cfmMsg').textContent=msg;
    om('cfmMod');
    document.getElementById('cfmY').onclick=()=>{cm('cfmMod');fn()};
    document.getElementById('cfmN').onclick=()=>cm('cfmMod');
}

// ========== DATA ==========
function loadUsers(){_users=L.g('users',[]);return _users}
function saveUsers(){L.s('users',_users)}
function loadProducts(){_products=L.g('products',[]);return _products}
function saveProducts(){L.s('products',_products)}

function getRevs(pid){let r=L.g('reviews',{});return r[pid]||[]}
function saveRev(pid,rev){let r=L.g('reviews',{});if(!r[pid])r[pid]=[];let i=r[pid].findIndex(x=>x.uid===rev.uid);if(i>=0)r[pid][i]=rev;else r[pid].push(rev);L.s('reviews',r)}
function delRevs(pid){let r=L.g('reviews',{});delete r[pid];L.s('reviews',r)}

function getFavs(){if(!me)return[];return L.g('fav_'+me.id,[])}
function saveFavs(f){if(!me)return;L.s('fav_'+me.id,f)}

function getChannels(){return L.g('channels',defCh())}
function saveChannels(c){L.s('channels',c)}

function getSup(){return L.g('support',{on:false,visa:''})}
function saveSup(s){L.s('support',s)}

function defCh(){return[
{id:'c1',name:'Itzmoroz - Telegram',url:'https://t.me/Itzmoroz',type:'telegram',skip:true},
{id:'c2',name:'Itzmoroz - YouTube',url:'https://youtube.com/@itzmoroz?si=JrfwgGE5_Y7-CwUf',type:'youtube',skip:false},
{id:'c3',name:'Itzmoroz - Discord',url:'https://discord.gg/7WFzk2VcU',type:'discord',skip:true},
{id:'c4',name:'Itzshadoro - YouTube',url:'https://youtube.com/@itzshadoro?si=1YD4424OYbAF-Agk',type:'youtube',skip:false}
]}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded',()=>{
    detectLang();
    initOwner();
    checkSession();
    setTimeout(()=>{
        document.getElementById('splash').classList.add('h');
        document.getElementById('app').style.display='';
        render();
        upUI();
    },2000);
    document.addEventListener('click',e=>{
        if(!e.target.closest('.uw'))document.getElementById('ud')?.classList.remove('sh');
    });
    document.querySelectorAll('.ov').forEach(o=>{
        o.addEventListener('click',e=>{if(e.target===o)o.style.display='none'});
    });
});

function detectLang(){
    let s=L.g('lang');
    if(s)lang=s;
    else lang=(navigator.language||'ar').startsWith('ar')?'ar':'en';
    applyLang();
}

function applyLang(){
    document.body.setAttribute('dir',lang==='ar'?'rtl':'ltr');
    document.documentElement.lang=lang;
    document.getElementById('lgL').textContent=lang==='ar'?'EN':'عربي';
    let si=document.getElementById('srIn');
    if(si)si.placeholder=lang==='ar'?'بحث عن منتج...':'Search products...';
    document.querySelectorAll('[data-'+lang+']').forEach(e=>e.textContent=e.getAttribute('data-'+lang));
    L.s('lang',lang);
}

function tgLang(){lang=lang==='ar'?'en':'ar';applyLang();render()}

function initOwner(){
    loadUsers();
    if(!_users.find(u=>u.username===OWNER)){
        _users.push({id:'owner01',username:OWNER,password:OWNER_PW,dname:'Owner',birth:'2000-01-01',owner:true,cat:new Date().toISOString()});
        saveUsers();
    }
}

function checkSession(){
    let s=L.g('session');
    if(s){
        loadUsers();
        me=_users.find(u=>u.username===s.u)||null;
    }
    upUI();
}

// ========== AUTH ==========
function sAuth(t){
    document.getElementById('tLog').classList.toggle('on',t==='l');
    document.getElementById('tReg').classList.toggle('on',t==='r');
    document.getElementById('fLog').style.display=t==='l'?'flex':'none';
    document.getElementById('fReg').style.display=t==='r'?'flex':'none';
}

function doLogin(e){
    e.preventDefault();
    let u=document.getElementById('lU').value.trim();
    let p=document.getElementById('lP').value;
    loadUsers();
    let found=_users.find(x=>x.username===u&&x.password===p);
    if(!found){ts(lang==='ar'?'بيانات غلط':'Invalid credentials','er');return}
    me=found;
    L.s('session',{u:me.username});
    cm('authMod');
    ts(lang==='ar'?'تم الدخول':'Logged in','ok');
    upUI();render();
    document.getElementById('fLog').reset();
}

function doRegister(e){
    e.preventDefault();
    let u=document.getElementById('rU').value.trim();
    let p=document.getElementById('rP').value;
    let p2=document.getElementById('rP2').value;
    let dn=document.getElementById('rN').value.trim();
    let bd=document.getElementById('rB').value;

    if(!document.getElementById('agree').checked){
        ts(lang==='ar'?'وافق على الشروط':'Agree to terms','er');return;
    }
    if(p!==p2){ts(lang==='ar'?'كلمة المرور غير متطابقة':'Passwords don\'t match','er');return}
    if(u.length<3){ts(lang==='ar'?'الاسم قصير (3 أحرف على الأقل)':'Username too short','er');return}
    if(p.length<4){ts(lang==='ar'?'كلمة المرور قصيرة':'Password too short','er');return}

    loadUsers();

    if(_users.find(x=>x.username.toLowerCase()===u.toLowerCase())){
        ts(lang==='ar'?'الاسم موجود بالفعل':'Username taken','er');return;
    }

    let nu={
        id:gid(),
        username:u,
        password:p,
        dname:dn||u,
        birth:bd,
        owner:false,
        cat:new Date().toISOString()
    };

    _users.push(nu);
    saveUsers();

    me=nu;
    L.s('session',{u:me.username});
    cm('authMod');
    ts(lang==='ar'?'تم إنشاء الحساب بنجاح!':'Account created!','ok');
    upUI();render();
    document.getElementById('fReg').reset();
}

function logout(){
    me=null;
    L.s('session',null);
    document.getElementById('ud')?.classList.remove('sh');
    upUI();render();
    ts(lang==='ar'?'تم الخروج':'Logged out','inf');
}

// ========== UI ==========
function upUI(){
    let logged=!!me;
    let owner=me?.owner||me?.username===OWNER;
    document.getElementById('bLH').style.display=logged?'none':'';
    document.getElementById('uw').style.display=logged?'':'none';
    document.getElementById('bFav').style.display=logged?'':'none';
    if(logged)document.getElementById('uNm').textContent=me.dname||me.username;
    document.getElementById('oDash').style.display=owner?'':'none';
    document.getElementById('uDash').style.display=(logged&&!owner)?'':'none';
}

// ========== SEARCH ==========
function tgSrch(){
    let b=document.getElementById('srBar');
    if(b.style.display==='none'){
        b.style.display='flex';
        document.getElementById('srIn').focus();
    }else{
        b.style.display='none';
        document.getElementById('srIn').value='';
        render();
    }
}

function doSearch(){
    let q=document.getElementById('srIn').value.trim().toLowerCase();
    loadProducts();
    if(!q){renderList(_products);return}
    let f=_products.filter(p=>
        p.name.toLowerCase().includes(q)||
        (p.desc||'').toLowerCase().includes(q)
    );
    renderList(f);
}

// ========== VIEW ==========
function sV(m){
    vm=m;
    let g=document.getElementById('pGrid');
    g.classList.toggle('lv',m==='l');
    document.getElementById('gBtn').classList.toggle('on',m==='g');
    document.getElementById('lBtn').classList.toggle('on',m==='l');
}

// ========== RENDER ==========
function render(){
    loadProducts();
    renderList(_products);
}

function renderList(list){
    let g=document.getElementById('pGrid');
    let em=document.getElementById('empM');
    if(!list.length){
        g.innerHTML='';
        em.style.display='';
        return;
    }
    em.style.display='none';
    let owner=me?.owner||me?.username===OWNER;
    let html='';

    for(let p of list){
        let revs=getRevs(p.id);
        let avg=revs.length?revs.reduce((s,r)=>s+(r.rat||0),0)/revs.length:0;
        let stars=avg>0?'★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg)):'';
        let img=p.img||'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzBkMWIzMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzg4OTliMCIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
        let canEdit=owner||(me&&p.uid===me.id);

        html+=`<div class="pc" onclick="openDet('${p.id}')">
            ${canEdit?`<div class="pc-a" onclick="event.stopPropagation()">
                <button class="pc-e" onclick="editP('${p.id}')"><i class="fas fa-pen"></i></button>
                <button class="pc-x" onclick="delP('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>`:''}
            <span class="pc-bg">${lang==='ar'?'مجاني':'Free'}</span>
            <img class="pc-img" src="${img}" loading="lazy" alt="">
            <div class="pc-b">
                <div class="pc-n">${esc(p.name)}</div>
                <div class="pc-d">${esc(p.desc)}</div>
                ${stars?`<div class="pc-s">${stars} (${avg.toFixed(1)})</div>`:''}
            </div>
        </div>`;
    }
    g.innerHTML=html;
}

// ========== DETAIL ==========
function openDet(id){
    loadProducts();
    let p=_products.find(x=>x.id===id);
    if(!p)return;
    let body=document.getElementById('detB');
    let revs=getRevs(id);
    let avg=revs.length?revs.reduce((s,r)=>s+(r.rat||0),0)/revs.length:0;
    loadUsers();
    let pub=_users.find(u=>u.id===p.uid);
    let pubN=pub?(pub.dname||pub.username):'Unknown';
    let favs=getFavs();
    let isF=favs.includes(id);
    let ss=p.ss||[];
    let steps=p.steps||[];

    let ssH='';
    if(ss.length){
        ssH=`<div class="pd-ss"><h4>${lang==='ar'?'صور الشاشة':'Screenshots'}</h4>
        <div class="pd-ssg">${ss.map(s=>`<img src="${s}" onclick="event.stopPropagation();vImg('${s}')" loading="lazy">`).join('')}</div></div>`;
    }

    let stH='';
    if(steps.length){
        stH=`<div class="pd-st"><h4>${lang==='ar'?'الخطوات':'Steps'}</h4>
        ${steps.map((s,i)=>`<div class="pd-s">
            <div class="pd-st-t">${lang==='ar'?'خطوة':'Step'} ${i+1}: ${esc(s.name)}</div>
            ${s.desc?`<div class="pd-st-d">${esc(s.desc)}</div>`:''}
            ${s.fk?`<button class="pd-st-b" onclick="event.stopPropagation();dlF('${s.fk}','${esc(s.fn||'')}')"><i class="fas fa-download"></i> ${lang==='ar'?'تحميل':'Download'}</button>`:''}
        </div>`).join('')}</div>`;
    }

    let rvH=`<div class="pd-rv"><h4>${lang==='ar'?'التقييمات':'Reviews'}</h4>
    ${avg>0?`<p style="color:var(--w);margin-bottom:6px">★ ${avg.toFixed(1)}/5 (${revs.length})</p>`:''}
    ${me?`<div class="rvf">
        <div class="str" id="sr_${id}">${[1,2,3,4,5].map(n=>`<i class="fas fa-star" data-r="${n}" onclick="event.stopPropagation();sRat('${id}',${n})"></i>`).join('')}</div>
        <textarea class="rvi" id="rt_${id}" placeholder="${lang==='ar'?'رأيك...':'Your review...'}"></textarea>
        <button class="btn1" onclick="event.stopPropagation();subRev('${id}')" style="align-self:flex-end;padding:6px 16px;font-size:.8rem">${lang==='ar'?'إرسال':'Submit'}</button>
    </div>`:`<p style="color:var(--td);font-size:.8rem;margin-bottom:8px">${lang==='ar'?'سجل دخول للتقييم':'Login to review'}</p>`}
    ${revs.map(r=>`<div class="rve"><div class="rvu"><i class="fas fa-user-circle" style="color:var(--a)"></i>${esc(r.uname)} <span class="rvs">${'★'.repeat(r.rat||0)}${'☆'.repeat(5-(r.rat||0))}</span></div><div class="rvt">${esc(r.txt||'')}</div></div>`).join('')}</div>`;

    let dlH='';
    if(p.fk){
        dlH=`<div class="pd-dl"><button class="bdl" onclick="event.stopPropagation();hDL('${id}')"><i class="fas fa-download"></i> ${lang==='ar'?'تحميل':'Download'} ${esc(p.fn||'')}</button></div>`;
    }

    body.innerHTML=`
    ${p.img?`<img class="pd-img" src="${p.img}" onclick="event.stopPropagation();vImg('${p.img}')">`:''}
    <h2 class="pd-n">${esc(p.name)}</h2>
    <div class="pd-by"><i class="fas fa-user"></i>${lang==='ar'?'بواسطة':'By'} ${esc(pubN)}</div>
    <p class="pd-d">${esc(p.desc)}</p>
    ${ssH}${stH}${rvH}${dlH}
    ${me?`<button class="bfv ${isF?'on':''}" onclick="event.stopPropagation();tgFav('${id}')">
        <i class="fas fa-heart"></i> ${isF?(lang==='ar'?'إزالة':'Remove'):(lang==='ar'?'مفضلة':'Favorite')}
    </button>`:''}`;

    om('detMod');
}

function vImg(s){document.getElementById('imgVS').src=s;document.getElementById('imgV').style.display='flex'}

// ========== RATING ==========
function sRat(pid,r){
    _rat[pid]=r;
    let c=document.getElementById('sr_'+pid);
    if(c)c.querySelectorAll('i').forEach((s,i)=>s.classList.toggle('on',i<r));
}

function subRev(pid){
    if(!me){ts(lang==='ar'?'سجل دخول':'Login first','er');return}
    let r=_rat[pid]||0;
    let t=(document.getElementById('rt_'+pid)?.value||'').trim();
    if(!r){ts(lang==='ar'?'اختر تقييم':'Select rating','er');return}
    saveRev(pid,{uid:me.id,uname:me.dname||me.username,rat:r,txt:t});
    delete _rat[pid];
    openDet(pid);
    ts(lang==='ar'?'تم التقييم':'Submitted','ok');
}

// ========== FAVORITES ==========
function tgFav(pid){
    if(!me)return;
    let f=getFavs();
    if(f.includes(pid))f=f.filter(x=>x!==pid);
    else f.push(pid);
    saveFavs(f);
    openDet(pid);
}

function showFavs(){
    if(!me)return;
    let fIds=getFavs();
    loadProducts();
    let favP=_products.filter(p=>fIds.includes(p.id));
    document.getElementById('mnSec').style.display='none';
    document.getElementById('oDash').style.display='none';
    document.getElementById('uDash').style.display='none';
    document.getElementById('favSec').style.display='';
    let g=document.getElementById('fGrid');
    if(!favP.length){
        g.innerHTML=`<div class="emp"><i class="fas fa-heart-broken"></i><p>${lang==='ar'?'لا مفضلات':'No favorites'}</p></div>`;
        return;
    }
    g.innerHTML=favP.map(p=>`<div class="pc" onclick="openDet('${p.id}')">
        <span class="pc-bg">${lang==='ar'?'مجاني':'Free'}</span>
        <img class="pc-img" src="${p.img||''}" loading="lazy">
        <div class="pc-b"><div class="pc-n">${esc(p.name)}</div></div>
    </div>`).join('');
}

function goHome(){
    document.getElementById('favSec').style.display='none';
    document.getElementById('mnSec').style.display='';
    upUI();render();
}

// ========== DOWNLOAD ==========
function hDL(pid){
    loadProducts();
    let p=_products.find(x=>x.id===pid);
    if(!p||!p.fk)return;
    if(!L.g('subbed')){showSub(()=>doDL(p));return}
    doDL(p);
}

function doDL(p){
    let f=L.g(p.fk);
    if(f&&f.data){
        let a=document.createElement('a');
        a.href=f.data;
        a.download=f.name||p.fn||'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        ts(lang==='ar'?'جاري التحميل':'Downloading','ok');
    }else{
        ts(lang==='ar'?'الملف غير متاح':'File not available','er');
    }
}

function dlF(key,name){
    let f=L.g(key);
    if(f&&f.data){let a=document.createElement('a');a.href=f.data;a.download=f.name||name;document.body.appendChild(a);a.click();document.body.removeChild(a)}
    else ts(lang==='ar'?'غير متاح':'Not available','er');
}

// ========== SUBSCRIBE ==========
function showSub(cb){
    _subCb=cb;
    let chs=getChannels();
    let box=document.getElementById('subList');
    box.innerHTML=chs.map(c=>{
        let ic=c.type==='youtube'?'fab fa-youtube':c.type==='telegram'?'fab fa-telegram-plane':c.type==='discord'?'fab fa-discord':'fas fa-link';
        let cls=c.type==='youtube'?'yt':c.type==='telegram'?'tg':c.type==='discord'?'dc':'';
        let sk=c.skip?`<button class="ssk skc" data-id="${c.id}" disabled>${lang==='ar'?'تخطي':'Skip'} <span class="scd"></span></button>`:'';
        return`<div class="sb-r"><a href="${c.url}" target="_blank" class="sb ${cls}"><i class="${ic}"></i>${esc(c.name)}</a>${sk}</div>`;
    }).join('');
    om('subMod');
    let bs=document.getElementById('skipBtn');
    bs.disabled=true;
    let cd=10;
    let ct=document.getElementById('skT');
    ct.textContent=cd+'s';
    let iv=setInterval(()=>{cd--;ct.textContent=cd+'s';if(cd<=0){clearInterval(iv);bs.disabled=false;ct.textContent=''}},1000);
    bs.onclick=()=>{L.s('subbed',true);cm('subMod');if(_subCb){_subCb();_subCb=null}};
    document.querySelectorAll('.skc').forEach(b=>{
        let d=10;let sp=b.querySelector('.scd');sp.textContent='('+d+'s)';
        let si=setInterval(()=>{d--;sp.textContent='('+d+'s)';if(d<=0){clearInterval(si);b.disabled=false;sp.textContent=''}},1000);
        b.onclick=()=>{b.closest('.sb-r').style.display='none'};
    });
}

// ========== ADD / EDIT PRODUCT ==========
function openAdd(eid){
    if(!me){ts(lang==='ar'?'سجل دخول':'Login first','er');om('authMod');return}
    edId=eid||null;
    _img=null;_ss=[];_file=null;_sf={};_sn=0;
    document.getElementById('addFrm').reset();
    document.getElementById('ipv').innerHTML='';
    document.getElementById('spv').innerHTML='';
    document.getElementById('fpv').innerHTML='';
    document.getElementById('stBox').innerHTML='';
    document.getElementById('pubLoad').style.display='none';
    document.getElementById('pubBtn').disabled=false;

    if(eid){
        document.getElementById('addTtl').textContent=lang==='ar'?'تعديل':'Edit';
        loadProducts();
        let p=_products.find(x=>x.id===eid);
        if(p){
            document.getElementById('pN').value=p.name;
            document.getElementById('pD').value=p.desc||'';
            if(p.img)document.getElementById('ipv').innerHTML=`<img src="${p.img}">`;
            if(p.ss?.length)document.getElementById('spv').innerHTML=p.ss.map(s=>`<img src="${s}">`).join('');
            if(p.fn)document.getElementById('fpv').innerHTML=`<div class="fn"><i class="fas fa-file"></i>${esc(p.fn)}</div>`;
            if(p.steps){
                p.steps.forEach(s=>{
                    addSt();
                    let el=document.getElementById('stBox').lastElementChild;
                    el.querySelector('.sn').value=s.name||'';
                    el.querySelector('.sd').value=s.desc||'';
                    if(s.fn)el.querySelector('.sfn').textContent=s.fn;
                });
            }
        }
    }else{
        document.getElementById('addTtl').textContent=lang==='ar'?'إضافة منتج':'Add Product';
    }
    om('addMod');
}

function editP(id){openAdd(id)}

function delP(id){
    cfm(lang==='ar'?'حذف هذا المنتج؟':'Delete this product?',()=>{
        loadProducts();
        _products=_products.filter(x=>x.id!==id);
        saveProducts();
        delRevs(id);
        render();
        cm('detMod');
        ts(lang==='ar'?'تم الحذف':'Deleted','ok');
    });
}

function addSt(){
    _sn++;
    let c=document.getElementById('stBox');
    let d=document.createElement('div');
    d.className='sti';
    d.dataset.s=_sn;
    d.innerHTML=`<div class="sti-h"><span>${lang==='ar'?'خطوة':'Step'} ${_sn}</span><button type="button" onclick="this.closest('.sti').remove()"><i class="fas fa-times"></i></button></div>
    <div class="fg"><i class="fas fa-heading"></i><input class="sn" required><label>${lang==='ar'?'اسم الخطوة':'Step Name'}</label></div>
    <div class="fg"><i class="fas fa-align-left"></i><textarea class="sd"></textarea><label>${lang==='ar'?'وصف':'Description'}</label></div>
    <div class="sfd"><i class="fas fa-upload"></i> ${lang==='ar'?'رفع ملف (اختياري)':'Upload file (optional)'}
    <span class="sfn"></span>
    <input type="file" onchange="oSF(this,${_sn})"></div>`;
    c.appendChild(d);
}

function oSF(inp,n){
    if(inp.files&&inp.files[0]){
        if(inp.files[0].size>MAX_FILE){ts(lang==='ar'?'كبير جداً':'Too large','er');return}
        _sf[n]=inp.files[0];
        let fn=inp.parentElement.querySelector('.sfn');
        if(fn)fn.textContent=inp.files[0].name;
    }
}

function pvF(inp,prevId,multi,type){
    if(!inp.files||!inp.files.length)return;
    let pv=document.getElementById(prevId);
    if(type==='f'){
        let f=inp.files[0];
        if(f.size>MAX_FILE){ts(lang==='ar'?'كبير جداً':'Too large','er');return}
        _file=f;
        pv.innerHTML=`<div class="fn"><i class="fas fa-file"></i>${esc(f.name)} (${fmtSz(f.size)})</div>`;
    }else if(multi){
        _ss=Array.from(inp.files);
        pv.innerHTML='';
        for(let f of inp.files){
            let r=new FileReader();
            r.onload=()=>{let i=document.createElement('img');i.src=r.result;pv.appendChild(i)};
            r.readAsDataURL(f);
        }
    }else{
        _img=inp.files[0];
        let r=new FileReader();
        r.onload=()=>pv.innerHTML=`<img src="${r.result}">`;
        r.readAsDataURL(inp.files[0]);
    }
}

async function doAdd(e){
    e.preventDefault();
    let name=document.getElementById('pN').value.trim();
    let desc=document.getElementById('pD').value.trim();
    if(!name||!desc){ts(lang==='ar'?'أدخل الاسم والوصف':'Enter name & desc','er');return}

    let btn=document.getElementById('pubBtn');
    let load=document.getElementById('pubLoad');
    btn.disabled=true;
    load.style.display='flex';

    try{
        loadProducts();
        let existing=null;
        if(edId)existing=_products.find(x=>x.id===edId);

        // Image
        let img=existing?.img||null;
        if(_img){
            try{img=await toB64(_img)}catch(err){console.warn('img err',err)}
        }

        // Screenshots
        let ss=existing?.ss||[];
        if(_ss.length){
            ss=[];
            for(let f of _ss){
                try{ss.push(await toB64(f))}catch(err){console.warn('ss err',err)}
            }
        }

        // Main file
        let fk=existing?.fk||null;
        let fn=existing?.fn||null;
        if(_file){
            try{
                let k='f_'+gid();
                let d=await toB64(_file);
                L.s(k,{name:_file.name,type:_file.type,data:d,size:_file.size});
                fk=k;fn=_file.name;
            }catch(err){
                console.warn('file err',err);
                ts(lang==='ar'?'الملف كبير جداً للتخزين':'File too large to store','er');
            }
        }

        // Steps
        let steps=[];
        let stEls=document.querySelectorAll('.sti');
        for(let i=0;i<stEls.length;i++){
            let el=stEls[i];
            let sname=el.querySelector('.sn').value.trim();
            let sdesc=el.querySelector('.sd').value.trim();
            let num=parseInt(el.dataset.s);
            let sfk=null,sfn=null;
            if(existing?.steps?.[i]){sfk=existing.steps[i].fk;sfn=existing.steps[i].fn}
            if(_sf[num]){
                try{
                    let k='sf_'+gid();
                    let d=await toB64(_sf[num]);
                    L.s(k,{name:_sf[num].name,type:_sf[num].type,data:d,size:_sf[num].size});
                    sfk=k;sfn=_sf[num].name;
                }catch(err){console.warn('step file err',err)}
            }
            if(sname)steps.push({name:sname,desc:sdesc,fk:sfk,fn:sfn});
        }

        let pd={
            id:edId||gid(),
            name:name,
            desc:desc,
            img:img,
            ss:ss,
            fk:fk,
            fn:fn,
            steps:steps,
            uid:me.id,
            cat:existing?.cat||new Date().toISOString(),
            uat:new Date().toISOString()
        };

        if(edId){
            let idx=_products.findIndex(x=>x.id===edId);
            if(idx>=0)_products[idx]=pd;
        }else{
            _products.unshift(pd);
        }

        saveProducts();
        cm('addMod');
        render();
        edId=null;
        ts(lang==='ar'?'تم النشر بنجاح!':'Published!','ok');

    }catch(err){
        console.error('Add product error:',err);
        ts(lang==='ar'?'حدث خطأ':'Error occurred','er');
    }finally{
        btn.disabled=false;
        load.style.display='none';
    }
}

// ========== SUPPORT ==========
function showSup(){
    let s=getSup();
    let body=document.getElementById('supB');
    if(!s.on||!s.visa){
        body.innerHTML=`<div class="sna"><i class="fas fa-exclamation-triangle"></i><p>${lang==='ar'?'الدعم غير متاح حالياً':'Support not available now'}</p></div>`;
    }else{
        body.innerHTML=`<div class="svs"><p>${lang==='ar'?'حوّل إلى:':'Transfer to:'}</p>
        <div class="svn" id="vDisp">${esc(s.visa)}</div>
        <button class="bcp" onclick="cpV()"><i class="fas fa-copy"></i> ${lang==='ar'?'نسخ':'Copy'}</button></div>
        <p style="color:var(--td);font-size:.8rem">${lang==='ar'?'شكراً ❤️':'Thank you ❤️'}</p>`;
    }
    om('supMod');
}

function cpV(){
    let v=document.getElementById('vDisp')?.textContent;
    if(v){
        navigator.clipboard.writeText(v).then(()=>ts(lang==='ar'?'تم النسخ':'Copied','ok'))
        .catch(()=>{let t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);ts(lang==='ar'?'تم النسخ':'Copied','ok')});
    }
}

function showSupSet(){
    let s=getSup();
    let body=document.getElementById('supB');
    body.innerHTML=`<div class="sst" style="text-align:start">
    <div class="sr-r"><span class="sr-l">${lang==='ar'?'تفعيل الدعم':'Enable'}</span>
    <label class="tg"><input type="checkbox" id="sTog" ${s.on?'checked':''}><span class="tgs"></span></label></div>
    <div class="vi-g"><label style="font-size:.8rem;color:var(--a);display:block;margin-bottom:4px">${lang==='ar'?'رقم الفيزا':'Visa Number'}</label>
    <input id="vIn" value="${esc(s.visa||'')}" placeholder="XXXX XXXX XXXX XXXX"></div>
    <button class="btn1" style="margin-top:12px;width:100%" onclick="saveSS()">${lang==='ar'?'حفظ':'Save'}</button></div>`;
    om('supMod');
}

function saveSS(){
    let on=document.getElementById('sTog')?.checked||false;
    let visa=(document.getElementById('vIn')?.value||'').trim();
    saveSup({on:on,visa:visa});
    ts(lang==='ar'?'تم الحفظ':'Saved','ok');
    cm('supMod');
}

// ========== LOGS ==========
function showLog(){
    loadUsers();
    let normal=_users.filter(u=>!u.owner);
    document.getElementById('logB').innerHTML=`
    <div class="ls"><div class="ls-n">${normal.length}</div><div class="ls-l">${lang==='ar'?'حسابات مسجلة':'Registered'}</div></div>
    <div class="ll">${normal.map(u=>`<div class="li"><i class="fas fa-user-circle"></i>
    <span class="li-n">${esc(u.dname||u.username)} (@${esc(u.username)})</span>
    <span class="li-d">${new Date(u.cat).toLocaleDateString()}</span></div>`).join('')
    ||`<p style="text-align:center;color:var(--td);padding:14px">${lang==='ar'?'لا يوجد':'None'}</p>`}</div>`;
    om('logMod');
}

// ========== CHANNELS ==========
function showCh(){
    let chs=getChannels();
    document.getElementById('chB').innerHTML=`
    ${chs.map(c=>`<div class="ci"><div class="ci-i">
    <div class="ci-n">${esc(c.name)}</div><div class="ci-u">${esc(c.url)}</div>
    <div class="ci-t">${c.type} ${c.skip?(lang==='ar'?'(تخطي)':'(skip)'):''}</div>
    </div><button onclick="dCh('${c.id}')"><i class="fas fa-trash"></i></button></div>`).join('')}
    <div class="ca">
    <input id="cN" placeholder="${lang==='ar'?'الاسم':'Name'}">
    <input id="cU" placeholder="${lang==='ar'?'الرابط':'URL'}" type="url">
    <select id="cT"><option value="youtube">YouTube</option><option value="telegram">Telegram</option><option value="discord">Discord</option><option value="other">Other</option></select>
    <label style="display:flex;align-items:center;gap:3px;font-size:.75rem;color:var(--td);width:100%"><input type="checkbox" id="cS"> ${lang==='ar'?'قابل للتخطي':'Skippable'}</label>
    <button onclick="aCh()">${lang==='ar'?'إضافة':'Add'}</button></div>`;
    om('chMod');
}

function aCh(){
    let n=document.getElementById('cN').value.trim();
    let u=document.getElementById('cU').value.trim();
    let t=document.getElementById('cT').value;
    let s=document.getElementById('cS').checked;
    if(!n||!u){ts(lang==='ar'?'أدخل البيانات':'Fill fields','er');return}
    let chs=getChannels();
    chs.push({id:gid(),name:n,url:u,type:t,skip:s});
    saveChannels(chs);
    ts(lang==='ar'?'تم':'Added','ok');
    showCh();
}

function dCh(id){
    let chs=getChannels().filter(x=>x.id!==id);
    saveChannels(chs);
    ts(lang==='ar'?'تم الحذف':'Deleted','ok');
    showCh();
}
