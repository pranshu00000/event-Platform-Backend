const express=require('express')
const router=express.Router();
const{registerUser,loginUser,guestLogin,checkAuth,logoutUser}=require('../controllers/authController')

router.post('/register',registerUser);
router.post('/login',loginUser);
router.get('/check', checkAuth);
router.post('/guest',guestLogin);
router.post('/logout',logoutUser);

module.exports=router