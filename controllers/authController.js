const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateMembershipId = () => {
  return "LIB" + Date.now();
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );
};

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      memberType
    } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
        errorCode: "DUPLICATE_EMAIL"
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      memberType: memberType || "student",
      role: "member",
      membershipId: generateMembershipId()
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Member registered successfully",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        memberType: user.memberType,
        membershipId: user.membershipId
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const {
      email,
      password
    } = req.body;

    const user = await User
      .findOne({ email })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive"
      });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role:
          user.role === "user"
            ? "member"
            : user.role,
        memberType: user.memberType,
        membershipId: user.membershipId
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      email
    } = req.body;

    const user = await User.findById(
      req.user.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already registered"
        });
      }

      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
};