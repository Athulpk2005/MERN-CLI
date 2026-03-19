import asyncHandler from 'express-async-handler';

// @desc    Get test message
// @route   GET /api/test
// @access  Public
export const getTestMessage = asyncHandler(async (req, res) => {
  res.json({ message: 'Backend API is connected and working!' });
});
