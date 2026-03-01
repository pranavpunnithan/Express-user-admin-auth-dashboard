const express= require("express");
const bcrypt= require("bcrypt");
const User= require("../models/User");

const router=express.Router();

const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect("/admin/dashboard");
    }
    if (req.session.userId) {
        return res.redirect("/home");
    }
    next();
};

const requireUserAuth = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect("/admin/dashboard");
    }
    if (!req.session.userId) {
        return res.redirect("/login");
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

//sign up
router.get("/signup",redirectIfLoggedIn,(req,res)=>{
    res.render("signup")
});

//login page
router.get("/login",redirectIfLoggedIn,(req,res)=>{
    res.render("login");
});

//handle signup
router.post("/signup",async(req,res)=>{
    try{
     const {name,email,password} =req.body;
     if(!name||!email||!password){
        return res.send("All fields are required");
     }
     const existingUser= await User.findOne({email});
     if(existingUser){
        return res.send("User already exists");
     }
     const hashedPassword=await bcrypt.hash(password,10);
     await User.create({
        name,
        email,
        password:hashedPassword
     });
     res.redirect("/login");  
    }catch(err){
        console.log(err);
        res.send("Signup Error");
    }

});

//handle login
router.post("/login",async(req,res)=>{
    try{
    const {email,password}=req.body;
    const user=await User.findOne({email});
    if(!user){
        return res.send("Invalid credentails");
    }
    const isMatch= await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.send("Invalid Credentails");
    }
    await regenerateSession(req);
    req.session.userId=user._id;
    await saveSession(req);
    res.redirect("/home");
    }catch(err){
        console.log(err);
        res.send("Login Error");
    }
});

//Home

router.get("/home",requireUserAuth,(req,res)=>{
    res.render("home");
});

//logout

router.get("/logout",(req,res)=>{
    req.session.userId = null;
    req.session.save((err) => {
        if (err) {
            console.log(err);
            return res.send("Logout Error");
        }
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

module.exports=router;




