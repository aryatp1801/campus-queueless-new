const api = window.QUEUELESS_API_URL;
const $ = (id) => document.getElementById(id);
function apiReady(){return api && !api.includes("YOUR-RENDER-SERVICE");}
async function request(path, options={}) {
  if(!apiReady()) throw new Error("Backend URL is not configured yet. Edit frontend/config.js with your Render URL.");
  const res=await fetch(api+path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
  const data=await res.json().catch(()=>({message:"Unexpected server response"}));
  if(!res.ok) throw new Error(data.message||"Request failed");
  return data;
}
function showResult(html){$("tokenResult").innerHTML=html;$("tokenResult").classList.remove("hidden");}
async function loadQueue(){
  const el=$("queueOverview"); el.innerHTML='<p class="muted">Loading queue…</p>';
  try{
    const data=await request("/api/queue");
    el.innerHTML=data.services.map(s=>`<div class="queue-row"><div><strong>${escapeHtml(s.service)}</strong><small>Now serving: ${s.nowServing||"—"}</small></div><span class="pill">${s.waiting} waiting</span></div>`).join("");
  }catch(e){el.innerHTML=`<p class="error">${escapeHtml(e.message)}</p>`;}
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("tokenForm").addEventListener("submit",async e=>{
 e.preventDefault(); const name=$("studentName").value.trim(), service=$("service").value;
 try{const t=await request("/api/tokens",{method:"POST",body:JSON.stringify({name,service})});
 showResult(`<div class="mini-label">YOUR TOKEN</div><div class="token-number">${escapeHtml(t.tokenNumber)}</div><h3>${escapeHtml(t.service)}</h3><p>Issued to ${escapeHtml(t.name)}. Status: <b>${escapeHtml(t.status)}</b></p><p>People ahead: ${t.peopleAhead}</p><p class="tiny muted">Keep this token number and check queue updates.</p>`); await loadQueue();
 }catch(err){showResult(`<p class="error">${escapeHtml(err.message)}</p>`);}
});
$("refreshBtn").addEventListener("click",loadQueue);
loadQueue();
