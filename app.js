const roles = [
["Business Strategy Manager","Turns business goals into practical strategies, priorities and measurable plans."],
["Market Research Analyst","Researches industries, customer needs, competitors and market opportunities."],
["Website Development Specialist","Plans and builds responsive business websites and web experiences."],
["UI/UX Designer","Creates clear user journeys, layouts and accessible interface experiences."],
["Branding & Creative Specialist","Develops brand identity, visual direction and creative campaign assets."],
["Sales & Client Acquisition Manager","Organizes prospects, outreach preparation, proposals and follow-ups."],
["Digital Marketing Manager","Plans content, SEO, campaigns and channel performance."],
["Finance & Business Analyst","Tracks budgets, pricing assumptions, costs and business performance."],
["Customer Support Manager","Designs support workflows, FAQs, issue tracking and service quality."],
["Automation & Operations Engineer","Identifies repeatable workflows and safe automation opportunities."],
["Project Manager & QA","Coordinates delivery, milestones, testing, risks and quality reviews."]
];
const $ = id => document.getElementById(id);
const read = key => JSON.parse(localStorage.getItem(key) || "[]");
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
function go(page){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$("page-"+page).classList.remove("hidden");document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));$("pageTitle").textContent=({dashboard:"Dashboard",team:"AI Team",tasks:"Tasks",leads:"Clients & Leads",assistant:"Executive Chat"})[page];}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$("teamGrid").innerHTML=roles.map((r,i)=>`<article class="team-card"><div class="num">SPECIALIST ${String(i+1).padStart(2,"0")}</div><h3>${r[0]}</h3><p>${r[1]}</p><span class="tag">ROLE DEFINED · AI NOT CONNECTED</span></article>`).join("");
$("taskOwner").innerHTML=roles.map(r=>`<option>${r[0]}</option>`).join("");
function renderTasks(){const tasks=read("jarvis_tasks");$("taskMetric").textContent=tasks.filter(t=>t.status!=="Done").length;$("taskList").innerHTML=tasks.length?tasks.map((t,i)=>`<div class="list-item"><div><b>${esc(t.title)}</b><small>${esc(t.owner)}</small></div><select data-task="${i}"><option ${t.status==="To do"?"selected":""}>To do</option><option ${t.status==="In progress"?"selected":""}>In progress</option><option ${t.status==="Done"?"selected":""}>Done</option></select></div>`).join(""):'<p>No tasks yet. Add your first task above.</p>';$("taskList").querySelectorAll("select").forEach(s=>s.addEventListener("change",()=>{let a=read("jarvis_tasks");a[+s.dataset.task].status=s.value;save("jarvis_tasks",a);renderTasks()}));}
function renderLeads(){const leads=read("jarvis_leads");$("leadMetric").textContent=leads.length;$("leadList").innerHTML=leads.length?leads.map((l,i)=>`<div class="list-item"><div><b>${esc(l.name)}</b><small>${esc(l.type||"Business prospect")}</small></div><select data-lead="${i}">${["New","Researching","Contacted","Proposal","Won"].map(s=>`<option ${l.stage===s?"selected":""}>${s}</option>`).join("")}</select></div>`).join(""):'<p>No leads yet. Add a business prospect above.</p>';$("leadList").querySelectorAll("select").forEach(s=>s.addEventListener("change",()=>{let a=read("jarvis_leads");a[+s.dataset.lead].stage=s.value;save("jarvis_leads",a);renderLeads()}));}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("taskForm").addEventListener("submit",e=>{e.preventDefault();let a=read("jarvis_tasks");a.unshift({title:$("taskTitle").value.trim(),owner:$("taskOwner").value,status:"To do"});save("jarvis_tasks",a);$("taskTitle").value="";renderTasks()});
$("leadForm").addEventListener("submit",e=>{e.preventDefault();let a=read("jarvis_leads");a.unshift({name:$("leadName").value.trim(),type:$("leadType").value.trim(),stage:$("leadStage").value});save("jarvis_leads",a);$("leadName").value="";$("leadType").value="";renderLeads()});
$("chatForm").addEventListener("submit",async e=>{e.preventDefault();const input=$("chatInput"),msg=input.value.trim();if(!msg)return;addBubble(msg,"user");input.value="";try{const r=await fetch("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg})});const data=await r.json();addBubble(data.reply||"I could not process that request.","jarvis")}catch{addBubble("Server connection issue. Please try again.","jarvis")}});
function addBubble(text,who){const d=document.createElement("div");d.className="bubble "+who;d.textContent=text;$("messages").appendChild(d);$("messages").scrollTop=$("messages").scrollHeight;}
async function health(){try{const r=await fetch("/api/health"),d=await r.json();$("systemStatus").innerHTML="<i></i> System online";$("aiMetric").textContent=d.aiProvider==="configured"?"Key configured":"Not connected";$("chatStatus").textContent=d.aiProvider==="configured"?"Key configured · integration verification pending":"Workspace assistant · AI not connected"}catch{$("systemStatus").innerHTML="<i></i> Status unavailable"}}
renderTasks();renderLeads();health();