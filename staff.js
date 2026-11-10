import {auth,db,cfg} from './firebase-config.js';
import {$,esc,tabs,tbl,info,COLLEGES,PW,MOBILE,SID,remark,av,photoBox,card} from './common.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signOut,createUserWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,collection,query,where,getDocs,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
tabs();$('#out').onclick=()=>signOut(auth).then(()=>location='index.html');
let me,uid,students=[],subjects=[],grades=[],enr=[],ann=[];
const get=async q=>(await getDocs(q)).docs.map(d=>({id:d.id,...d.data()}));
const load=async()=>{students=await get(query(collection(db,'users'),where('role','==','student')));subjects=await get(collection(db,'subjects'));grades=await get(collection(db,'grades'));enr=await get(collection(db,'enrollments'));ann=(await get(collection(db,'announcements'))).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));render()};
const opts=a=>a.map(x=>[x,x]),COURSES=Object.values(COLLEGES).flat();
const SF=[['firstName','First name','text'],['middleName','Middle name','text'],['lastName','Last name','text'],['studentId','Student ID (e.g. 2024-0188E)','text'],['mobile','Mobile (11 digits)','tel'],['birthday','Birthday','date'],['college','College','select',opts(Object.keys(COLLEGES))],['course','Course','select',opts(COURSES)],['yearLevel','Year level','select',opts(['1st Year','2nd Year','3rd Year','4th Year'])],['section','Section','text']];
function modal(title,fields,v,save){const d=$('#dlg');
 d.innerHTML=`<h2>${title}</h2><form method="dialog">${fields.map(([k,l,t,o])=>`<label>${l}</label>`+(t==='select'?`<select name="${k}">${o.map(([a,b])=>`<option value="${esc(a)}">${esc(b)}</option>`).join('')}</select>`:t==='area'?`<textarea name="${k}" rows="5" required>${esc(v[k])}</textarea>`:`<input name="${k}" type="${t}" step="any" required value="${esc(v[k])}">`)).join('')}<div class="row"><button class="btn" value="ok">Save</button><button class="btn ghost" value="x" formnovalidate>Cancel</button></div></form>`;
 d.querySelectorAll('select').forEach(s=>{if(v[s.name])s.value=v[s.name]});
 d.returnValue='';d.onclose=async()=>{if(d.returnValue!=='ok')return;try{await save(Object.fromEntries(new FormData(d.querySelector('form'))));await load()}catch(e){alert(e.message||e)}};d.showModal()}
