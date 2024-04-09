const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();

// sendOTP
exports.sendOTP = async (req, res) => {

    try {
        // fetch email from request's body
        const { email } = req.body;

        // check if user already exist
        const checkUserPresent = await User.findOne({ email });

        // is user already exist then return a response
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User is Already Registered',
            })
        }

        // generate OTP
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });


        // jo otp aaya hai unique hona chahiye
        // check unique otp or not
        const result = await OTP.findOne({ otp: otp });
        console.log("Result is generate OTP func");
        console.log("OTP", otp);
        console.log("Result", result);

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                // lowerCaseAlphabets: false,
                // specialChars: false,
            });
            // result = await OTP.findOne({ otp: otp });
        }

        const otpPayload = { email, otp };

        // create an entry in DB for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body", otpBody);

        // return response successfully
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp,
        })

    }

    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }

};

// signUp

exports.signUp = async (req, res) => {

    try {
        // data fetch from request's body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        // validate krlo
        if (!firstName || !lastName || !email || !password ||
            !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: 'All fields are required',
            })
        }

        // match both password
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and Confirm Password do not match, please try again',
            });
        }

        // check user already existed or not
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists. Please sign in to continue.',
            });
        }

        // find most recent otp stored for the user
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log("otp here->", recentOtp);

        // validate otp
        if (recentOtp[0].length == 0) {
            // otp not found
            return res.status(400).json({
                success: false,
                message: 'The OTP is not valid',
            });
        }
        else if (otp !== recentOtp[0].otp) {
            // Invalid otp
            return res.status(400).json({
                success: false,
                message: 'The OTP is not valid',
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        // entry created in DB
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })

        // return response
        return res.status(200).json({
            success: true,
            message: 'User registered Successfully',
            user,
        })
    }

    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'User cannot be registered. Please try again',
        });
    }
};


// login
exports.login = async (req, res) => {
    try {
        // get data from req body
        const { email, password } = req.body;
        // validation data 
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: 'Please Fill up All the Required Fields',
            });
        }

        // check if user exists or not
        const user = await User.findOne({ email }).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User is not Registered with Us, Please Signup to Continue'
            });
        }

        // generate jwt token , after password matching
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                {
                    email: user.email,
                    id: user._id,
                    role: user.role,
                    accountType: user.accountType,
                },
                process.env.JWT_SECRET, {
                expiresIn: "2h",
            });

            user.token = token;
            user.password = undefined;

            //  create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: 'User Login Success',
            });
        }

        else {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect',
            });
        }
    }

    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Login Failure, Please try again',
        });
    }
};


// changePassword
exports.changePassword = async (req, res) => {
    try {
        // get data from req body
        const userDetails = await User.findById(req.user.id);

        // get oldPass , newPass , confirmNewPass
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // validation of old pass
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if (!isPasswordMatch) {
            // if old pass does not match return response
            return res.status(401).json({
                success: false,
                message: 'The Password is incorrect'
            });
        }

        // Match new pass and confirm new pass
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: 'The Password and Confirm Password does not match'
            });
        }

        // update password in DB
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
        );

        // send notification mail - password updated
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully: ", emailResponse.response);
        }
        catch (error) {
            console.error("Error occurred while sending email:", error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }

        // return response
        return res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });
    }
    catch (error) {
        console.log("Error occurred while updating password", error);
        return res.status(500).json({
            success: false,
            message: 'Error occurred while updating password',
            error: error.message,
        });
    }
};