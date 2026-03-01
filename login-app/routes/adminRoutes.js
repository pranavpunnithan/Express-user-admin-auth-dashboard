const express=require("express");
const bcrypt=require("bcrypt");
const Admin=require("../models/Admin");
const User=require("../models/User");
const router=express.Router();

const redirectIfAdminLoggedIn = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  next();
};

const requireAdminAuth = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }
  if (!req.session.admin) {
    return res.redirect("/admin");
  }
  next();
};

const regenerateSession = (req) => new Promise((resolve, reject) => {
  req.session.regenerate((err) => {
    if (err) return reject(err);
    resolve();
  });
});

const saveSession = (req) => new Promise((resolve, reject) => {
  req.session.save((err) => {
    if (err) return reject(err);
    resolve();
  });
});

// show admin login

router.get("/",redirectIfAdminLoggedIn,(req,res)=>{
  res.render("admin-login");
});

//handle admin login

router.post("/",async(req,res)=>{
  try {
    const{email,password}=req.body;
    const admin=await Admin.findOne({email});
    if(!admin){
      return res.send("Invalid Admin Credentails");
    } 
    const match=await bcrypt.compare(password,admin.password);
    if(!match){
      return res.send("Invalid Admin Credentials");
    }
    await regenerateSession(req);
    req.session.admin=admin._id;
    await saveSession(req);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.log(err);
    res.send("Admin Login Error");
  }
});

//admin dashboard

router.get("/dashboard", requireAdminAuth, async(req,res)=>{
 const search=req.query.search||"";
 const users=await User.find({
  email:{$regex:search,$options:"i"}
 });
 res.render("admin-dashboard",{users,search});

});

/* ---------------- CREATE USER ---------------- */

router.post("/create-user", requireAdminAuth, async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword
  });

  res.redirect("/admin/dashboard");
});

//show edit page

router.get("/edit/:id", requireAdminAuth, async(req,res)=>{
  const user= await User.findById(req.params.id);
  res.render("admin-edit",{user})
});
//update user
router.post("/edit/:id",requireAdminAuth,async(req,res)=>{
  const {name,email}=req.body;
await User.findByIdAndUpdate(req.params.id,{
  name,email
});
res.redirect("/admin/dashboard");
});

//delete user
router.get("/delete/:id",requireAdminAuth,async(req,res)=>{
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/admin/dashboard");
})


//admin logout

router.get("/logout",(req,res)=>{
  req.session.admin = null;
  req.session.save((err) => {
    if (err) {
      console.log(err);
      return res.send("Admin Logout Error");
    }
    res.clearCookie("connect.sid");
    res.redirect("/admin");
  });
});

module.exports=router;
