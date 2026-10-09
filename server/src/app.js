import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {randomBytes,createHash} from 'node:crypto';
import nodemailer from 'nodemailer';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import mongoose from 'mongoose';
import {z} from 'zod';
import {User,Transaction,Budget,Recurring} from './models.js';
import {transactionSchema,budgetSchema,recurringSchema,dateSchema,paise,rupees,today,summarize,csvCell} from './domain.js';
import {processRecurring} from './recurring.js';
const publicUser=u=>({id:u._id,name:u.name,email:u.email,categories:u.categories});
const txView=t=>({...t,amount:rupees(t.amountPaise)});
const authInput=z.object({email:z.email().max(254).transform(s=>s.toLowerCase()),password:z.string().min(8).max(72).refine(s=>Buffer.byteLength(s,'utf8')<=72,'Password must be at most 72 UTF-8 bytes')});
const monthInput=z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
const idValid=(req,res,next)=>mongoose.isValidObjectId(req.params.id)?next():res.status(400).json({message:'Invalid ID'});
const cookieOptions=()=>({httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:7*86400000});
function issue(res,user){res.cookie('fintrack',jwt.sign({sub:String(user._id),v:user.tokenVersion},process.env.JWT_SECRET,{expiresIn:'7d',algorithm:'HS256'}),cookieOptions());}
export function createApp(){
 const app=express();
 app.use(helmet({contentSecurityPolicy:{directives:{'script-src':["'self'"],'style-src':["'self'","'unsafe-inline'"],'img-src':["'self'",'data:']}}}));
 app.use(express.json({limit:'32kb'}));app.use(cookieParser());
 app.use('/api',rateLimit({windowMs:60000,limit:300,standardHeaders:'draft-8',legacyHeaders:false}));
 app.use('/api',(req,res,next)=>{
   if(!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('Origin') && req.get('Origin')!==process.env.APP_ORIGIN) return res.status(403).json({message:'Request origin is not allowed'});
   // Browser form submissions cannot send this header; API clients must include it.
   if(!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('X-FinTrack')!=='1') return res.status(403).json({message:'Missing request protection header'});
   next();
 });
 app.get('/api/health',(_req,res)=>res.json({status:'ok',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
 const authLimiter=rateLimit({windowMs:15*60000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many attempts. Try again in 15 minutes.'}});
 app.use('/api/auth',authLimiter);
 app.post('/api/auth/register',async(req,res)=>{const data=authInput.extend({name:z.string().trim().min(2).max(60)}).parse(req.body);const user=await User.create({name:data.name,email:data.email,passwordHash:await bcrypt.hash(data.password,12)});issue(res,user);res.status(201).json(publicUser(user));});
 app.post('/api/auth/login',async(req,res)=>{const data=authInput.parse(req.body);const user=await User.findOne({email:data.email});if(!user || !await bcrypt.compare(data.password,user.passwordHash))return res.status(401).json({message:'Incorrect email or password'});issue(res,user);res.json(publicUser(user));});
 app.post('/api/auth/logout',(_req,res)=>{res.clearCookie('fintrack',{...cookieOptions(),maxAge:undefined});res.json({message:'Logged out'});});
 app.post('/api/auth/forgot-password',async(req,res)=>{
  const {email}=z.object({email:z.email().transform(s=>s.toLowerCase())}).parse(req.body);
  const user=await User.findOne({email});
  if(user){const token=randomBytes(32).toString('hex');user.resetHash=createHash('sha256').update(token).digest('hex');user.resetExpires=new Date(Date.now()+30*60000);await user.save();const url=process.env.APP_ORIGIN+'/?reset='+token;
   if(process.env.SMTP_HOST){const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_PORT==='465',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});try{await transport.sendMail({from:process.env.SMTP_FROM,to:user.email,subject:'Reset your FinTrack password',text:'Reset within 30 minutes: '+url});}catch{console.error('Password reset mail failed. Check SMTP configuration.');}}
   else if(process.env.NODE_ENV!=='production') console.log('Development-only password reset link:',url);
  }res.json({message:'If that account exists, a reset link has been sent. Local setup without SMTP: check the API terminal.'});
 });
 app.post('/api/auth/reset-password',async(req,res)=>{const {token,password}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:authInput.shape.password}).parse(req.body);const hash=createHash('sha256').update(token).digest('hex');const passwordHash=await bcrypt.hash(password,12);const user=await User.findOneAndUpdate({resetHash:hash,resetExpires:{$gt:new Date()}},{$set:{passwordHash},$unset:{resetHash:1,resetExpires:1},$inc:{tokenVersion:1}},{new:true});if(!user)return res.status(400).json({message:'Reset link expired or invalid'});res.json({message:'Password changed. Log in with your new password.'});});
 app.use('/api',async(req,res,next)=>{let payload;try{payload=jwt.verify(req.cookies.fintrack||'',process.env.JWT_SECRET,{algorithms:['HS256']});}catch{return res.status(401).json({message:'Please log in'});}const user=await User.findById(payload.sub);if(!user||user.tokenVersion!==payload.v)return res.status(401).json({message:'Please log in again'});req.user=user;next();});
 app.get('/api/me',(req,res)=>res.json(publicUser(req.user)));
 app.patch('/api/me',async(req,res)=>{const {name}=z.object({name:z.string().trim().min(2).max(60)}).parse(req.body);req.user.name=name;await req.user.save();res.json(publicUser(req.user));});
 app.post('/api/categories',async(req,res)=>{const {name}=z.object({name:z.string().trim().min(1).max(40).refine(s=>s!=='All','All is reserved')}).parse(req.body);if(req.user.categories.length>=50)return res.status(400).json({message:'Maximum 50 categories'});await User.updateOne({_id:req.user._id},{$addToSet:{categories:name}});res.status(201).json({message:'Category added'});});
 function checkCategory(req,category,all=false){if(!(all&&category==='All')&&!req.user.categories.includes(category)){const e=new Error('Choose one of your categories');e.status=400;throw e;}}
 function filter(req){const f={userId:req.user._id};const q=z.object({from:dateSchema.optional(),to:dateSchema.optional(),type:z.enum(['income','expense']).optional(),category:z.string().max(40).optional(),q:z.string().max(100).optional(),min:z.coerce.number().min(0).max(100000000).optional(),max:z.coerce.number().min(0).max(100000000).optional()}).parse(req.query);if(q.from&&q.to&&q.from>q.to)throw Object.assign(new Error('Start date must be before end date'),{status:400});if(q.min!==undefined&&q.max!==undefined&&q.min>q.max)throw Object.assign(new Error('Minimum must not exceed maximum'),{status:400});if(q.from||q.to)f.date={...(q.from?{$gte:q.from}:{}),...(q.to?{$lte:q.to}:{})};if(q.type)f.type=q.type;if(q.category)f.category=q.category;if(q.q)f.description={$regex:q.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};if(q.min!==undefined||q.max!==undefined)f.amountPaise={...(q.min!==undefined?{$gte:paise(q.min)}:{}),...(q.max!==undefined?{$lte:paise(q.max)}:{})};return f;}
 const sorts={newest:{date:-1,_id:-1},oldest:{date:1,_id:1},highest:{amountPaise:-1,_id:-1},lowest:{amountPaise:1,_id:1}};
 app.get('/api/transactions',async(req,res)=>{await processRecurring(req.user._id);const page=z.coerce.number().int().min(1).max(100000).parse(req.query.page||1);const sort=z.enum(Object.keys(sorts)).parse(req.query.sort||'newest');const f=filter(req);const [rows,total]=await Promise.all([Transaction.find(f).sort(sorts[sort]).skip((page-1)*15).limit(15).lean(),Transaction.countDocuments(f)]);res.json({rows:rows.map(txView),total,page,pages:Math.max(1,Math.ceil(total/15))});});
 app.get('/api/transactions/export',async(req,res)=>{await processRecurring(req.user._id);const exportFilter=filter(req);res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="fintrack-transactions.csv"');res.write('\uFEFFDate,Type,Category,Amount (INR),Payment method,Description\r\n');for await(const t of Transaction.find(exportFilter).sort({date:-1,_id:-1}).cursor()){res.write([t.date,t.type,t.category,rupees(t.amountPaise).toFixed(2),t.paymentMethod,t.description].map(csvCell).join(',')+'\r\n');}res.end();});
 app.post('/api/transactions',async(req,res)=>{const d=transactionSchema.parse(req.body);checkCategory(req,d.category);const t=await Transaction.create({...d,amountPaise:paise(d.amount),userId:req.user._id});res.status(201).json(txView(t.toObject()));});
 app.put('/api/transactions/:id',idValid,async(req,res)=>{const d=transactionSchema.parse(req.body);checkCategory(req,d.category);const t=await Transaction.findOneAndUpdate({_id:req.params.id,userId:req.user._id},{$set:{...d,amountPaise:paise(d.amount)}},{new:true});if(!t)return res.status(404).json({message:'Transaction not found'});res.json(txView(t.toObject()));});
 app.delete('/api/transactions/:id',idValid,async(req,res)=>{const r=await Transaction.deleteOne({_id:req.params.id,userId:req.user._id});res.status(r.deletedCount?200:404).json({message:r.deletedCount?'Transaction deleted':'Transaction not found'});});
 app.get('/api/summary',async(req,res)=>{await processRecurring(req.user._id);const month=monthInput.parse(req.query.month||today().slice(0,7));const rows=await Transaction.find({userId:req.user._id}).lean();res.json(summarize(rows,month));});
 app.get('/api/budgets',async(req,res)=>{await processRecurring(req.user._id);const month=monthInput.parse(req.query.month||today().slice(0,7));const [budgets,rows]=await Promise.all([Budget.find({userId:req.user._id,month}).lean(),Transaction.find({userId:req.user._id,type:'expense',date:{$gte:month+'-01',$lte:month+'-31'}}).lean()]);res.json(budgets.map(b=>({...b,amount:rupees(b.amountPaise),spent:rupees(rows.filter(t=>b.category==='All'||t.category===b.category).reduce((s,t)=>s+t.amountPaise,0))})));});
 app.put('/api/budgets',async(req,res)=>{const d=budgetSchema.parse(req.body);checkCategory(req,d.category,true);const b=await Budget.findOneAndUpdate({userId:req.user._id,month:d.month,category:d.category},{$set:{amountPaise:paise(d.amount)}},{upsert:true,new:true});res.json(b);});
 app.delete('/api/budgets/:id',idValid,async(req,res)=>{const r=await Budget.deleteOne({_id:req.params.id,userId:req.user._id});res.status(r.deletedCount?200:404).json({message:r.deletedCount?'Budget deleted':'Budget not found'});});
 app.get('/api/recurring',async(req,res)=>{await processRecurring(req.user._id);res.json((await Recurring.find({userId:req.user._id}).sort({nextDate:1}).lean()).map(txView));});
 app.post('/api/recurring',async(req,res)=>{const d=recurringSchema.parse(req.body);checkCategory(req,d.category);const rule=await Recurring.create({...d,dayOfMonth:Number(d.nextDate.slice(8)),amountPaise:paise(d.amount),userId:req.user._id});await processRecurring(req.user._id);res.status(201).json(rule);});
 app.delete('/api/recurring/:id',idValid,async(req,res)=>{const r=await Recurring.deleteOne({_id:req.params.id,userId:req.user._id});res.status(r.deletedCount?200:404).json({message:r.deletedCount?'Schedule stopped; existing transactions kept':'Schedule not found'});});
 app.post('/api/demo-data',async(req,res)=>{if(await Transaction.exists({userId:req.user._id}))return res.status(409).json({message:'Sample data can only be added to an empty account'});const m=today().slice(0,7);const rows=[['income',35000,'Salary','Monthly salary','01'],['expense',2500,'Food','Groceries','02'],['expense',1200,'Transport','Fuel and metro','03'],['expense',1500,'Health','Gym membership','04'],['expense',800,'Entertainment','Movies and subscriptions','05'],['income',5000,'Freelance','Website project','05'],['expense',1800,'Shopping','New shoes','06'],['expense',3000,'Bills','Electricity and internet','01']];await Transaction.insertMany(rows.map(([type,amount,category,description,day])=>({userId:req.user._id,type,amountPaise:paise(amount),category,description,paymentMethod:'UPI',date:m+'-'+day})));await Budget.updateOne({userId:req.user._id,month:m,category:'All'},{$set:{amountPaise:2000000}},{upsert:true});res.status(201).json({message:'Sample data added for '+m});});
 app.use('/api',(_req,res)=>res.status(404).json({message:'API route not found'}));
 const dist=fileURLToPath(new URL('../../client/dist/',import.meta.url));
 if(existsSync(dist)){app.use(express.static(dist));app.get('/{*path}',(_req,res)=>res.sendFile(path.join(dist,'index.html')));}
 app.use((error,_req,res,_next)=>{if(res.headersSent)return res.end();if(error instanceof z.ZodError)return res.status(400).json({message:error.issues.map(i=>i.path.join('.')+': '+i.message).join('; ')});if(error.code===11000)return res.status(409).json({message:'This record already exists. Try logging in if your email is registered.'});if(error.type==='entity.parse.failed')return res.status(400).json({message:'Invalid JSON'});if(error.status)return res.status(error.status).json({message:error.message});console.error(error);res.status(500).json({message:'Server error. Check the API terminal.'});});
 return app;
}
