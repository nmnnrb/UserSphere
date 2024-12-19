const mongoose = require('mongoose');
// jdnd
mongoose.connect(MONGO_URI);

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