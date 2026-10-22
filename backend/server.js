const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(",").map(s=>s.trim()) : true }));
app.use(express.json());

const PORT = process.env.PORT || 10000;
const STAFF_USERNAME = process.env.STAFF_USERNAME || "staff";
const STAFF_PASSWORD = process.env.STAFF_PASSWORD;
const STAFF_SECRET = process.env.STAFF_SECRET;
const SERVICES = ["College Office", "Library", "Laboratory", "Canteen", "Fee Counter", "Principal's Office"];

// Starter MVP: tokens are kept in memory. For durable records, connect MongoDB Atlas before real use.
let tokens = [];
let counters = Object.fromEntries(SERVICES.map(s => [s, 0]));
const sessions = new Set();

function fail(res, status, message) { return res.status(status).json({ message }); }
function auth(req,res,next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !sessions.has(token)) return fail(res,401,"Please sign in again.");
  next();
}
function nextNumber(service) {
  counters[service] = (counters[service] || 0) + 1;
  const prefix = service.split(/\s+/).map(w=>w[0]).join("").replace(/[^A-Z]/g,"").slice(0,2).toUpperCase();
  return `${prefix || "Q"}-${String(counters[service]).padStart(3,"0")}`;
}
function queueData() {
  return {
    services: SERVICES.map(service => {
      const active = tokens.filter(t=>t.service===service && t.status!=="completed");
      const current = active.find(t=>t.status==="serving");
      return {service, nowServing: current ? current.tokenNumber : null, waiting: active.filter(t=>t.status==="waiting").length};
    }),
    tokens: tokens.filter(t=>t.status!=="completed").slice().reverse()
  };
}
app.get("/",(req,res)=>res.json({name:"Campus QueueLess API",status:"ok",health:"/health"}));
app.get("/health",(req,res)=>res.status(200).send("OK"));
app.get("/api/queue",(req,res)=>res.json(queueData()));

app.post("/api/tokens",(req,res)=>{
  const name = String(req.body.name || "").trim();
  const service = String(req.body.service || "");
  if (!name || name.length > 80) return fail(res,400,"Enter a valid name (up to 80 characters).");
  if (!SERVICES.includes(service)) return fail(res,400,"Choose a valid campus service.");
  const activeForStudent = tokens.find(t=>t.name.toLowerCase()===name.toLowerCase() && t.status!=="completed");
  if (activeForStudent) return fail(res,409,`You already have an active token: ${activeForStudent.tokenNumber}. Complete it before taking another.`);
  const token = {id:crypto.randomUUID(),tokenNumber:nextNumber(service),name,service,status:"waiting",createdAt:new Date().toISOString()};
  tokens.push(token);
  const peopleAhead = tokens.filter(t=>t.service===service && t.status==="waiting").length-1;
  res.status(201).json({...token,peopleAhead});
});

app.post("/api/staff/login",(req,res)=>{
  if (!STAFF_PASSWORD || !STAFF_SECRET) return fail(res,503,"Staff login is not configured. Set STAFF_PASSWORD and STAFF_SECRET in Render environment variables.");
  const username=String(req.body.username||"");
  const password=String(req.body.password||"");
  if(username!==STAFF_USERNAME || password!==STAFF_PASSWORD) return fail(res,401,"Incorrect username or password.");
  const token=crypto.randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({token,message:"Signed in"});
});

app.post("/api/staff/next",auth,(req,res)=>{
  const service=String(req.body.service||"");
  if(!SERVICES.includes(service)) return fail(res,400,"Choose a valid service.");
  const serving=tokens.find(t=>t.service===service&&t.status==="serving");
  if(serving) return fail(res,409,`Complete the current token ${serving.tokenNumber} first.`);
  const token=tokens.find(t=>t.service===service&&t.status==="waiting");
  if(!token) return fail(res,404,"There are no waiting tokens for this service.");
  token.status="serving"; token.calledAt=new Date().toISOString();
  res.json({token});
});
app.post("/api/staff/complete",auth,(req,res)=>{
  const service=String(req.body.service||"");
  if(!SERVICES.includes(service)) return fail(res,400,"Choose a valid service.");
  const token=tokens.find(t=>t.service===service&&t.status==="serving");
  if(!token) return fail(res,404,"There is no token currently being served.");
  token.status="completed"; token.completedAt=new Date().toISOString();
  res.json({token});
});

app.post("/api/staff/pending", auth, (req, res) => {
  const service = String(req.body.service || "");
  if (!SERVICES.includes(service)) {
    return fail(res, 400, "Choose a valid service.");
  }

  const token = tokens.find(
    t => t.service === service && t.status === "serving"
  );

  if (!token) {
    return fail(res, 404, "There is no token currently being served.");
  }

  token.status = "pending";
  token.pendingAt = new Date().toISOString();

  res.json({ token, message: "Token moved to pending." });
});

app.post("/api/staff/call-again", auth, (req, res) => {
  const service = String(req.body.service || "");
  if (!SERVICES.includes(service)) {
    return fail(res, 400, "Choose a valid service.");
  }

  const current = tokens.find(
    t => t.service === service && t.status === "serving"
  );

  if (current) {
    return fail(res, 409, "Complete or pend the current token first.");
  }

  const token = tokens.find(
    t => t.service === service && t.status === "pending"
  );

  if (!token) {
    return fail(res, 404, "There are no pending tokens for this service.");
  }

  token.status = "serving";
  token.calledAt = new Date().toISOString();

  res.json({ token, message: "Pending token called again." });
});

app.listen(PORT,()=>console.log(`Campus QueueLess API listening on ${PORT}`));
