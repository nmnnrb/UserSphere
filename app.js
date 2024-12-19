const express = require('express')
const app = express();
const upload = require('./config/multerconfig')
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();
const PORT = process.env.PORT || 4000;
app.set('view engine' , 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname ,"public")))

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("connected to db");
}).catch((err) => console.log(err));

app.get('/' , (req,res)=>{
    res.render('index');
})
app.get('/login' , (req,res)=>{
    res.render('login');
})

app.post('/register' , async (req,res)=>{
    let {name, username, email , password , age} = req.body;

    let user = await userModel.findOne({email});

    if(user) return res.status(500).send("user already register");

    bcrypt.genSalt(10, (err,salt) => {
        bcrypt.hash(password , salt , async (err,hash)=>{
            //stored in dbnpx 
        let user = await userModel.create({
        name: req.body.name,
        username: req.body.username,
        age: req.body.age,
        password: hash,
        email: req.body.email
             })
           let token =  jwt.sign({email : user.email , userId: user._id}, "shhhhh");
           res.cookie("token" , token);
           res.redirect('/profile');
        })
    })


 

})

app.get('/edit/:id' , isloggedIn, async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id})
    let user = await userModel.findOne({_id: post.userId})
    
    res.render('edit' ,{post ,user})
})
app.post('/update/:id' , isloggedIn, async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id})
    let user = await userModel.findOne({_id: post.userId})
    
    let newcontent = req.body.content;
    post.content = newcontent;
    await post.save();

    res.redirect('/profile');
})

app.get('/delete/:id' , isloggedIn, async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id})
    let user = await userModel.findOne({_id: post.userId})
    
    await postModel.findByIdAndDelete(req.params.id);

    user.posts.pull(post._id);
    await user.save();

    res.redirect('/profile');
})

app.post('/login' , async (req,res)=>{
    let { email , password} = req.body;

    let user = await userModel.findOne({email});

    if(!user) return res.status(500).send("something went wrogn");

    bcrypt.compare(password, user.password , (err,result) => {
        if(result){
            let token =  jwt.sign({email : user.email , userId: user._id}, "shhhhh");
           res.cookie("token" , token);
            res.status(200).redirect("/profile");
        }

    })
})

app.get('/logout' , (req,res) => {
    res.cookie("token" , "");
    res.redirect('/login')
})
app.get('/setdp' , isloggedIn, (req,res) => {
   res.render("setdp");
})
app.post('/upload', isloggedIn, upload.single('image') , async (req,res) => {
    console.log(req.file);
  let user =  await userModel.findOne({email: req.user.email});
   
  user.profilepic = req.file.filename
  await user.save();

  res.redirect("/profile");
    
})

app.get('/like/:id' ,isloggedIn, async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("userId")
if(post.likes.indexOf(req.user.userId) === -1){
    post.likes.push(req.user.userId)
    await post.save(); 
}else{
    post.likes.splice(post.likes.indexOf(req.user.userId) ,1);
    await post.save(); 
}

    res.redirect("/feed")
})
app.get('/profile/like/:id' ,isloggedIn, async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("userId")
if(post.likes.indexOf(req.user.userId) === -1){
    post.likes.push(req.user.userId)
    await post.save(); 
}else{
    post.likes.splice(post.likes.indexOf(req.user.userId) ,1);
    await post.save(); 
}

    res.redirect("/profile")
})

app.get('/profile' , isloggedIn , async (req,res) => {
    let user = await userModel.findOne({email: req.user.email}).populate("posts")
    
   res.render('profile' , {user});
})
 
app.post('/post' , isloggedIn , async (req,res) => {
    let user = await userModel.findOne({email: req.user.email});

      let post = await  postModel.create({
            content: req.body.content,
            userId: user._id,
        })

        user.posts.push(post._id)
       await user.save();

       res.redirect('/profile');
   
})
//this is built by self and able to saw all the posts created by user each other
app.get('/feed', isloggedIn, async (req, res) => {
    const posts = await postModel.find().populate('userId'); // Populate userId to get user details
    // Render the posts in a view
    let username = await userModel.findOne({email: req.user.email});
    res.render('feed', { posts: posts, user: req.user , name: username }); 

});

//protected middleware routes
function isloggedIn(req, res , next){
    if(req.cookies.token === ""){
        res.redirect('/login')
    }else{
        let data = jwt.verify(req.cookies.token , "shhhhh");
        req.user = data;
        next();
    }
  
}




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });