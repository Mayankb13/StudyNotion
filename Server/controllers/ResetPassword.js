

const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
    try {
        // get email from req body
        const email = req.body.email;

        // check user for this email , email validation
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
            });
        }

        // generate token
        const token = crypto.randomBytes(20).toString("hex");

        // update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 5 * 60 * 1000,
            },
            { new: true });

        console.log("Details", updatedDetails);

        // create url
        const url = `http://localhost:3000/update-password/${token}`

        // send mail containing the url
        await mailSender(
            email,
            "Password Reset Link",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        );
        // return response
        return res.json({
            success: true,
            message: 'Email sent successfully, Please Check Your Email to Continue Further',
        });
    }

    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: `Some Error in Sending the Reset Message`,
        });
    }
}



// resetPassword
exports.resetPassword = async (req, res) => {
    // token , pass , confirm pass
    try {
        // data fetch
        const { password, confirmPassword, token } = req.body;

        // validation
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and Confirm Password Does not Match",
            });
        }

        // get user details from db using token
        const userDetails = await User.findOne({ token: token });

        // if no entry for token -> invalid token
        if (!userDetails) {
            return res.json({
                success: false,
                message: 'Token is Invalid'
            });
        }

        // token time expires
        if (!(userDetails.resetPasswordExpires > Date.now())) {
            return res.status(403).json({
                success: false,
                message: "Token is Invalid",
            });
        }
        // hash password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // update password
        await User.findOneAndUpdate(
            { token: token },
            { password: encryptedPassword },
            { new: true },
        );

        // return response
        return res.json({
            success: true,
            message: 'Password Reset Successfully'
        });
    }

    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: `Some Error in Updating the Password`,
        });
    }
};