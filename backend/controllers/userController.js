import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json(user.toFrontendObject());
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id/profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Basic updates
      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.isOnline = req.body.isOnline !== undefined ? req.body.isOnline : user.isOnline;
      user.avatarUrl = req.body.avatarUrl || user.avatarUrl;

      // Role specific updates
      if (user.role === 'entrepreneur') {
        user.startupName = req.body.startupName || user.startupName;
        user.pitchSummary = req.body.pitchSummary || user.pitchSummary;
        user.fundingNeeded = req.body.fundingNeeded || user.fundingNeeded;
        user.industry = req.body.industry || user.industry;
        user.location = req.body.location || user.location;
        user.foundedYear = req.body.foundedYear || user.foundedYear;
        user.teamSize = req.body.teamSize || user.teamSize;
      } else if (user.role === 'investor') {
        user.investmentInterests = req.body.investmentInterests || user.investmentInterests;
        user.investmentStage = req.body.investmentStage || user.investmentStage;
        user.portfolioCompanies = req.body.portfolioCompanies || user.portfolioCompanies;
        user.totalInvestments = req.body.totalInvestments || user.totalInvestments;
        user.minimumInvestment = req.body.minimumInvestment || user.minimumInvestment;
        user.maximumInvestment = req.body.maximumInvestment || user.maximumInvestment;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json(updatedUser.toFrontendObject());
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
