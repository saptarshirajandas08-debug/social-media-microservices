const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    createAt: {
        type: Date,
        default: Date.now(),
    }
},{timestamps: true})

userSchema.pre('save', async function(next) { //pre -> defines a pre hook for the model
    try{
        if(this.isModified('password')){
            try{
                this.password = await argon2.hash(this.password);
            }catch(error){
                console.log(error)
                return next(error);
            }
        }
    }catch(error){

    }
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    try{
        return await argon2.verify(this.password, candidatePassword);
    }catch(error){
        console.log(error);
    }
}

//search funtionality basis of username
userSchema.index({username: 'text'});

const user = mongoose.model('user', userSchema);
module.exports = {user};