const btn=(a,id,t,c='')=>`<button class="btn sm ${c}" data-a="${a}" data-id="${id}">${t}</button>`;
const nm=s=>s.lastName+', '+s.firstName+' '+(s.middleName||'');
const top=()=>$('#who').innerHTML=av(me)+esc(me.firstName+' '+me.lastName);
function render(){
 $('#tan').innerHTML=`<button class="btn sm" data-a="addA">+ Post announcement</button>`+(ann.map(a=>{const L=a.likedBy||[],n=students.filter(s=>L.includes(s.id)).map(nm).join('; ');return card(a,`<span class="hint">👍 ${L.length} liked${n?': '+esc(n):''}</span><div style="margin-top:8px">${btn('eA',a.id,'Edit')}${btn('dA',a.id,'Delete','red')}</div>`)}).join('')||'<p class="hint">No announcements yet.</p>');
 $('#tst').innerHTML=`<button class="btn sm" data-a="addS">+ Add student</button>`+tbl(['ID','Name','College / Course','Yr-Sec','Mobile',''],students.map(s=>`<tr><td>${esc(s.studentId)}</td><td>${av(s)}${esc(nm(s))}</td><td>${esc(s.college)}<br><small>${esc(s.course)}</small></td><td>${esc(s.yearLevel)}-${esc(s.section)}</td><td>${esc(s.mobile)}</td><td>${btn('aS',s.id,'Subjects ('+enr.filter(e=>e.studentUid===s.id).length+')')}${btn('eS',s.id,'Edit')}${btn('dS',s.id,'Delete','red')}</td></tr>`));
 $('#tsu').innerHTML=`<button class="btn sm" data-a="addU">+ Add subject</button>`+tbl(['Code','Subject','Units','Course','Year','Instructor',''],subjects.map(s=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td>${s.units}</td><td>${esc(s.course)}</td><td>${esc(s.yearLevel||'—')}</td><td>${esc(s.instructor)}</td><td>${btn('eU',s.id,'Edit')}${btn('dU',s.id,'Delete','red')}</td></tr>`));
 $('#tgr').innerHTML=`<button class="btn sm" data-a="addG">+ Add grade</button>`+tbl(['Student','Subject','Term','Grade','Remarks',''],grades.map(g=>`<tr><td>${esc(g.studentName)}</td><td>${esc(g.subjectCode)}</td><td>${esc(g.term)}</td><td>${g.grade.toFixed(2)}</td><td>${remark(g.grade)}</td><td>${btn('eG',g.id,'Edit')}${btn('dG',g.id,'Delete','red')}</td></tr>`));
 $('#tme').innerHTML='<div id="pho"></div>'+info([['Name',[me.firstName,me.middleName,me.lastName].join(' ')],['Role','Faculty / Admin'],['Email',me.email],['Mobile',me.mobile]]);photoBox($('#pho'),me,async url=>{await updateDoc(doc(db,'users',uid),{photoURL:url});top()})}
const AF=[['title','Title','text'],['body','Message','area']];
const YL=['1st Year','2nd Year','3rd Year','4th Year'];
const UF=[['code','Subject code','text'],['name','Subject name','text'],['units','Units','number'],['course','Course','select',opts(COURSES)],['yearLevel','Year level','select',opts(YL)],['instructor','Instructor','text']];
const GF=()=>[['studentUid','Student','select',students.map(s=>[s.id,nm(s)])],['subjectId','Subject','select',subjects.map(s=>[s.id,s.code+' – '+s.name])],['term','Term (e.g. 1st Sem 2026-2027)','text'],['grade','Grade (1.00–5.00)','number']];
const saveG=id=>async f=>{const s=students.find(x=>x.id===f.studentUid),j=subjects.find(x=>x.id===f.subjectId),g=+f.grade;if(!(g>=1&&g<=5))throw'Grade must be 1.00–5.00';
 const d={studentUid:s.id,studentName:nm(s),subjectId:j.id,subjectCode:j.code,subjectName:j.name,term:f.term,grade:g};id?await updateDoc(doc(db,'grades',id),d):await addDoc(collection(db,'grades'),d)};
const assign=id=>{const s=students.find(x=>x.id===id),mine=enr.filter(e=>e.studentUid===id),d=$('#dlg');
 const row=j=>`<label style="display:flex;gap:8px;align-items:center;color:var(--tx)"><input type="checkbox" style="width:auto" name="sub" value="${j.id}" ${mine.some(e=>e.subjectId===j.id)?'checked':''}>${esc(j.code)} – ${esc(j.name)} <small>(${esc(j.course)})</small></label>`;
 const grp=[...YL,'No year level'].map(y=>{const l=subjects.filter(j=>(YL.includes(j.yearLevel)?j.yearLevel:'No year level')===y);return l.length?`<h3 style="color:var(--g);margin:14px 0 2px;font-size:14px">${y}</h3>`+l.map(row).join(''):''}).join('');
 d.innerHTML=`<h2>Subjects – ${esc(nm(s))}</h2><form method="dialog">${grp||'<p>Add subjects first (Subjects tab).</p>'}<div class="row"><button class="btn" value="ok">Save</button><button class="btn ghost" value="x" formnovalidate>Cancel</button></div></form>`;
 d.returnValue='';d.onclose=async()=>{if(d.returnValue!=='ok')return;const pick=new FormData(d.querySelector('form')).getAll('sub');
  try{await Promise.all([...pick.filter(p=>!mine.some(e=>e.subjectId===p)).map(p=>addDoc(collection(db,'enrollments'),{studentUid:id,subjectId:p})),...mine.filter(e=>!pick.includes(e.subjectId)).map(e=>deleteDoc(doc(db,'enrollments',e.id)))]);await load()}catch(e){alert(e.message)}};d.showModal()};
const A={
 aS:assign,
 addA:()=>modal('Post announcement',AF,{},f=>addDoc(collection(db,'announcements'),{...f,author:me.firstName+' '+me.lastName,createdAt:serverTimestamp(),likedBy:[]})),
 eA:id=>modal('Edit announcement',AF,ann.find(x=>x.id===id),f=>updateDoc(doc(db,'announcements',id),f)),
 dA:async id=>{if(confirm('Delete this announcement?')){await deleteDoc(doc(db,'announcements',id));load()}},
 addS:()=>modal('Add student',[...SF,['email','Email','email'],['password','Temporary password','text']],{},async f=>{
  f.studentId=f.studentId.trim().toUpperCase();if(!SID.test(f.studentId))throw'Student ID format: 2024-0188E';if(!MOBILE.test(f.mobile))throw'Mobile must be 11 digits starting with 09';if(!PW.test(f.password))throw'Weak password (8+, upper, lower, number, symbol)';
  const {email,password,...p}=f,sec=getAuth(initializeApp(cfg,'sec'+Date.now())),u=(await createUserWithEmailAndPassword(sec,email,password)).user;
  await setDoc(doc(db,'users',u.uid),{...p,email,role:'student',createdAt:serverTimestamp()});await signOut(sec)}),
 eS:id=>modal('Edit student',SF,students.find(x=>x.id===id),async f=>{f.studentId=f.studentId.trim().toUpperCase();if(!SID.test(f.studentId))throw'Student ID format: 2024-0188E';if(!MOBILE.test(f.mobile))throw'Mobile must be 11 digits starting with 09';await updateDoc(doc(db,'users',id),f)}),
 dS:async id=>{if(confirm('Delete this student and their grades?')){await Promise.all([...grades.filter(g=>g.studentUid===id).map(g=>deleteDoc(doc(db,'grades',g.id))),...enr.filter(e=>e.studentUid===id).map(e=>deleteDoc(doc(db,'enrollments',e.id)))]);await deleteDoc(doc(db,'users',id));load()}},
 addU:()=>modal('Add subject',UF,{},f=>addDoc(collection(db,'subjects'),{...f,units:+f.units})),
 eU:id=>modal('Edit subject',UF,subjects.find(x=>x.id===id),f=>updateDoc(doc(db,'subjects',id),{...f,units:+f.units})),
 dU:async id=>{if(confirm('Delete this subject?')){await Promise.all(enr.filter(e=>e.subjectId===id).map(e=>deleteDoc(doc(db,'enrollments',e.id))));await deleteDoc(doc(db,'subjects',id));load()}},
 addG:()=>students.length&&subjects.length?modal('Add grade',GF(),{},saveG()):alert('Add at least one student and one subject first.'),
 eG:id=>modal('Edit grade',GF(),grades.find(x=>x.id===id),saveG(id)),
 dG:async id=>{if(confirm('Delete this grade?')){await deleteDoc(doc(db,'grades',id));load()}}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)A[b.dataset.a](b.dataset.id)});
onAuthStateChanged(auth,async u=>{if(!u)return location='index.html';const s=await getDoc(doc(db,'users',u.uid));me=s.data();uid=u.uid;
 if(!me||me.role!=='staff')return location='student.html';top();load()});
