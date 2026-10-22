const api=window.QUEUELESS_API_URL; const $=id=>document.getElementById(id); let staffToken=null;
function apiReady(){return api&&!api.includes("YOUR-RENDER-SERVICE");}
async function request(path,options={}){
 if(!apiReady())throw new Error("Backend URL is not configured. Edit frontend/config.js first.");
 const res=await fetch(api+path,{...options,headers:{"Content-Type":"application/json",...(staffToken?{Authorization:"Bearer "+staffToken}:{}),...(options.headers||{})}});
 const data=await res.json().catch(()=>({message:"Unexpected server response"}));
 if(!res.ok)throw new Error(data.message||"Request failed"); return data;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function msg(id,text,error=false){$(id).textContent=text;$(id).className="message "+(error?"error":"success");}
$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();try{const d=await request("/api/staff/login",{method:"POST",body:JSON.stringify({username:$("username").value.trim(),password:$("password").value})});staffToken=d.token;$("loginPanel").classList.add("hidden");$("dashboard").classList.remove("hidden");await loadStaffQueue();}catch(err){msg("loginMessage",err.message,true);}
});
async function loadStaffQueue(){try{const d=await request("/api/queue");const service=$("staffService").value;const s=d.services.find(x=>x.service===service);const tokens=d.tokens.filter(t=>t.service===service&&t.status!=="completed");$("staffQueue").innerHTML=`<div class="highlight-row"><span>Now serving</span><strong>${esc(s?.nowServing||"—")}</strong></div>`+(tokens.length?tokens.map(t=>`<div class="queue-row"><div><strong>${esc(t.tokenNumber)} · ${esc(t.name)}</strong><small>${esc(t.status)} · ${esc(t.createdAt?new Date(t.createdAt).toLocaleTimeString():"")}</small></div><span class="pill">${esc(t.service)}</span></div>`).join(""):'<p class="muted">No active tokens for this service.</p>');}catch(e){$("staffQueue").innerHTML=`<p class="error">${esc(e.message)}</p>`;}}
$("staffService").addEventListener("change",loadStaffQueue);$("staffRefresh").addEventListener("click",loadStaffQueue);
$("nextBtn").addEventListener("click",async()=>{try{const d=await request("/api/staff/next",{method:"POST",body:JSON.stringify({service:$("staffService").value})});msg("staffMessage",`Now calling ${d.token.tokenNumber}`);await loadStaffQueue();}catch(e){msg("staffMessage",e.message,true);}});
$("completeBtn").addEventListener("click",async()=>{try{const d=await request("/api/staff/complete",{method:"POST",body:JSON.stringify({service:$("staffService").value})});msg("staffMessage",`Completed ${d.token.tokenNumber}`);await loadStaffQueue();}catch(e){msg("staffMessage",e.message,true);}});
$("logoutBtn").addEventListener("click",()=>{staffToken=null;$("dashboard").classList.add("hidden");$("loginPanel").classList.remove("hidden");$("password").value="";msg("loginMessage","Signed out.");});
// Move the currently serving token to Pending
$("pendingBtn").addEventListener("click", async () => {
  try {
    const service = $("staffService").value;

    const data = await request("/api/staff/pending", {
      method: "POST",
      body: JSON.stringify({ service })
    });

    msg("staffMessage", data.message || "Token moved to Pending.");
    await loadStaffQueue();
  } catch (error) {
    msg("staffMessage", error.message, true);
  }
});

// Call a pending token again
$("callAgainBtn").addEventListener("click", async () => {
  try {
    const service = $("staffService").value;

    const data = await request("/api/staff/call-again", {
      method: "POST",
      body: JSON.stringify({ service })
    });

    msg("staffMessage", data.message || "Pending token called again.");
    await loadStaffQueue();
  } catch (error) {
    msg("staffMessage", error.message, true);
  }
});
