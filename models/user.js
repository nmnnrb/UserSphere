const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://nmnnrb:nmnnrb@socialmedia-a.3dv96.mongodb.net/?retryWrites=true&w=majority&appName=SocialMedia-a");

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    password: String, 
    email: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post" 
        }
    ],
    profilepic: {
        type: String,
        default: "profiledefault.png"
    }
})

module.exports = mongoose.model('user', userSchema);